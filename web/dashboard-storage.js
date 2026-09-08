(function () {
    const DB_NAME = 's21_analizador';
    const DB_VERSION = 1;
    const STORE = 'dashboard_cache';
    const CACHE_KEY = 'active';

    function isAvailable() {
        return typeof indexedDB !== 'undefined';
    }

    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error || new Error('No se pudo abrir almacenamiento local'));
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE);
                }
            };
        });
    }

    async function saveDashboardCache(packages, meta = {}) {
        if (!isAvailable()) throw new Error('IndexedDB no disponible');
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put({
                packages,
                meta: {
                    label: meta.label || '',
                    folderLabel: meta.folderLabel || '',
                    añoMeta: meta.añoMeta || null,
                    savedAt: Date.now(),
                },
            }, CACHE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('No se pudo guardar'));
        });
        db.close();
    }

    async function loadDashboardCache() {
        if (!isAvailable()) return null;
        const db = await openDb();
        const result = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly');
            const request = tx.objectStore(STORE).get(CACHE_KEY);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('No se pudo leer'));
        });
        db.close();
        return result;
    }

    async function clearDashboardCache() {
        if (!isAvailable()) return;
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).delete(CACHE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('No se pudo borrar'));
        });
        db.close();
    }

    window.S21DashboardStorage = {
        isAvailable,
        saveDashboardCache,
        loadDashboardCache,
        clearDashboardCache,
    };
})();
