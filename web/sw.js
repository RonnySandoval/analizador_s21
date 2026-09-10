const CACHE_NAME = 's21-analizador-v1.4.40';
const STATIC_ASSETS = [
    'dashboard.html',
    'index.html',
    'style.css',
    'theme-cyber.css',
    'theme-light.css',
    'dashboard.css',
    's21-base.js',
    'dashboard-motion.js',
    'dashboard-preferences.js',
    'dashboard-data.js',
    'dashboard-icons.js',
    'dashboard-storage.js',
    'dashboard-update.js',
    'dashboard-datos.js',
    'dashboard-grupos.js',
    'dashboard-wizard.js',
    'dashboard-export.js',
    'dashboard-text-match.js',
    'dashboard.js',
    'app.js',
    'pwa.js',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-maskable-512.png',
    'icons/apple-touch-icon.png',
    'icons/logo-dark.png',
    'icons/logo-light.png',
];

function assetUrl(name) {
    return new URL(name, self.location).href;
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS.map(assetUrl)))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }
    if (event.request.method !== 'GET') {
        return;
    }
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const network = fetch(event.request)
                .then((response) => {
                    if (response.ok && url.origin === self.location.origin) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
