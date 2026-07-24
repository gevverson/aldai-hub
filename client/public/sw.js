/**
 * sw.js — Macho ya Mwananchi Service Worker
 *
 * Built for rural, low-bandwidth 2G/3G connections:
 *  - App shell + hashed build assets are cached so repeat visits load instantly.
 *  - Civic data (GET /api/projects…) uses stale-while-revalidate: the last known
 *    data shows immediately (even fully offline), then refreshes in the background.
 *  - Navigations fall back to the cached app shell when offline, so the PWA opens
 *    with no connection at all.
 *
 * Only GET requests are ever cached — citizen reports and verifications (POST)
 * always go straight to the network.
 */

const VERSION      = 'v3';   // bump on each release to purge stale shell/data/asset caches
const SHELL_CACHE  = `mym-shell-${VERSION}`;
const DATA_CACHE   = `mym-data-${VERSION}`;
const ASSET_CACHE  = `mym-assets-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, DATA_CACHE, ASSET_CACHE];

// App shell — always available offline
const SHELL_URLS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// ── Install: pre-cache the app shell ────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// ── Activate: drop caches from previous versions ────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => !CURRENT_CACHES.includes(key)).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Serve from cache immediately, refresh the cache in the background.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached); // offline: fall back to whatever we have
  return cached || network;
}

// ── Fetch: route by request type ────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache anything but GET (reports/verifications are POST).
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1. Navigations → network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((r) => r || caches.match('/'))
      )
    );
    return;
  }

  // 2. Civic data reads → stale-while-revalidate (works offline).
  if (sameOrigin && url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // 3. Uploaded evidence images → cache-first (they don't change).
  if (sameOrigin && url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || staleWhileRevalidate(request, DATA_CACHE)
      )
    );
    return;
  }

  // 4. Same-origin build assets (hashed JS/CSS/fonts/icons) → SWR.
  if (sameOrigin) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  // 5. Cross-origin (map tiles, font CDNs) → network, fall back to cache if seen.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
