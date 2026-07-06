/**
 * YAS Laptop Service Center - Service Worker
 * Handles PWA functionality and offline support
 */

const CACHE_NAME = 'yas-service-v1';
const STATIC_CACHE = 'yas-static-v1';
const DYNAMIC_CACHE = 'yas-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/customer.html',
    '/track.html',
    '/admin.html',
    '/css/style.css',
    '/css/dashboard.css',
    '/css/responsive.css',
    '/css/ai-animations.css',
    '/css/advanced-animations.css',
    '/js/storage.js',
    '/js/app.js',
    '/js/customer.js',
    '/js/admin.js',
    '/js/darkmode.js',
    '/js/mobile-menu.js',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
                    })
                    .map((cacheName) => {
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external resources
    if (url.origin !== location.origin) {
        return;
    }

    // Strategy: Cache First for static assets
    if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Strategy: Network First for dynamic content
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Cache successful responses
                if (networkResponse.ok) {
                    return caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Fallback to cache if network fails
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Return offline page for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-requests') {
        event.waitUntil(syncRequests());
    }
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from YAS Service',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('YAS Laptop Service', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Sync requests when back online
async function syncRequests() {
    // Implementation would sync offline requests to server
    console.log('Syncing requests...');
}

// Sync orders when back online
async function syncOrders() {
    // Implementation would sync offline orders to server
    console.log('Syncing orders...');
}
