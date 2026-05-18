/**
 * sw.js — Macho ya Mwananchi Service Worker
 * Enables PWA install prompt on Chrome (Android & desktop).
 * Caches the app shell so it loads instantly on repeat visits.
 */

const CACHE_NAME = 'macho-ya-mwananchi-v1';

// App shell — static assets that should always be cached
const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: cache the app shell ────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for shell ─────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go to network for API calls — never serve stale civic data
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return; // let browser handle it normally
  }

  // Cache-first for everything else (app shell, assets)
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached || fetch(event.request)
    )
  );
});
