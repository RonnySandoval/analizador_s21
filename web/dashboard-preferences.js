(function () {
    const PREFS_KEY = 'analisis_servicio_prefs';
    const DEFAULTS = { theme: 'dark', fontScale: 1 };

    function loadPrefs() {
        try {
            const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
            if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
            return {
                theme: raw.theme === 'light' ? 'light' : 'dark',
                fontScale: clampFontScale(raw.fontScale),
            };
        } catch {
            return { ...DEFAULTS };
        }
    }

    function clampFontScale(value) {
        const n = Number(value);
        if (Number.isNaN(n)) return 1;
        return Math.min(1.25, Math.max(0.85, Math.round(n * 100) / 100));
    }

    function savePrefs(prefs) {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }

    function applyPrefs(prefs) {
        const root = document.documentElement;
        root.dataset.theme = prefs.theme;
        root.style.setProperty('--app-font-scale', String(prefs.fontScale));
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = prefs.theme === 'light' ? '#e8eaee' : '#00e5ff';
        }
        window.dispatchEvent(new CustomEvent('s21-prefs-changed', { detail: { ...prefs } }));
    }

    function initPreferencesUI() {
        const prefs = loadPrefs();
        applyPrefs(prefs);

        const themeToggle = document.getElementById('pref-theme-toggle');
        const fontSlider = document.getElementById('pref-font-scale');
        const fontValue = document.getElementById('pref-font-scale-value');
        const settingsBlock = document.getElementById('datos-settings-block');

        if (themeToggle) {
            themeToggle.checked = prefs.theme === 'light';
            themeToggle.addEventListener('change', () => {
                prefs.theme = themeToggle.checked ? 'light' : 'dark';
                savePrefs(prefs);
                applyPrefs(prefs);
            });
        }

        if (fontSlider) {
            fontSlider.min = '85';
            fontSlider.max = '125';
            fontSlider.step = '5';
            fontSlider.value = String(Math.round(prefs.fontScale * 100));
            updateFontLabel(fontValue, prefs.fontScale);
            fontSlider.addEventListener('input', () => {
                prefs.fontScale = clampFontScale(Number(fontSlider.value) / 100);
                savePrefs(prefs);
                applyPrefs(prefs);
                updateFontLabel(fontValue, prefs.fontScale);
            });
        }

        const title = document.querySelector('.dashboard-header h1');
        title?.addEventListener('contextmenu', e => {
            e.preventDefault();
            window.S21DashboardDatos?.setSettingsTab?.('apariencia');
            window.S21DashboardDatos?.openPanel?.();
            settingsBlock?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    function updateFontLabel(el, scale) {
        if (!el) return;
        const pct = Math.round(scale * 100);
        el.textContent = pct === 100 ? 'Normal' : `${pct}%`;
    }

    applyPrefs(loadPrefs());

    window.S21DashboardPreferences = {
        loadPrefs,
        savePrefs,
        applyPrefs,
        initPreferencesUI,
        clampFontScale,
    };

    document.addEventListener('DOMContentLoaded', initPreferencesUI);
})();
