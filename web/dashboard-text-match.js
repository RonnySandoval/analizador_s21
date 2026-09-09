(function () {
    const DIACRITICS = /[\u0300-\u036f]/g;

    function normalizeText(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(DIACRITICS, '')
            .toLowerCase()
            .trim();
    }

    function queryTokens(query) {
        return normalizeText(query).split(/\s+/).filter(Boolean);
    }

    function textMatchesQuery(haystack, query) {
        const tokens = queryTokens(query);
        if (!tokens.length) return true;
        const norm = normalizeText(haystack);
        return tokens.every(token => norm.includes(token));
    }

    function publisherHaystack(p, displayPerfilFn) {
        const perfil = displayPerfilFn ? displayPerfilFn(p.origen) : (p.origen || '');
        return `${p.nombre || ''} ${perfil} ${p.origen || ''}`;
    }

    function publisherMatchesQuery(p, query, displayPerfilFn) {
        return textMatchesQuery(publisherHaystack(p, displayPerfilFn), query);
    }

    function namesMatch(a, b) {
        return normalizeText(a) === normalizeText(b);
    }

    function filterPublishers(publishers, query, displayPerfilFn) {
        const q = String(query || '').trim();
        if (!q) return publishers;
        return publishers.filter(p => publisherMatchesQuery(p, q, displayPerfilFn));
    }

    window.S21TextMatch = {
        normalize: normalizeText,
        queryTokens,
        textMatchesQuery,
        publisherMatchesQuery,
        publisherHaystack,
        namesMatch,
        filterPublishers,
    };
})();
