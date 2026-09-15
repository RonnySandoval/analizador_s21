(function () {
    const DEVICE_ID_KEY = 's21_backup_device_id';

    function getDeviceId() {
        try {
            let id = localStorage.getItem(DEVICE_ID_KEY);
            if (!id) {
                id = (crypto.randomUUID && crypto.randomUUID()) || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                localStorage.setItem(DEVICE_ID_KEY, id);
            }
            return id;
        } catch {
            return `dev-ephemeral-${Date.now()}`;
        }
    }

    function getDeviceName() {
        const ua = navigator.userAgent || '';
        let browser = 'Navegador';
        if (/Edg\//.test(ua)) browser = 'Edge';
        else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
        else if (/Firefox\//.test(ua)) browser = 'Firefox';
        else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

        let platform = 'desktop';
        if (/Android/i.test(ua)) platform = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS';
        else if (/Windows/i.test(ua)) platform = 'Windows';
        else if (/Mac OS/i.test(ua)) platform = 'macOS';
        else if (/Linux/i.test(ua)) platform = 'Linux';

        return `${browser} · ${platform}`;
    }

    function getPlatform() {
        const ua = navigator.userAgent || '';
        if (/Android/i.test(ua)) return 'android';
        if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
        if (/Windows/i.test(ua)) return 'windows';
        if (/Mac OS/i.test(ua)) return 'macos';
        if (/Linux/i.test(ua)) return 'linux';
        return 'unknown';
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { getDeviceId, getDeviceName, getPlatform });
})();
