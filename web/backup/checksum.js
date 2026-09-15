(function () {
    const B = () => window.S21Backup;

    function toHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async function sha256Hex(data) {
        const bytes = typeof data === 'string'
            ? new TextEncoder().encode(data)
            : data instanceof ArrayBuffer
                ? new Uint8Array(data)
                : data instanceof Uint8Array
                    ? data
                    : new Uint8Array(await data.arrayBuffer?.() ?? data);
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        return toHex(digest);
    }

    /**
     * Checksum covers backup.json content + sorted files/{id} blobs.
     * Manifest itself is excluded.
     */
    async function checksumBackupContent(backupJsonText, filesMap = {}) {
        const parts = [String(backupJsonText || '')];
        const ids = Object.keys(filesMap).sort();
        for (const id of ids) {
            const blob = filesMap[id];
            const buf = blob instanceof Blob
                ? new Uint8Array(await blob.arrayBuffer())
                : blob instanceof Uint8Array
                    ? blob
                    : new Uint8Array(blob || []);
            parts.push(`\n#file:${id}\n`);
            parts.push(buf);
        }
        const encoder = new TextEncoder();
        const chunks = [];
        let total = 0;
        for (const part of parts) {
            const u8 = typeof part === 'string' ? encoder.encode(part) : part;
            chunks.push(u8);
            total += u8.length;
        }
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
            merged.set(c, offset);
            offset += c.length;
        }
        return sha256Hex(merged);
    }

    window.S21Backup = window.S21Backup || {};
    Object.assign(window.S21Backup, { sha256Hex, checksumBackupContent });
})();
