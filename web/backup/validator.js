(function () {
    function validatePayloadStructure(payload) {
        if (!payload || typeof payload !== 'object') {
            return { ok: false, error: 'Payload vacío o inválido' };
        }
        if (!Array.isArray(payload.datasets)) {
            return { ok: false, error: 'El backup no incluye la lista de cargas (datasets)' };
        }
        for (const ds of payload.datasets) {
            if (!ds || typeof ds !== 'object' || !ds.id) {
                return { ok: false, error: 'Hay una carga sin id válido en el backup' };
            }
            if (!Array.isArray(ds.packages)) {
                return { ok: false, error: `La carga «${ds.name || ds.id}» no tiene packages` };
            }
        }
        if (payload.prefs != null && typeof payload.prefs !== 'object') {
            return { ok: false, error: 'prefs del backup no es un objeto' };
        }
        return { ok: true };
    }

    async function validateUnpacked(unpacked, options = {}) {
        const B = window.S21Backup;
        const structural = validatePayloadStructure(unpacked.payload);
        if (!structural.ok) return structural;

        if (unpacked.legacy && options.allowLegacy !== false) {
            return { ok: true, legacy: true, warning: 'Copia antigua sin manifest' };
        }
        if (!unpacked.manifest) {
            if (options.requireManifest) {
                return { ok: false, error: 'Falta manifest.json' };
            }
            return { ok: true, legacy: true };
        }

        const expected = await B.checksumBackupContent(
            unpacked.backupJsonText,
            unpacked.filesMap || {}
        );
        if (unpacked.manifest.checksum !== expected) {
            return {
                ok: false,
                error: 'Checksum incorrecto: la copia está corrupta o fue alterada',
            };
        }
        return { ok: true, legacy: false };
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { validatePayloadStructure, validateUnpacked });
})();
