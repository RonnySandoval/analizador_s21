(function () {
    function createBackupId(date = new Date()) {
        const pad = n => String(n).padStart(2, '0');
        const stamp = [
            date.getUTCFullYear(),
            pad(date.getUTCMonth() + 1),
            pad(date.getUTCDate()),
            '-',
            pad(date.getUTCHours()),
            pad(date.getUTCMinutes()),
            pad(date.getUTCSeconds()),
        ].join('');
        const suffix = Math.random().toString(36).slice(2, 8);
        return `BACKUP-${stamp}-${suffix}`;
    }

    function createManifest(opts) {
        const B = window.S21Backup;
        const now = opts.createdAt || new Date().toISOString();
        return {
            backupId: opts.backupId || createBackupId(),
            createdAt: now,
            checksum: opts.checksum || '',
            size: opts.size || 0,
            deviceId: opts.deviceId || B.getDeviceId(),
            deviceName: opts.deviceName || B.getDeviceName(),
            platform: opts.platform || B.getPlatform(),
            kind: opts.kind || 'manual',
            schemaVersion: opts.schemaVersion ?? B.SCHEMA_VERSION,
            formatVersion: opts.formatVersion ?? B.BACKUP_FORMAT_VERSION,
            attachmentCount: opts.attachmentCount || 0,
            dataVersion: opts.dataVersion || Date.now(),
            datasetCount: opts.datasetCount || 0,
            app: 'analizador_s21',
        };
    }

    function parseManifest(raw) {
        if (!raw || typeof raw !== 'object') return null;
        if (!raw.backupId || !raw.checksum) return null;
        return raw;
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { createBackupId, createManifest, parseManifest });
})();
