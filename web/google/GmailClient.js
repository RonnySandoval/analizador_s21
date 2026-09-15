(function () {
    const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

    async function gmailFetch(path, options = {}) {
        const token = window.S21GoogleAuth?.getAccessToken();
        if (!token) throw new Error('No hay sesión de Google. Conecte su cuenta.');
        const url = path.startsWith('http') ? path : `${BASE}${path}`;
        const headers = Object.assign(
            { Authorization: `Bearer ${token}` },
            options.headers || {}
        );
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            let detail = '';
            try {
                const err = await res.json();
                detail = err?.error?.message || JSON.stringify(err);
            } catch {
                detail = await res.text();
            }
            throw new Error(`Gmail API ${res.status}: ${detail || res.statusText}`);
        }
        if (res.status === 204) return null;
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return res.json();
        return res.arrayBuffer();
    }

    async function listMessageIds(query, maxResults = 40) {
        const q = encodeURIComponent(query);
        const data = await gmailFetch(`/messages?q=${q}&maxResults=${maxResults}`);
        return (data?.messages || []).map(m => m.id);
    }

    async function getMessage(id, format = 'full') {
        return gmailFetch(`/messages/${encodeURIComponent(id)}?format=${format}`);
    }

    async function getAttachment(messageId, attachmentId) {
        const data = await gmailFetch(
            `/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`
        );
        return data?.data || '';
    }

    async function insertMessage(rawBase64Url) {
        return gmailFetch('/messages?internalDateSource=dateHeader', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                raw: rawBase64Url,
                labelIds: ['INBOX'],
            }),
        });
    }

    window.S21GmailClient = {
        listMessageIds,
        getMessage,
        getAttachment,
        insertMessage,
        gmailFetch,
    };
})();
