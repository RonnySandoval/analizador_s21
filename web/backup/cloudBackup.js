(function () {
    const Storage = () => window.S21DashboardStorage;
    const Backup = () => window.S21DashboardBackup;
    const Process = () => window.S21DataProcess;
    const B = () => window.S21Backup;
    const Provider = () => window.S21GmailBackupProvider;

    function getCurrentGmailRemoteId() {
        try {
            return localStorage.getItem('s21_gmail_current_remote') || null;
        } catch {
            return null;
        }
    }

    function setCurrentGmailRemoteId(id) {
        try {
            if (id) localStorage.setItem('s21_gmail_current_remote', id);
            else localStorage.removeItem('s21_gmail_current_remote');
        } catch {
            /* ignore */
        }
    }

    function isInsufficientScopeError(err) {
        const msg = String(err?.message || err || '');
        return /insufficient.*(auth|scope)|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(msg);
    }

    async function ensureGmailAuth(force = false) {
        await window.S21GoogleAuth.authenticate({ force });
    }

    async function withScopeRetry(fn) {
        try {
            return await fn();
        } catch (err) {
            if (!isInsufficientScopeError(err)) throw err;
            window.S21GoogleAuth.disconnect();
            await ensureGmailAuth(true);
            return fn();
        }
    }

    async function uploadBackupToGmail() {
        return Process().run({
            title: 'Copia en Gmail',
            steps: Process().GMAIL_UPLOAD_STEPS,
            successMessage: 'Copia guardada en Gmail',
            work: async (api) => {
                api.setStep('preparing');
                await ensureGmailAuth(false);
                api.setStep('compressing');
                const packed = await Backup().exportBackupZip({
                    kind: 'gmail',
                    onProgress: (s) => {
                        if (s === 'compressing') api.setStep('compressing');
                    },
                });
                const assessment = B().assessBackupSize(packed.blob.size);
                if (!assessment.ok) throw new Error(assessment.message);

                api.setStep('uploading');
                const ref = await withScopeRetry(() =>
                    Provider().createBackup(packed.blob, packed.manifest));
                setCurrentGmailRemoteId(ref.remoteId);
                await Backup().markBackupDone('gmail');
                api.setStep('done');
                return ref;
            },
        });
    }

    async function listGmailBackups() {
        await Provider().authenticate();
        return Provider().listBackups();
    }

    async function restoreFromGmail(remoteId) {
        return Process().run({
            title: 'Restaurar desde Gmail',
            steps: Process().GMAIL_RESTORE_STEPS,
            successMessage: 'Datos restaurados desde Gmail',
            work: async (api) => {
                api.setStep('downloading');
                const blob = await Provider().downloadBackup(remoteId);
                api.setStep('validating');
                const file = new File([blob], 'gmail-restore.zip', { type: 'application/zip' });
                // Reuse import without nested process overlay: apply directly
                const read = await Backup().readBackupFile(file);
                const unpacked = read.unpacked;
                if (unpacked) {
                    const validated = await B().validateUnpacked(unpacked, { requireManifest: true });
                    if (!validated.ok) throw new Error(validated.error);
                }

                api.setStep('restoring');
                const currentBlob = await (async () => {
                    try {
                        const payload = await Backup().buildPayload();
                        if (!payload.datasets?.length) return null;
                        return (await B().packAndVerify({ payload, filesMap: {}, kind: 'snapshot' })).blob;
                    } catch {
                        return null;
                    }
                })();

                await B().replaceWithRollback({
                    currentStateBlob: currentBlob,
                    applyFn: async () => {
                        await Backup().applyPayloadReplace(read.payload);
                    },
                    rollbackFn: async (snapBlob) => {
                        const u = await B().unpackBackupZip(snapBlob, { requireManifest: true });
                        await Backup().applyPayloadReplace(u.payload);
                    },
                });

                setCurrentGmailRemoteId(remoteId);
                await Backup().markBackupDone('gmail');
                api.setStep('done');

                const active = await Storage().getActiveDataset();
                if (active?.packages?.length) {
                    await window.S21DashboardDatos?.renderHistory?.();
                    // Trigger dashboard reload via custom event
                    window.dispatchEvent(new CustomEvent('s21-backup-restored', { detail: { dataset: active } }));
                } else {
                    window.dispatchEvent(new CustomEvent('s21-backup-restored', { detail: { dataset: null } }));
                }
                Backup().updateBackupStatusUi?.();
                return { remoteId };
            },
        });
    }

    window.S21CloudBackup = {
        uploadBackupToGmail,
        listGmailBackups,
        restoreFromGmail,
        getCurrentGmailRemoteId,
        setCurrentGmailRemoteId,
    };
})();
