(function () {
    const Storage = () => window.S21DashboardStorage;
    const B = () => window.S21Backup;
    const Process = () => window.S21DataProcess;

    const FOLDER_DB = 's21-backup-folder';
    const FOLDER_STORE = 'handles';
    const FOLDER_KEY = 'backupDir';

    let callbacks = {};
    let folderHandleCache = null;

    function $(id) {
        return document.getElementById(id);
    }

    function collectPrefs() {
        const prefs = {};
        for (const key of B().PREF_KEYS) {
            const raw = localStorage.getItem(key);
            if (raw == null) continue;
            try {
                prefs[key] = JSON.parse(raw);
            } catch {
                prefs[key] = raw;
            }
        }
        return prefs;
    }

    function applyPrefs(prefs) {
        if (!prefs || typeof prefs !== 'object') return;
        for (const key of B().PREF_KEYS) {
            if (!(key in prefs)) continue;
            const value = prefs[key];
            if (value == null) {
                localStorage.removeItem(key);
            } else if (typeof value === 'string') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        }
        try {
            const themePrefs = prefs.analisis_servicio_prefs;
            if (themePrefs && window.S21DashboardPreferences) {
                window.S21DashboardPreferences.savePrefs(themePrefs);
                window.S21DashboardPreferences.applyPrefs(themePrefs);
            }
        } catch {
            /* ignore */
        }
        try {
            const grupos = prefs.analisis_servicio_grupos;
            if (grupos && window.S21DashboardGrupos?.importConfig) {
                window.S21DashboardGrupos.importConfig(grupos);
            }
        } catch {
            /* ignore */
        }
    }

    async function buildPayload() {
        const S = Storage();
        if (!S?.isAvailable()) throw new Error('IndexedDB no disponible');
        const datasets = await S.listDatasets();
        const activeDatasetId = await S.getActiveDatasetId();
        const lastChangedAt = (await S.getMeta('lastChangedAt')) || Date.now();
        return {
            version: B().BACKUP_FORMAT_VERSION,
            schemaVersion: B().SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            dataVersion: lastChangedAt,
            datasets,
            activeDatasetId: activeDatasetId || null,
            prefs: collectPrefs(),
        };
    }

    async function markBackupDone(kind) {
        const S = Storage();
        const now = Date.now();
        const interval = (await S.getMeta('backupIntervalMs'))
            || B().DEFAULT_BACKUP_INTERVAL_MS;
        await S.setMeta('lastBackupAt', now);
        await S.setMeta('lastBackupKind', kind || 'zip');
        await S.setMeta('nextBackupAt', now + interval);
        updateBackupStatusUi();
        window.dispatchEvent(new CustomEvent('s21-backup-done', { detail: { kind, at: now } }));
    }

    async function hasPendingChanges() {
        const S = Storage();
        const lastChanged = Number(await S.getMeta('lastChangedAt')) || 0;
        const lastBackup = Number(await S.getMeta('lastBackupAt')) || 0;
        return lastChanged > lastBackup;
    }

    async function exportBackupZip(options = {}) {
        const kind = options.kind || 'manual';
        const onProgress = options.onProgress;
        onProgress?.('preparing');
        const payload = await buildPayload();
        onProgress?.('compressing');
        const packed = await B().packAndVerify({ payload, filesMap: {}, kind });
        if (options.markDone !== false && kind !== 'gmail' && kind !== 'snapshot') {
            await markBackupDone(kind === 'folder' ? 'folder' : 'zip');
        }
        onProgress?.('done');
        return packed;
    }

    async function downloadBackupZip() {
        return Process().run({
            title: 'Creando copia',
            steps: Process().EXPORT_STEPS,
            successMessage: 'Copia descargada',
            work: async (api) => {
                api.setStep('preparing');
                const packed = await exportBackupZip({
                    kind: 'manual',
                    onProgress: (step) => api.setStep(step),
                });
                const download = window.S21DashboardExport?.downloadBlob;
                if (!download) throw new Error('No se pudo iniciar la descarga');
                download(packed.blob, packed.filename);
                api.setStep('done');
                return packed;
            },
        });
    }

    async function wipeAllDatasets() {
        const S = Storage();
        const datasets = await S.listDatasets();
        for (const ds of datasets) {
            await S.deleteDataset(ds.id);
        }
        await S.setActiveDatasetId(null);
    }

    async function applyPayloadReplace(payload) {
        await wipeAllDatasets();
        const S = Storage();
        for (const ds of payload.datasets || []) {
            await S.putDataset(ds);
        }
        const activeId = payload.activeDatasetId;
        if (activeId && (payload.datasets || []).some(d => d.id === activeId)) {
            await S.setActiveDatasetId(activeId);
        } else if (payload.datasets?.length) {
            await S.setActiveDatasetId(payload.datasets[0].id);
        } else {
            await S.setActiveDatasetId(null);
        }
        applyPrefs(payload.prefs);
    }

    async function applyPayloadMerge(payload) {
        const S = Storage();
        const existing = await S.listDatasets();
        const byId = new Map(existing.map(d => [d.id, d]));
        let added = 0;
        let updated = 0;
        const skipped = [];

        for (const ds of payload.datasets || []) {
            if (byId.has(ds.id)) {
                await S.putDataset(ds);
                byId.set(ds.id, ds);
                updated += 1;
            } else if (byId.size >= S.MAX_DATASETS) {
                skipped.push(ds.name || ds.id);
            } else {
                await S.putDataset(ds);
                byId.set(ds.id, ds);
                added += 1;
            }
        }

        const currentActive = await S.getActiveDatasetId();
        if (!currentActive && payload.activeDatasetId && byId.has(payload.activeDatasetId)) {
            await S.setActiveDatasetId(payload.activeDatasetId);
        }

        applyPrefs(payload.prefs);
        await S.enforceMaxDatasets();
        return { added, updated, skipped };
    }

    async function readBackupFile(file) {
        const name = (file.name || '').toLowerCase();
        if (name.endsWith('.json') || file.type === 'application/json') {
            const text = await file.text();
            const payload = JSON.parse(text);
            const structural = B().validatePayloadStructure(payload);
            if (!structural.ok) throw new Error(structural.error);
            return {
                kind: 'json',
                payload,
                blob: new Blob([text], { type: 'application/json' }),
            };
        }
        const unpacked = await B().unpackBackupZip(file, { requireManifest: false });
        const validated = await B().validateUnpacked(unpacked, {
            requireManifest: !unpacked.legacy,
            allowLegacy: true,
        });
        if (!validated.ok) throw new Error(validated.error);
        return {
            kind: 'zip',
            payload: unpacked.payload,
            unpacked,
            blob: file,
        };
    }

    async function importBackup(file, mode = 'replace') {
        return Process().run({
            title: mode === 'merge' ? 'Fusionando copia' : 'Restaurando copia',
            steps: Process().IMPORT_STEPS,
            successMessage: mode === 'merge' ? 'Copia fusionada' : 'Datos restaurados',
            work: async (api) => {
                api.setStep('reading');
                const read = await readBackupFile(file);
                api.setStep('validating');
                B().validatePayloadStructure(read.payload);

                api.setStep('restoring');
                if (mode === 'merge') {
                    const stats = await applyPayloadMerge(read.payload);
                    await markBackupDone('import');
                    api.setStep('done');
                    await afterRestore();
                    return { mode, stats };
                }

                const currentBlob = await packCurrentAsSnapshotBlob();
                await B().replaceWithRollback({
                    currentStateBlob: currentBlob,
                    applyFn: async () => {
                        await applyPayloadReplace(read.payload);
                    },
                    rollbackFn: async (snapBlob) => {
                        const unpacked = await B().unpackBackupZip(snapBlob, { requireManifest: true });
                        await applyPayloadReplace(unpacked.payload);
                    },
                });
                await markBackupDone('import');
                api.setStep('done');
                await afterRestore();
                return { mode };
            },
        });
    }

    async function packCurrentAsSnapshotBlob() {
        try {
            const payload = await buildPayload();
            if (!payload.datasets?.length) return null;
            const packed = await B().packAndVerify({ payload, filesMap: {}, kind: 'snapshot' });
            return packed.blob;
        } catch {
            return null;
        }
    }

    async function afterRestore() {
        const S = Storage();
        const active = await S.getActiveDataset();
        if (active?.packages?.length) {
            await callbacks.onRestored?.(active);
        } else {
            await callbacks.onRestoredEmpty?.();
        }
        await window.S21DashboardDatos?.renderHistory?.();
        updateBackupStatusUi();
    }

    /* —— Folder (File System Access) —— */

    function openFolderDb() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(FOLDER_DB, 1);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve(req.result);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(FOLDER_STORE)) {
                    db.createObjectStore(FOLDER_STORE);
                }
            };
        });
    }

    async function saveFolderHandle(handle) {
        const db = await openFolderDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(FOLDER_STORE, 'readwrite');
            tx.objectStore(FOLDER_STORE).put(handle, FOLDER_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
        folderHandleCache = handle;
        await Storage().setMeta('folderHandleGranted', true);
    }

    async function loadFolderHandle() {
        if (folderHandleCache) return folderHandleCache;
        try {
            const db = await openFolderDb();
            const handle = await new Promise((resolve, reject) => {
                const tx = db.transaction(FOLDER_STORE, 'readonly');
                const req = tx.objectStore(FOLDER_STORE).get(FOLDER_KEY);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
            db.close();
            folderHandleCache = handle;
            return handle;
        } catch {
            return null;
        }
    }

    async function clearFolderHandle() {
        folderHandleCache = null;
        try {
            const db = await openFolderDb();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(FOLDER_STORE, 'readwrite');
                tx.objectStore(FOLDER_STORE).delete(FOLDER_KEY);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            db.close();
        } catch {
            /* ignore */
        }
        await Storage().setMeta('folderHandleGranted', false);
        updateBackupStatusUi();
    }

    async function ensureFolderPermission(handle, mode = 'readwrite') {
        if (!handle) return false;
        const opts = { mode };
        if (handle.queryPermission) {
            let perm = await handle.queryPermission(opts);
            if (perm === 'granted') return true;
            if (handle.requestPermission) {
                perm = await handle.requestPermission(opts);
                return perm === 'granted';
            }
        }
        return true;
    }

    async function pickBackupFolder() {
        if (!window.showDirectoryPicker) {
            throw new Error('Este navegador no permite vincular una carpeta. Use Chrome o Edge, o descargue el ZIP.');
        }
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        await saveFolderHandle(handle);
        updateBackupStatusUi();
        return handle;
    }

    async function writeBackupToFolder(options = {}) {
        const handle = options.handle || await loadFolderHandle();
        if (!handle) throw new Error('No hay carpeta vinculada');
        const ok = await ensureFolderPermission(handle);
        if (!ok) throw new Error('Sin permiso de escritura en la carpeta. Vuelva a vincularla.');

        const packed = await exportBackupZip({
            kind: 'folder',
            onProgress: options.onProgress,
        });
        const fileHandle = await handle.getFileHandle(packed.filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(packed.blob);
        await writable.close();
        return packed;
    }

    async function saveBackupNow() {
        const handle = await loadFolderHandle();
        if (handle && await ensureFolderPermission(handle)) {
            return Process().run({
                title: 'Guardando en carpeta',
                steps: Process().EXPORT_STEPS,
                successMessage: 'Copia guardada en la carpeta',
                work: async (api) => {
                    api.setStep('preparing');
                    const packed = await writeBackupToFolder({
                        handle,
                        onProgress: (s) => api.setStep(s),
                    });
                    api.setStep('done');
                    return packed;
                },
            });
        }
        return downloadBackupZip();
    }

    /* —— UI —— */

    function formatTs(ts) {
        if (!ts) return 'Nunca';
        try {
            return new Date(ts).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
        } catch {
            return '';
        }
    }

    async function updateBackupStatusUi() {
        const el = $('backup-status-line');
        const folderEl = $('backup-folder-label');
        if (!el && !folderEl) return;
        const S = Storage();
        if (!S?.isAvailable()) return;
        const lastAt = await S.getMeta('lastBackupAt');
        const kind = await S.getMeta('lastBackupKind');
        const pending = await hasPendingChanges();
        if (el) {
            const kindLabel = kind === 'gmail' ? 'Gmail'
                : kind === 'folder' ? 'carpeta'
                    : kind === 'import' ? 'restauración'
                        : kind ? 'ZIP' : '';
            el.textContent = lastAt
                ? `Última copia: ${formatTs(lastAt)}${kindLabel ? ` (${kindLabel})` : ''}${pending ? ' · hay cambios sin copiar' : ''}`
                : 'Aún no hay copia de seguridad';
        }
        if (folderEl) {
            const handle = await loadFolderHandle();
            folderEl.textContent = handle?.name
                ? `Carpeta: ${handle.name}`
                : 'Sin carpeta vinculada';
        }
    }

    function openRestoreModal() {
        const modal = $('backup-restore-modal');
        if (!modal) return;
        const motion = window.S21Motion;
        if (motion?.setOpen) motion.setOpen(modal, true, { from: 'scale' });
        else {
            modal.classList.remove('hidden');
            modal.hidden = false;
        }
    }

    function closeRestoreModal() {
        const modal = $('backup-restore-modal');
        if (!modal) return;
        const motion = window.S21Motion;
        if (motion?.setOpen) motion.setOpen(modal, false, { from: 'scale' });
        else {
            modal.classList.add('hidden');
            modal.hidden = true;
        }
    }

    let pendingRestoreFile = null;

    function bindUi() {
        $('btn-backup-download')?.addEventListener('click', async () => {
            try {
                await downloadBackupZip();
            } catch (err) {
                if (err && Process()) {/* outcome already shown */}
                else alert(err?.message || String(err));
            }
        });

        $('btn-backup-restore')?.addEventListener('click', () => {
            const input = $('backup-file-input');
            if (input) {
                input.value = '';
                input.click();
            }
        });

        $('backup-file-input')?.addEventListener('change', async (e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (!file) return;
            pendingRestoreFile = file;
            openRestoreModal();
        });

        $('backup-restore-cancel')?.addEventListener('click', () => {
            pendingRestoreFile = null;
            closeRestoreModal();
        });
        document.querySelectorAll('[data-backup-restore-close]').forEach(el => {
            el.addEventListener('click', () => {
                pendingRestoreFile = null;
                closeRestoreModal();
            });
        });

        $('backup-restore-replace')?.addEventListener('click', async () => {
            const file = pendingRestoreFile;
            pendingRestoreFile = null;
            closeRestoreModal();
            if (!file) return;
            try {
                await importBackup(file, 'replace');
            } catch {
                /* overlay shows error */
            }
        });

        $('backup-restore-merge')?.addEventListener('click', async () => {
            const file = pendingRestoreFile;
            pendingRestoreFile = null;
            closeRestoreModal();
            if (!file) return;
            try {
                await importBackup(file, 'merge');
            } catch {
                /* overlay */
            }
        });

        $('btn-backup-folder-link')?.addEventListener('click', async () => {
            try {
                await pickBackupFolder();
                alert('Carpeta vinculada. Las copias automáticas se guardarán ahí cuando sea posible.');
            } catch (err) {
                if (err?.name === 'AbortError') return;
                alert(err?.message || String(err));
            }
        });

        $('btn-backup-folder-save')?.addEventListener('click', async () => {
            try {
                await saveBackupNow();
            } catch (err) {
                if (err?.name === 'AbortError') return;
                alert(err?.message || String(err));
            }
        });

        $('btn-backup-folder-unlink')?.addEventListener('click', async () => {
            await clearFolderHandle();
        });

        $('btn-backup-banner-save')?.addEventListener('click', async () => {
            hideBackupBanner();
            try {
                await saveBackupNow();
            } catch (err) {
                alert(err?.message || String(err));
            }
        });
        $('btn-backup-banner-dismiss')?.addEventListener('click', () => {
            hideBackupBanner();
            sessionStorage.setItem('s21_backup_banner_dismissed', '1');
        });
    }

    function showBackupBanner(message) {
        const bar = $('backup-reminder-banner');
        const text = $('backup-reminder-text');
        if (!bar) return;
        if (text && message) text.textContent = message;
        bar.classList.remove('hidden');
        bar.hidden = false;
    }

    function hideBackupBanner() {
        const bar = $('backup-reminder-banner');
        if (!bar) return;
        bar.classList.add('hidden');
        bar.hidden = true;
    }

    function init(options) {
        callbacks = options || {};
        bindUi();
        updateBackupStatusUi();
    }

    window.S21DashboardBackup = {
        init,
        buildPayload,
        exportBackupZip,
        downloadBackupZip,
        importBackup,
        applyPayloadReplace,
        applyPayloadMerge,
        markBackupDone,
        hasPendingChanges,
        pickBackupFolder,
        writeBackupToFolder,
        saveBackupNow,
        loadFolderHandle,
        clearFolderHandle,
        ensureFolderPermission,
        updateBackupStatusUi,
        showBackupBanner,
        hideBackupBanner,
        collectPrefs,
        applyPrefs,
        readBackupFile,
    };
})();
