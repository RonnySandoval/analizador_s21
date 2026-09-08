(function () {
    const VERSION = '1.0.0';
    let deferredPrompt = null;
    const bar = document.getElementById('pwa-install-bar');
    const btnInstall = document.getElementById('btn-pwa-install');
    const btnDismiss = document.getElementById('btn-pwa-dismiss');
    const versionEl = document.getElementById('app-version');

    if (versionEl) versionEl.textContent = `v${VERSION}`;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (bar && !localStorage.getItem('pwa_install_dismissed')) {
            bar.classList.add('visible');
        }
    });

    btnInstall?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        bar?.classList.remove('visible');
    });

    btnDismiss?.addEventListener('click', () => {
        localStorage.setItem('pwa_install_dismissed', '1');
        bar?.classList.remove('visible');
    });

    window.addEventListener('appinstalled', () => {
        bar?.classList.remove('visible');
        deferredPrompt = null;
    });
})();
