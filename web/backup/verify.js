(function () {
    async function packAndVerify({ payload, filesMap = {}, kind = 'manual' }) {
        const B = window.S21Backup;
        const backupJsonText = JSON.stringify(payload);
        const checksum = await B.checksumBackupContent(backupJsonText, filesMap);
        const backupId = B.createBackupId();
        const manifestDraft = B.createManifest({
            backupId,
            checksum,
            kind,
            attachmentCount: Object.keys(filesMap).length,
            datasetCount: Array.isArray(payload.datasets) ? payload.datasets.length : 0,
            dataVersion: payload.dataVersion || Date.now(),
            schemaVersion: payload.schemaVersion ?? B.SCHEMA_VERSION,
            formatVersion: payload.version ?? B.BACKUP_FORMAT_VERSION,
        });

        const blob = await B.packBackupZip({
            backupJsonText,
            filesMap,
            manifest: manifestDraft,
        });

        const manifest = { ...manifestDraft, size: blob.size };
        const finalBlob = await B.packBackupZip({
            backupJsonText,
            filesMap,
            manifest,
        });

        await verifyRoundTrip(finalBlob, { requireManifest: true });

        return {
            blob: finalBlob,
            manifest: { ...manifest, size: finalBlob.size },
            filename: `s21-backup-${backupId}.zip`,
        };
    }

    async function verifyRoundTrip(blob, options = {}) {
        const B = window.S21Backup;
        const unpacked = await B.unpackBackupZip(blob, {
            requireManifest: options.requireManifest !== false,
        });
        const result = await B.validateUnpacked(unpacked, {
            requireManifest: options.requireManifest !== false,
            allowLegacy: false,
        });
        if (!result.ok) {
            throw new Error(result.error || 'Verificación del ZIP falló');
        }
        return unpacked;
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { packAndVerify, verifyRoundTrip });
})();
