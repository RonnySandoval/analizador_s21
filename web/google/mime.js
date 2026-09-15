(function () {
    function toBase64(uint8) {
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < uint8.length; i += chunk) {
            binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunk));
        }
        return btoa(binary);
    }

    function toBase64Url(uint8) {
        return toBase64(uint8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async function blobToBase64(blob) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        return toBase64(buf);
    }

    async function blobToBase64Url(blob) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        return toBase64Url(buf);
    }

    function utf8ToBase64Url(text) {
        const bytes = new TextEncoder().encode(text);
        return toBase64Url(bytes);
    }

    /**
     * Build RFC 2822 multipart message with ZIP attachment (base64url for Gmail insert).
     */
    async function buildBackupMimeMessage({ to, subject, bodyText, filename, zipBlob, metaJson }) {
        const B = window.S21Backup;
        const boundary = `s21_backup_${Date.now().toString(36)}`;
        const zipStd = await blobToBase64(zipBlob);

        const metaBlock = [
            '',
            B.GMAIL_BACKUP_META_MARKER,
            typeof metaJson === 'string' ? metaJson : JSON.stringify(metaJson || {}),
            '',
        ].join('\n');

        const mime = [
            `To: ${to || 'me'}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: 7bit',
            '',
            bodyText + metaBlock,
            `--${boundary}`,
            `Content-Type: application/zip; name="${filename}"`,
            'Content-Transfer-Encoding: base64',
            `Content-Disposition: attachment; filename="${filename}"`,
            '',
            zipStd.match(/.{1,76}/g)?.join('\r\n') || zipStd,
            `--${boundary}--`,
            '',
        ].join('\r\n');

        return utf8ToBase64Url(mime);
    }

    function decodeBase64Url(data) {
        const std = data.replace(/-/g, '+').replace(/_/g, '/');
        const pad = std.length % 4 === 0 ? '' : '='.repeat(4 - (std.length % 4));
        const binary = atob(std + pad);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    window.S21GmailMime = {
        buildBackupMimeMessage,
        blobToBase64,
        blobToBase64Url,
        utf8ToBase64Url,
        decodeBase64Url,
        toBase64Url,
        toBase64,
    };
})();
