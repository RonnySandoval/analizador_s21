(function () {
    const VERSION = '1.0.0';
    let deferredPrompt = null;
    const bar = document.getElementById('pwa-install-bar');
    const btnInstall = document.getElementById('btn-pwa-install');
    const btnDismiss = document.getElementById('btn-pwa-dismiss');
    const versionEl = document.getElementById('app-version');

    if (versionEl) versionEl.textContent = `v${VERSION}`;

    function syncPwaBarLayout(visible) {
        document.body.classList.toggle('pwa-bar-visible', visible);
    }

    function showInstallBar() {
        if (!bar || localStorage.getItem('pwa_install_dismissed')) return;
        syncPwaBarLayout(true);
        if (window.S21Motion?.setOpen) {
            window.S21Motion.setOpen(bar, true, { from: 'bottom' });
            return;
        }
        bar.classList.remove('hidden');
        bar.hidden = false;
        bar.classList.add('is-open');
    }

    function hideInstallBar() {
        if (!bar) return;
        const motion = window.S21Motion;
        const done = motion?.setOpen
            ? motion.setOpen(bar, false, { from: 'bottom' })
            : Promise.resolve();
        if (!motion?.setOpen) {
            bar.classList.add('hidden');
            bar.hidden = true;
            bar.classList.remove('is-open');
        }
        done.then(() => {
            if (motion?.isOpen(bar)) return;
            syncPwaBarLayout(false);
        });
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(window.s21Url('sw.js')).catch(() => {});
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBar();
    });

    btnInstall?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        hideInstallBar();
    });

    btnDismiss?.addEventListener('click', () => {
        localStorage.setItem('pwa_install_dismissed', '1');
        hideInstallBar();
    });

    window.addEventListener('appinstalled', () => {
        hideInstallBar();
        deferredPrompt = null;
    });
})();
