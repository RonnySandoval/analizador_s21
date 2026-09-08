(function () {
    const PREFS_KEY = 'analisis_servicio_prefs';
    const DEFAULTS = { theme: 'dark', fontScale: 1 };

    let prefs = loadPrefs();

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

    function savePrefs(next) {
        prefs = next;
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }

    function applyPrefs(next) {
        prefs = next;
        const root = document.documentElement;
        root.dataset.theme = prefs.theme;
        root.style.setProperty('--app-font-scale', String(prefs.fontScale));
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = prefs.theme === 'light' ? '#e8eaee' : '#00e5ff';
        }
        syncThemeChoiceButtons(prefs.theme);
        window.dispatchEvent(new CustomEvent('s21-prefs-changed', { detail: { ...prefs } }));
    }

    function setTheme(theme) {
        const next = { ...prefs, theme: theme === 'light' ? 'light' : 'dark' };
        savePrefs(next);
        applyPrefs(next);
    }

    function syncThemeChoiceButtons(theme) {
        document.querySelectorAll('[data-theme-choice]').forEach(btn => {
            const active = btn.dataset.themeChoice === theme;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function bindThemeChoiceButtons() {
        document.querySelectorAll('[data-theme-choice]').forEach(btn => {
            btn.addEventListener('click', () => setTheme(btn.dataset.themeChoice));
        });
    }

    function initPreferencesUI() {
        prefs = loadPrefs();
        applyPrefs(prefs);

        const fontSlider = document.getElementById('pref-font-scale');
        const fontValue = document.getElementById('pref-font-scale-value');
        const settingsBlock = document.getElementById('datos-settings-block');

        bindThemeChoiceButtons();

        if (fontSlider) {
            fontSlider.min = '85';
            fontSlider.max = '125';
            fontSlider.step = '5';
            fontSlider.value = String(Math.round(prefs.fontScale * 100));
            updateFontLabel(fontValue, prefs.fontScale);
            fontSlider.addEventListener('input', () => {
                const next = {
                    ...prefs,
                    fontScale: clampFontScale(Number(fontSlider.value) / 100),
                };
                savePrefs(next);
                applyPrefs(next);
                updateFontLabel(fontValue, next.fontScale);
            });
        }

        document.querySelector('.dashboard-app-header-title')?.addEventListener('contextmenu', e => {
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
        setTheme,
        initPreferencesUI,
        clampFontScale,
    };

    document.addEventListener('DOMContentLoaded', initPreferencesUI);
})();
