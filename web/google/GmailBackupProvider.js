(function () {
    function findAttachmentPart(payload) {
        if (!payload) return null;
        if (payload.filename && /\.zip$/i.test(payload.filename) && payload.body?.attachmentId) {
            return payload;
        }
        for (const part of payload.parts || []) {
            const found = findAttachmentPart(part);
            if (found) return found;
        }
        return null;
    }

    function extractBodyText(payload) {
        if (!payload) return '';
        if (payload.mimeType === 'text/plain' && payload.body?.data) {
            return new TextDecoder().decode(window.S21GmailMime.decodeBase64Url(payload.body.data));
        }
        for (const part of payload.parts || []) {
            const t = extractBodyText(part);
            if (t) return t;
        }
        return '';
    }

    function parseMetaFromBody(body) {
        const B = window.S21Backup;
        const marker = B.GMAIL_BACKUP_META_MARKER;
        const idx = body.indexOf(marker);
        if (idx < 0) return null;
        const after = body.slice(idx + marker.length).trim();
        const jsonMatch = after.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        try {
            return JSON.parse(jsonMatch[0]);
        } catch {
            return null;
        }
    }

    function parseMetaFromSubject(subject) {
        const B = window.S21Backup;
        const tag = B.GMAIL_BACKUP_SUBJECT_TAG;
        if (!subject || !subject.includes(tag)) return null;
        const rest = subject.replace(tag, '').trim();
        const parts = rest.split(/\s+/);
        return {
            createdAt: parts[0] || null,
            backupId: parts[1] || null,
        };
    }

    function headerValue(message, name) {
        const headers = message.payload?.headers || [];
        const h = headers.find(x => x.name?.toLowerCase() === name.toLowerCase());
        return h?.value || '';
    }

    function messageToRemoteRef(message) {
        const subject = headerValue(message, 'Subject');
        const body = extractBodyText(message.payload);
        const meta = parseMetaFromBody(body) || parseMetaFromSubject(subject) || {};
        return {
            remoteId: message.id,
            backupId: meta.backupId || message.id,
            createdAt: meta.createdAt || (message.internalDate
                ? new Date(Number(message.internalDate)).toISOString()
                : new Date().toISOString()),
            size: meta.size || Number(message.sizeEstimate) || 0,
            deviceName: meta.deviceName || '',
            kind: meta.kind || 'gmail',
            checksum: meta.checksum || '',
            datasetCount: meta.datasetCount || 0,
        };
    }

    async function authenticate() {
        return window.S21GoogleAuth.authenticate();
    }

    async function createBackup(blob, manifest) {
        const B = window.S21Backup;
        await authenticate();
        const email = window.S21GoogleAuth.getEmail() || 'me';
        const filename = `s21-backup-${manifest.backupId}.zip`;
        const subject = `${B.GMAIL_BACKUP_SUBJECT_TAG} ${manifest.createdAt} ${manifest.backupId}`;
        const bodyText = [
            'Copia de seguridad de Análisis de Servicio (analizador S-21).',
            'No reenvíe este mensaje. Contiene datos de la congregación.',
            `ID: ${manifest.backupId}`,
            `Dispositivo: ${manifest.deviceName || ''}`,
            `Cargas: ${manifest.datasetCount || 0}`,
            `Tamaño: ${manifest.size || blob.size} bytes`,
        ].join('\n');

        const metaJson = {
            backupId: manifest.backupId,
            createdAt: manifest.createdAt,
            checksum: manifest.checksum,
            size: manifest.size || blob.size,
            deviceName: manifest.deviceName,
            kind: manifest.kind || 'gmail',
            datasetCount: manifest.datasetCount,
            schemaVersion: manifest.schemaVersion,
        };

        const raw = await window.S21GmailMime.buildBackupMimeMessage({
            to: email,
            subject,
            bodyText,
            filename,
            zipBlob: blob,
            metaJson,
        });

        const inserted = await window.S21GmailClient.insertMessage(raw);
        return {
            remoteId: inserted.id,
            backupId: manifest.backupId,
            createdAt: manifest.createdAt,
            size: manifest.size || blob.size,
            deviceName: manifest.deviceName,
            kind: 'gmail',
            checksum: manifest.checksum,
        };
    }

    async function listBackups() {
        const B = window.S21Backup;
        await authenticate();
        const query = `subject:"${B.GMAIL_BACKUP_SUBJECT_TAG}"`;
        const ids = await window.S21GmailClient.listMessageIds(query, 40);
        const refs = [];
        for (const id of ids) {
            try {
                const msg = await window.S21GmailClient.getMessage(id, 'full');
                refs.push(messageToRemoteRef(msg));
            } catch (err) {
                console.warn('listBackups skip', id, err);
            }
        }
        refs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return refs;
    }

    async function downloadBackup(remoteId) {
        await authenticate();
        const msg = await window.S21GmailClient.getMessage(remoteId, 'full');
        const part = findAttachmentPart(msg.payload);
        if (!part?.body?.attachmentId) {
            throw new Error('El mensaje no tiene adjunto ZIP');
        }
        const data = await window.S21GmailClient.getAttachment(remoteId, part.body.attachmentId);
        const bytes = window.S21GmailMime.decodeBase64Url(data);
        return new Blob([bytes], { type: 'application/zip' });
    }

    window.S21GmailBackupProvider = {
        authenticate,
        createBackup,
        listBackups,
        downloadBackup,
        messageToRemoteRef,
        parseMetaFromBody,
        parseMetaFromSubject,
    };
})();
