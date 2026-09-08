(function () {
    const VERSION = '1.0.0';
    let deferredPrompt = null;
    const bar = document.getElementById('pwa-install-bar');
    const btnInstall = document.getElementById('btn-pwa-install');
    const btnDismiss = document.getElementById('btn-pwa-dismiss');
    const versionEl = document.getElementById('app-version');

    if (versionEl) versionEl.textContent = `v${VERSION}`;

    function syncPwaBarLayout() {
        document.body.classList.toggle('pwa-bar-visible', !!bar?.classList.contains('visible'));
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(window.s21Url('sw.js')).catch(() => {});
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (bar && !localStorage.getItem('pwa_install_dismissed')) {
            bar.classList.add('visible');
            syncPwaBarLayout();
        }
    });

    btnInstall?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        bar?.classList.remove('visible');
        syncPwaBarLayout();
    });

    btnDismiss?.addEventListener('click', () => {
        localStorage.setItem('pwa_install_dismissed', '1');
        bar?.classList.remove('visible');
        syncPwaBarLayout();
    });

    window.addEventListener('appinstalled', () => {
        bar?.classList.remove('visible');
        syncPwaBarLayout();
        deferredPrompt = null;
    });
})();
