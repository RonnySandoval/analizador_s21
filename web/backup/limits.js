(function () {
    const WARN_BYTES = 18 * 1024 * 1024;
    const HARD_MAX_BYTES = 24 * 1024 * 1024;

    function assessBackupSize(byteLength) {
        const size = Number(byteLength) || 0;
        if (size > HARD_MAX_BYTES) {
            return {
                ok: false,
                level: 'error',
                size,
                message: `La copia pesa ${(size / (1024 * 1024)).toFixed(1)} MB y supera el límite de Gmail (~24 MB). Descargue un ZIP o borre cargas antiguas.`,
            };
        }
        if (size > WARN_BYTES) {
            return {
                ok: true,
                level: 'warn',
                size,
                message: `La copia es grande (${(size / (1024 * 1024)).toFixed(1)} MB). Gmail puede fallar cerca de 25 MB.`,
            };
        }
        return { ok: true, level: 'ok', size, message: '' };
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { WARN_BYTES, HARD_MAX_BYTES, assessBackupSize });
})();
