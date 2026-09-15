(function () {
    const BACKUP_FORMAT_VERSION = 1;
    const SCHEMA_VERSION = 2;
    const GMAIL_BACKUP_SUBJECT_TAG = '[S21_ANALIZADOR_BACKUP]';
    const GMAIL_BACKUP_META_MARKER = 'S21_ANALIZADOR_BACKUP_META';
    const ZIP_BACKUP_JSON = 'backup.json';
    const ZIP_MANIFEST = 'manifest.json';
    const ZIP_FILES_PREFIX = 'files/';

    const PREF_KEYS = [
        'analisis_servicio_prefs',
        'analisis_servicio_grupos',
        'analisis_servicio_perfil_aliases',
        'analisis_servicio_chart_profiles',
        'analisis_servicio_export_groups',
    ];

    const META_KEYS = {
        lastBackupAt: 'lastBackupAt',
        lastBackupKind: 'lastBackupKind',
        lastChangedAt: 'lastChangedAt',
        nextBackupAt: 'nextBackupAt',
        autoBackup: 'autoBackup',
        backupIntervalMs: 'backupIntervalMs',
        folderHandleGranted: 'folderHandleGranted',
        currentGmailRemoteId: 'currentGmailRemoteId',
    };

    const DEFAULT_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, {
        BACKUP_FORMAT_VERSION,
        SCHEMA_VERSION,
        GMAIL_BACKUP_SUBJECT_TAG,
        GMAIL_BACKUP_META_MARKER,
        ZIP_BACKUP_JSON,
        ZIP_MANIFEST,
        ZIP_FILES_PREFIX,
        PREF_KEYS,
        META_KEYS,
        DEFAULT_BACKUP_INTERVAL_MS,
    });
})();
