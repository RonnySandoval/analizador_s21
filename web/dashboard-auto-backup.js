(function () {
    const Storage = () => window.S21DashboardStorage;
    const Backup = () => window.S21DashboardBackup;
    const B = () => window.S21Backup;

    let started = false;

    async function isAutoBackupEnabled() {
        const S = Storage();
        const flag = await S.getMeta('autoBackup');
        return flag !== false;
    }

    async function hasData() {
        const list = await Storage().listDatasets();
        return list.length > 0;
    }

    async function isDue() {
        const S = Storage();
        const pending = await Backup().hasPendingChanges();
        if (!pending) return false;
        const next = Number(await S.getMeta('nextBackupAt')) || 0;
        return Date.now() >= next;
    }

    async function runAutoBackupIfDue() {
        try {
            if (!Storage()?.isAvailable() || !Backup()) return;
            if (!(await isAutoBackupEnabled())) return;
            if (!(await hasData())) return;
            if (!(await isDue())) return;

            const handle = await Backup().loadFolderHandle();
            if (handle && await Backup().ensureFolderPermission(handle)) {
                await Backup().writeBackupToFolder({ handle });
                Backup().hideBackupBanner();
                return;
            }

            if (sessionStorage.getItem('s21_backup_banner_dismissed') === '1') return;
            Backup().showBackupBanner('Hay cambios sin copia de seguridad. Guarde una copia ahora.');
        } catch (err) {
            console.warn('autoBackup', err);
            if (sessionStorage.getItem('s21_backup_banner_dismissed') === '1') return;
            Backup().showBackupBanner('No se pudo guardar la copia automática. Descargue un ZIP.');
        }
    }

    function start() {
        if (started) return;
        started = true;
        runAutoBackupIfDue();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') runAutoBackupIfDue();
        });
        window.addEventListener('s21-backup-done', () => Backup()?.hideBackupBanner?.());
    }

    window.S21AutoBackup = {
        start,
        runAutoBackupIfDue,
        isDue,
    };
})();
