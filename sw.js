const CACHE_NAME = 'daily-nest-cache-v3'; // bump this on updates
const CACHE_FILES = [
  './',
  './index.htm',
  './app.js',
  './favicon.png',
  './logo-192.png',
  './logo-512.png',
  './manifest.json',
  './style.css'
];

// Cache core files on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Clear old caches on activate
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

// Serve cached files; fallback to network if not in cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
