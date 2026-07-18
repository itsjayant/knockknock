// PWA Service Worker with caching and offline support
const CACHE_NAME = 'knockknock-v1';
const urlsToCache = [
    '/',
    '/dashboard',
    '/qr-codes',
    '/visits',
    '/login',
    '/manifest.json',
    '/globals.css',
];

// Install: Cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('✅ Service Worker: Caching essential files');
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('🧹 Service Worker: Deleting old cache', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API calls (let them go to network)
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached version if available
            if (response) {
                return response;
            }

            // Try to fetch from network
            return fetch(event.request)
                .then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // Return offline fallback if needed
                    console.log('⚠️ Service Worker: Offline - serving cached version');
                    return caches.match(event.request);
                });
        })
    );
});

// Handle background sync for visits
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-visits') {
        event.waitUntil(
            fetch('/api/visits/sync', { method: 'POST' })
                .then(() => {
                    console.log('✅ Service Worker: Synced visits');
                })
                .catch(() => {
                    console.log('❌ Service Worker: Failed to sync visits');
                })
        );
    }
});

// Ringtone mappings with simple WAV data URIs
const RINGTONES = {
    default: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
    chime: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
    ding: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
};

// Handle push notifications
self.addEventListener('push', (event) => {
    const notificationData = event.data?.json?.() || {};
    const data = notificationData.data || {};

    const title = notificationData.notification?.title || 'KnockKnock';
    const body = notificationData.notification?.body || 'Someone is at your door!';
    const ringtoneId = data.ringtoneId || 'default';
    const volume = parseInt(data.volume) || 70;

    const options = {
        body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230f172a" rx="40" width="192" height="192"/><path d="M 96 40 Q 120 50 120 80 L 120 100 Q 96 115 72 100 L 72 80 Q 72 50 96 40 Z M 96 115 L 96 135" stroke="%23ffffff" stroke-width="8" fill="none" stroke-linecap="round"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%230f172a" rx="20" width="96" height="96"/><path d="M 48 20 Q 60 25 60 40 L 60 50 Q 48 57 36 50 L 36 40 Q 36 25 48 20 Z M 48 57 L 48 67" stroke="%23ffffff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
        tag: 'knockknock-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { ringtoneId, volume },
    };

    event.waitUntil(
        self.registration.showNotification(title, options).then(() => {
            // Play ringtone if available
            playRingtone(ringtoneId, volume);
        })
    );
});

// Play ringtone helper
function playRingtone(ringtoneId, volume) {
    try {
        const ringtoneUrl = RINGTONES[ringtoneId] || RINGTONES.default;
        const audio = new Audio(ringtoneUrl);
        audio.volume = Math.min(volume / 100, 1);
        audio.play().catch((err) => {
            console.warn('⚠️  Could not play ringtone:', err);
        });
    } catch (err) {
        console.error('❌ Error playing ringtone:', err);
    }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Try to focus existing window
            for (let i = 0; i < clientList.length; i++) {
                if (clientList[i].url === '/' || clientList[i].url.includes('dashboard')) {
                    return clientList[i].focus();
                }
            }
            // Open new window
            return clients.openWindow('/dashboard');
        })
    );
});

console.log('🚀 PWA Service Worker loaded');
