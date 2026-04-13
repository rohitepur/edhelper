const CACHE_NAME = 'pssa-portal-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/utils.js',
    '/js/templates.js',
    '/js/extra-templates.js',
    '/js/dynamic-gen.js',
    '/js/pssa-patterns.js',
    '/js/ai-generator.js'
];

// Install — cache app shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', event => {
    // Skip Firebase and external API requests — don't cache those
    if (event.request.url.includes('firebasestorage') ||
        event.request.url.includes('firestore.googleapis') ||
        event.request.url.includes('localhost:11434')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Network failed — serve from cache
                return caches.match(event.request).then(cached => {
                    return cached || new Response('Offline', { status: 503 });
                });
            })
    );
});
