const CACHE_NAME = 'hrms-shell-v2';
const PRECACHE_URLS = ['/index.html', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheKeys = await caches.keys();
        await Promise.all(
            cacheKeys
                .filter((key) => key !== CACHE_NAME)
                .map((key) => caches.delete(key))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const acceptHeader = request.headers.get('accept') || '';
    const isNavigationRequest = request.mode === 'navigate' || acceptHeader.includes('text/html');

    if (isNavigationRequest) {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(request, { cache: 'no-store' });
                return networkResponse;
            } catch (error) {
                const cachedResponse = await caches.match('/index.html');
                if (cachedResponse) {
                    return cachedResponse;
                }
                throw error;
            }
        })());
        return;
    }

    const requestUrl = new URL(request.url);
    const isSameOrigin = requestUrl.origin === self.location.origin;
    const shouldUseCacheFirst =
        isSameOrigin &&
        (
            request.destination === 'script' ||
            request.destination === 'style' ||
            request.destination === 'worker' ||
            request.destination === 'font' ||
            request.destination === 'image' ||
            PRECACHE_URLS.includes(requestUrl.pathname)
        );

    if (!shouldUseCacheFirst) {
        return;
    }

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    })());
});
