(function () {
    const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';
    const DEFAULT_SCOPES = [
        'openid',
        'email',
        GMAIL_SCOPE,
    ];
    const TOKEN_STORE_KEY = 's21_google_oauth_token';

    let tokenClient = null;
    let accessToken = null;
    let tokenExpiresAt = 0;
    let grantedScopes = '';
    let profileEmail = null;
    let gisLoaded = false;

    function persistSession() {
        try {
            if (!accessToken || !tokenExpiresAt) {
                localStorage.removeItem(TOKEN_STORE_KEY);
                return;
            }
            localStorage.setItem(TOKEN_STORE_KEY, JSON.stringify({
                accessToken,
                tokenExpiresAt,
                grantedScopes,
                profileEmail,
            }));
        } catch {
            /* ignore quota / private mode */
        }
    }

    function clearPersistedSession() {
        try {
            localStorage.removeItem(TOKEN_STORE_KEY);
        } catch {
            /* ignore */
        }
    }

    function restoreSession() {
        try {
            const raw = localStorage.getItem(TOKEN_STORE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data?.accessToken || !data?.tokenExpiresAt) {
                clearPersistedSession();
                return false;
            }
            if (Date.now() >= Number(data.tokenExpiresAt) - 30_000) {
                clearPersistedSession();
                return false;
            }
            const scopes = data.grantedScopes || '';
            if (!String(scopes).split(/[\s,]+/).includes(GMAIL_SCOPE)) {
                clearPersistedSession();
                return false;
            }
            accessToken = data.accessToken;
            tokenExpiresAt = Number(data.tokenExpiresAt);
            grantedScopes = scopes;
            profileEmail = data.profileEmail || null;
            return true;
        } catch {
            clearPersistedSession();
            return false;
        }
    }

    restoreSession();

    async function resolveClientId() {
        if (window.S21_GOOGLE_CLIENT_ID) return window.S21_GOOGLE_CLIENT_ID;
        try {
            const res = await fetch('google-oauth.json', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.clientId) return data.clientId;
            }
        } catch {
            /* ignore */
        }
        if (window.S21GoogleBundledClientId) return window.S21GoogleBundledClientId;
        return '';
    }

    function loadGisScript() {
        if (gisLoaded || window.google?.accounts?.oauth2) {
            gisLoaded = true;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-s21-gis]');
            if (existing) {
                existing.addEventListener('load', () => {
                    gisLoaded = true;
                    resolve();
                });
                existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity')));
                return;
            }
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.dataset.s21Gis = '1';
            s.onload = () => {
                gisLoaded = true;
                resolve();
            };
            s.onerror = () => reject(new Error('No se pudo cargar Google Identity'));
            document.head.appendChild(s);
        });
    }

    async function ensureTokenClient() {
        const clientId = await resolveClientId();
        if (!clientId) {
            throw new Error('Copia en Google no configurada. Añada google-oauth.json con su Client ID.');
        }
        await loadGisScript();
        if (!window.google?.accounts?.oauth2) {
            throw new Error('Google Identity Services no disponible');
        }
        if (!tokenClient) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: DEFAULT_SCOPES.join(' '),
                callback: () => {},
            });
        }
        return { clientId, tokenClient };
    }

    function hasGmailScope(scopeStr) {
        const s = String(scopeStr || grantedScopes || '');
        return s.split(/[\s,]+/).includes(GMAIL_SCOPE);
    }

    function isAuthenticated() {
        if (!(accessToken && Date.now() < tokenExpiresAt - 30_000 && hasGmailScope())) {
            if (accessToken && Date.now() >= tokenExpiresAt - 30_000) {
                accessToken = null;
                tokenExpiresAt = 0;
                grantedScopes = '';
                clearPersistedSession();
            }
            return false;
        }
        return true;
    }

    function getAccessToken() {
        if (!isAuthenticated()) return null;
        return accessToken;
    }

    function getEmail() {
        return profileEmail;
    }

    function disconnect() {
        const old = accessToken;
        accessToken = null;
        tokenExpiresAt = 0;
        grantedScopes = '';
        profileEmail = null;
        clearPersistedSession();
        try {
            if (old && window.google?.accounts?.oauth2?.revoke) {
                google.accounts.oauth2.revoke(old, () => {});
            }
        } catch {
            /* ignore */
        }
        window.dispatchEvent(new CustomEvent('s21-google-auth', { detail: { connected: false } }));
    }

    async function fetchProfile(token) {
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.email || null;
        } catch {
            return null;
        }
    }

    function requestToken(prompt) {
        return new Promise((resolve, reject) => {
            tokenClient.callback = (resp) => {
                if (resp.error) {
                    reject(new Error(resp.error_description || resp.error || 'OAuth denegado'));
                    return;
                }
                resolve(resp);
            };
            tokenClient.requestAccessToken({
                prompt: prompt || '',
                scope: DEFAULT_SCOPES.join(' '),
                include_granted_scopes: false,
            });
        });
    }

    async function authenticate(options = {}) {
        if (isAuthenticated() && !options.force) {
            return { accessToken, email: profileEmail };
        }
        await ensureTokenClient();

        let tokenResponse = await requestToken(options.force ? 'consent' : '');
        grantedScopes = tokenResponse.scope || '';

        if (!hasGmailScope(grantedScopes)) {
            disconnect();
            await ensureTokenClient();
            tokenResponse = await requestToken('consent');
            grantedScopes = tokenResponse.scope || '';
        }

        if (!hasGmailScope(grantedScopes)) {
            throw new Error(
                'Google no concedió permiso de Gmail. En Cloud Console → Pantalla de consentimiento OAuth → Scopes, añada https://www.googleapis.com/auth/gmail.modify, guarde, y use «Volver a conectar» aceptando el acceso a Gmail.'
            );
        }

        accessToken = tokenResponse.access_token;
        const expiresIn = Number(tokenResponse.expires_in) || 3600;
        tokenExpiresAt = Date.now() + expiresIn * 1000;
        profileEmail = await fetchProfile(accessToken);
        persistSession();
        window.dispatchEvent(new CustomEvent('s21-google-auth', {
            detail: { connected: true, email: profileEmail },
        }));
        return { accessToken, email: profileEmail };
    }

    async function isConfigured() {
        const id = await resolveClientId();
        return !!id;
    }

    window.S21GoogleAuth = {
        resolveClientId,
        authenticate,
        disconnect,
        isAuthenticated,
        getAccessToken,
        getEmail,
        isConfigured,
        hasGmailScope,
        DEFAULT_SCOPES,
        GMAIL_SCOPE,
    };
})();
