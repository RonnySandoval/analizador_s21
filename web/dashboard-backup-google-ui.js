(function () {
    const Auth = () => window.S21GoogleAuth;
    const Cloud = () => window.S21CloudBackup;
    const Backup = () => window.S21DashboardBackup;

    function $(id) {
        return document.getElementById(id);
    }

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatTs(iso) {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
        } catch {
            return iso;
        }
    }

    function setHidden(el, hide) {
        if (!el) return;
        el.classList.toggle('hidden', hide);
        el.hidden = hide;
    }

    async function refreshGoogleUi() {
        const status = $('backup-google-status');
        const connectBtn = $('btn-backup-google-connect');
        const disconnectBtn = $('btn-backup-google-disconnect');
        const actions = $('backup-google-actions');
        const configured = await Auth()?.isConfigured?.();

        if (!configured) {
            if (status) status.textContent = 'Google no configurado (falta Client ID).';
            if (connectBtn) connectBtn.disabled = true;
            setHidden(disconnectBtn, true);
            setHidden(actions, true);
            return;
        }

        const connected = Auth().isAuthenticated();
        const email = Auth().getEmail();
        if (status) {
            status.textContent = connected
                ? `Conectado: ${email || 'cuenta Google'}`
                : 'No conectado';
        }
        if (connectBtn) {
            connectBtn.textContent = connected ? 'Volver a conectar' : 'Conectar Google';
            connectBtn.disabled = false;
        }
        setHidden(disconnectBtn, !connected);
        setHidden(actions, !connected);
    }

    async function renderGmailList(backups) {
        const list = $('backup-gmail-list');
        if (!list) return;
        if (!backups?.length) {
            list.innerHTML = '<p class="datos-muted">No hay copias con la etiqueta S-21 en Gmail.</p>';
            return;
        }
        const currentId = Cloud().getCurrentGmailRemoteId();
        const pending = await Backup().hasPendingChanges();
        list.innerHTML = backups.map(b => {
            const isCurrent = b.remoteId === currentId && !pending;
            return `<article class="backup-gmail-card${isCurrent ? ' is-current' : ''}" data-remote-id="${escapeHtml(b.remoteId)}">
                <div class="backup-gmail-card-main">
                    <strong>${escapeHtml(b.backupId)}</strong>
                    <span class="backup-gmail-meta">${formatTs(b.createdAt)}${b.deviceName ? ` · ${escapeHtml(b.deviceName)}` : ''}</span>
                    <span class="backup-gmail-meta">${b.datasetCount ? `${b.datasetCount} cargas · ` : ''}${b.size ? `${Math.round(b.size / 1024)} KB` : ''}</span>
                    ${isCurrent ? '<span class="backup-current-badge">Copia actual</span>' : ''}
                </div>
                <button type="button" class="btn-secondary btn-compact btn-gmail-restore" data-remote-id="${escapeHtml(b.remoteId)}">Restaurar</button>
            </article>`;
        }).join('');

        list.querySelectorAll('.btn-gmail-restore').forEach(btn => {
            btn.addEventListener('click', () => confirmRestore(btn.dataset.remoteId));
        });
    }

    let pendingRemoteId = null;

    function openGmailRestoreModal(remoteId) {
        pendingRemoteId = remoteId;
        const modal = $('backup-gmail-restore-modal');
        if (!modal) return;
        const motion = window.S21Motion;
        if (motion?.setOpen) motion.setOpen(modal, true, { from: 'scale' });
        else {
            modal.classList.remove('hidden');
            modal.hidden = false;
        }
    }

    function closeGmailRestoreModal() {
        pendingRemoteId = null;
        const modal = $('backup-gmail-restore-modal');
        if (!modal) return;
        const motion = window.S21Motion;
        if (motion?.setOpen) motion.setOpen(modal, false, { from: 'scale' });
        else {
            modal.classList.add('hidden');
            modal.hidden = true;
        }
    }

    function confirmRestore(remoteId) {
        openGmailRestoreModal(remoteId);
    }

    function bindUi() {
        $('btn-backup-google-connect')?.addEventListener('click', async () => {
            try {
                await Auth().authenticate({ force: true });
                await refreshGoogleUi();
            } catch (err) {
                if (String(err?.message || '').includes('popup') || err?.type === 'popup_closed') return;
                alert(err?.message || String(err));
            }
        });

        $('btn-backup-google-disconnect')?.addEventListener('click', () => {
            Auth().disconnect();
            refreshGoogleUi();
            const list = $('backup-gmail-list');
            if (list) list.innerHTML = '';
        });

        $('btn-backup-gmail-upload')?.addEventListener('click', async () => {
            try {
                await Cloud().uploadBackupToGmail();
                await refreshGoogleUi();
            } catch {
                /* overlay */
            }
        });

        $('btn-backup-gmail-list')?.addEventListener('click', async () => {
            try {
                const backups = await Cloud().listGmailBackups();
                await renderGmailList(backups);
            } catch (err) {
                alert(err?.message || String(err));
            }
        });

        $('backup-gmail-restore-cancel')?.addEventListener('click', closeGmailRestoreModal);
        document.querySelectorAll('[data-gmail-restore-close]').forEach(el => {
            el.addEventListener('click', closeGmailRestoreModal);
        });
        $('backup-gmail-restore-confirm')?.addEventListener('click', async () => {
            const id = pendingRemoteId;
            closeGmailRestoreModal();
            if (!id) return;
            try {
                await Cloud().restoreFromGmail(id);
            } catch {
                /* overlay */
            }
        });

        window.addEventListener('s21-google-auth', () => refreshGoogleUi());
    }

    function init() {
        bindUi();
        refreshGoogleUi();
    }

    window.S21BackupGoogleUi = { init, refreshGoogleUi, renderGmailList };
})();
