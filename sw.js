const CACHE_NAME = 'daily-nest-cache-v3'; // Bump this when updating
const CACHE_FILES = [
  './',
  './index.htm',
  './app.js',
  './favicon.png',
  './logo-192.png',
  './logo-512.png',
  './manifest.json',
  './style.css',
];

// Install event: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: serve from cache, fallback to network, fallback to offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    // Handle SPA-style routes
    event.respondWith(
      caches.match('./index.htm')
        .then(response => response || fetch(event.request))
        .catch(() => caches.match('./offline.html')) // Optional offline fallback
    );
  } else {
    // Handle other requests
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
        .catch(() => caches.match('./offline.html')) // Optional fallback
    );
  }
});
