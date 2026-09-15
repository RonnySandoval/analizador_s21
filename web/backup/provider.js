(function () {
    /**
     * BackupProvider interface (documented for implementers):
     * - authenticate()
     * - createBackup(blob, manifest) -> RemoteBackupRef
     * - listBackups() -> RemoteBackupRef[]
     * - downloadBackup(remoteId) -> Blob
     *
     * RemoteBackupRef: { remoteId, backupId, createdAt, size, deviceName, kind, checksum }
     */
    window.S21Backup = window.S21Backup || {};
    window.S21Backup.BackupProvider = {
        /** @abstract */
        async authenticate() { throw new Error('Not implemented'); },
        async createBackup() { throw new Error('Not implemented'); },
        async listBackups() { throw new Error('Not implemented'); },
        async downloadBackup() { throw new Error('Not implemented'); },
    };
})();
