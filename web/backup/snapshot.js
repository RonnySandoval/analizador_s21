(function () {
    const SNAP_DB = 's21-restore';
    const SNAP_STORE = 'snapshots';
    const SNAP_KEY = 'pre-restore';

    function openSnapDb() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(SNAP_DB, 1);
            req.onerror = () => reject(req.error || new Error('No se pudo abrir s21-restore'));
            req.onsuccess = () => resolve(req.result);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(SNAP_STORE)) {
                    db.createObjectStore(SNAP_STORE);
                }
            };
        });
    }

    async function createSnapshotBlob(blob) {
        const db = await openSnapDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(SNAP_STORE, 'readwrite');
            tx.objectStore(SNAP_STORE).put({
                createdAt: Date.now(),
                blob,
            }, SNAP_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    }

    async function loadSnapshotBlob() {
        const db = await openSnapDb();
        const row = await new Promise((resolve, reject) => {
            const tx = db.transaction(SNAP_STORE, 'readonly');
            const req = tx.objectStore(SNAP_STORE).get(SNAP_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
        db.close();
        return row?.blob || null;
    }

    async function clearSnapshot() {
        const db = await openSnapDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(SNAP_STORE, 'readwrite');
            tx.objectStore(SNAP_STORE).delete(SNAP_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, {
        createSnapshotBlob,
        loadSnapshotBlob,
        clearSnapshot,
    });
})();
