(function () {
    /**
     * Runs applyFn after saving a snapshot of currentStateBlob.
     * On failure, calls rollbackFn with the snapshot blob.
     */
    async function replaceWithRollback({ currentStateBlob, applyFn, rollbackFn }) {
        const B = window.S21Backup;
        if (currentStateBlob) {
            await B.createSnapshotBlob(currentStateBlob);
        }
        try {
            const result = await applyFn();
            await B.clearSnapshot();
            return result;
        } catch (err) {
            try {
                const snap = await B.loadSnapshotBlob();
                if (snap && typeof rollbackFn === 'function') {
                    await rollbackFn(snap);
                }
            } catch (rollbackErr) {
                console.error('Rollback también falló', rollbackErr);
            }
            throw err;
        }
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { replaceWithRollback });
})();
