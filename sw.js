// CodeRulit Progressive Web App Service Worker
const CACHE_NAME = 'coderulit-v1.0.1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app/templates/index.html',
  './app/templates/lesson.html',
  './app/static/css/output-index.css',
  './app/static/css/styles-index.css',
  './app/static/js/home.js',
  './app/static/js/lesson.js',
  './app/static/js/gamification.js',
  './app/static/js/theme-handler.js',
  './app/static/js/pwa.js',
  './app/static/data/lessons.json',
  './app/static/img/icons/favicon.svg',
  './app/static/img/icons/streak.svg',
  './app/static/img/field/car.svg',
  './app/static/img/field/start.svg',
  './app/static/img/field/finish.svg',
  './app/static/img/field/road.svg',
  './app/static/img/field/road-turn.svg',
  './app/static/img/field/grass.svg',
  './app/static/img/field/grass-building.svg',
  './app/static/img/field/grass-flowers.svg',
  './app/static/img/field/grass-fountain.svg',
  './app/static/img/field/grass-house.svg'
];

// Pre-cache core files on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Add each asset individually to prevent one failure from aborting install
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Could not pre-cache asset:', asset, err);
        }
      }
      console.log('[SW] Pre-caching completed for', CACHE_NAME);
    })
  );
});

// Clean up old caches on activate and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http/https requests
  if (!url.protocol.startsWith('http')) return;

  // 1. Navigation requests (HTML documents)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, check cache for the requested URL
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // If looking for a lesson page or index page
          if (url.pathname.includes('lesson.html')) {
            const cachedLesson = await caches.match('./app/templates/lesson.html');
            if (cachedLesson) return cachedLesson;
          }
          const cachedHome = await caches.match('./app/templates/index.html');
          if (cachedHome) return cachedHome;

          return caches.match('./index.html');
        })
    );
    return;
  }

  // 2. Static assets & API data (Stale-While-Revalidate / Cache-First)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch((err) => {
          // Network failed, if no cachedResponse, return fallback
          return null;
        });

      // Return cached version immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for message events (e.g. update trigger)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
