(function () {
    function getJSZip() {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip no está disponible');
        }
        return JSZip;
    }

    async function packBackupZip({ backupJsonText, filesMap = {}, manifest }) {
        const B = window.S21Backup;
        const zip = new (getJSZip())();
        zip.file(B.ZIP_BACKUP_JSON, backupJsonText);
        const ids = Object.keys(filesMap);
        for (const id of ids) {
            zip.file(`${B.ZIP_FILES_PREFIX}${id}`, filesMap[id]);
        }
        zip.file(B.ZIP_MANIFEST, JSON.stringify(manifest, null, 2));
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });
        return blob;
    }

    async function unpackBackupZip(blobOrArrayBuffer, options = {}) {
        const B = window.S21Backup;
        const requireManifest = options.requireManifest !== false;
        const zip = await getJSZip().loadAsync(blobOrArrayBuffer);
        const backupEntry = zip.file(B.ZIP_BACKUP_JSON);
        if (!backupEntry) {
            throw new Error('El ZIP no contiene backup.json');
        }
        const backupJsonText = await backupEntry.async('string');
        let payload;
        try {
            payload = JSON.parse(backupJsonText);
        } catch {
            throw new Error('backup.json no es JSON válido');
        }

        const filesMap = {};
        const fileRe = new RegExp(`^${B.ZIP_FILES_PREFIX.replace('/', '\\/')}(.+)$`);
        for (const path of Object.keys(zip.files)) {
            const m = path.match(fileRe);
            if (!m || zip.files[path].dir) continue;
            filesMap[m[1]] = await zip.files[path].async('blob');
        }

        const manifestEntry = zip.file(B.ZIP_MANIFEST);
        let manifest = null;
        let legacy = false;
        if (manifestEntry) {
            try {
                manifest = B.parseManifest(JSON.parse(await manifestEntry.async('string')));
            } catch {
                manifest = null;
            }
        } else {
            legacy = true;
            if (requireManifest) {
                throw new Error('Esta copia no tiene manifest.json (formato incompleto)');
            }
        }

        return {
            payload,
            backupJsonText,
            filesMap,
            manifest,
            legacy,
            size: blobOrArrayBuffer instanceof Blob
                ? blobOrArrayBuffer.size
                : (blobOrArrayBuffer?.byteLength || 0),
        };
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { packBackupZip, unpackBackupZip });
})();
