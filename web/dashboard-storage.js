(function () {
    const DB_NAME = 's21_analizador';
    const DB_VERSION = 2;
    const STORE_DATASETS = 'datasets';
    const STORE_META = 'meta';
    const META_ACTIVE = 'activeDatasetId';
    const LEGACY_STORE = 'dashboard_cache';
    const LEGACY_KEY = 'active';
    const MAX_DATASETS = 15;

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
                if (!db.objectStoreNames.contains(STORE_DATASETS)) {
                    db.createObjectStore(STORE_DATASETS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_META)) {
                    db.createObjectStore(STORE_META);
                }
            };
        });
    }

    async function txComplete(db, tx) {
        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('Error de almacenamiento'));
        });
        db.close();
    }

    async function getMeta(key) {
        const db = await openDb();
        const value = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_META, 'readonly');
            const req = tx.objectStore(STORE_META).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        db.close();
        return value;
    }

    async function setMeta(key, value) {
        const db = await openDb();
        const tx = db.transaction(STORE_META, 'readwrite');
        tx.objectStore(STORE_META).put(value, key);
        await txComplete(db, tx);
    }

    async function listDatasets() {
        const db = await openDb();
        const items = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_DATASETS, 'readonly');
            const req = tx.objectStore(STORE_DATASETS).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
        db.close();
        return items.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    }

    async function getDataset(id) {
        if (!id) return null;
        const db = await openDb();
        const item = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_DATASETS, 'readonly');
            const req = tx.objectStore(STORE_DATASETS).get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
        db.close();
        return item;
    }

    async function putDataset(dataset) {
        const db = await openDb();
        const tx = db.transaction(STORE_DATASETS, 'readwrite');
        tx.objectStore(STORE_DATASETS).put(dataset);
        await txComplete(db, tx);
    }

    async function deleteDataset(id) {
        const db = await openDb();
        const tx = db.transaction(STORE_DATASETS, 'readwrite');
        tx.objectStore(STORE_DATASETS).delete(id);
        await txComplete(db, tx);
    }

    async function getActiveDatasetId() {
        return getMeta(META_ACTIVE) || null;
    }

    async function setActiveDatasetId(id) {
        if (id) await setMeta(META_ACTIVE, id);
        else {
            const db = await openDb();
            const tx = db.transaction(STORE_META, 'readwrite');
            tx.objectStore(STORE_META).delete(META_ACTIVE);
            await txComplete(db, tx);
        }
    }

    async function getActiveDataset() {
        const id = await getActiveDatasetId();
        return id ? getDataset(id) : null;
    }

    async function migrateLegacyCache(buildSummary) {
        const db = await openDb();
        let legacy = null;
        if (db.objectStoreNames.contains(LEGACY_STORE)) {
            legacy = await new Promise((resolve, reject) => {
                const tx = db.transaction(LEGACY_STORE, 'readonly');
                const req = tx.objectStore(LEGACY_STORE).get(LEGACY_KEY);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
        }
        db.close();

        if (!legacy?.packages?.length) return null;

        const dataset = buildSummary(legacy.packages, {
            ...(legacy.meta || {}),
            label: legacy.meta?.label || 'Migrado',
        });
        await putDataset(dataset);
        await setActiveDatasetId(dataset.id);
        return dataset;
    }

    async function enforceMaxDatasets() {
        const datasets = await listDatasets();
        if (datasets.length <= MAX_DATASETS) return datasets;
        const activeId = await getActiveDatasetId();
        const sorted = [...datasets].sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
        for (const ds of sorted) {
            if (datasets.length <= MAX_DATASETS) break;
            if (ds.id === activeId) continue;
            await deleteDataset(ds.id);
            datasets.splice(datasets.findIndex(d => d.id === ds.id), 1);
        }
        return listDatasets();
    }

    window.S21DashboardStorage = {
        MAX_DATASETS,
        isAvailable,
        listDatasets,
        getDataset,
        putDataset,
        deleteDataset,
        getActiveDatasetId,
        setActiveDatasetId,
        getActiveDataset,
        migrateLegacyCache,
        enforceMaxDatasets,
        // compat aliases used during transition
        saveDashboardCache: async (packages, meta) => {
            console.warn('saveDashboardCache deprecated; use dataset API via S21DashboardDatos');
        },
        loadDashboardCache: async () => {
            const ds = await getActiveDataset();
            if (!ds) return null;
            return { packages: ds.packages, meta: ds.meta };
        },
        clearDashboardCache: async () => {
            const datasets = await listDatasets();
            await Promise.all(datasets.map(d => deleteDataset(d.id)));
            await setActiveDatasetId(null);
        },
    };
})();
