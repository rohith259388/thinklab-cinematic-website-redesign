/*
 * Thinklab service worker — makes repeat visits load from the visitor's device.
 *
 *  - /_next/static/* (hashed, never change)   → cache first
 *  - images, fonts, icons                      → cache first, refreshed in background
 *  - pages (HTML navigations)                  → cached copy shown instantly,
 *                                                fresh copy fetched in background for next time
 *
 * Never cached: /admin, /api, CMS previews (?__cms_preview), dev HMR, non-GET,
 * cross-origin requests, and assets marked no-store / private.
 *
 * Bump VERSION to drop every cached file for all visitors.
 */
const VERSION = 'v1';
const STATIC_CACHE = `tl-static-${VERSION}`;
const ASSET_CACHE = `tl-assets-${VERSION}`;
const PAGE_CACHE = `tl-pages-${VERSION}`;
const KEEP = [STATIC_CACHE, ASSET_CACHE, PAGE_CACHE];
const LIMITS = { [ASSET_CACHE]: 250, [PAGE_CACHE]: 60, [STATIC_CACHE]: 400 };

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // The worker installs during the first visit, after that page has loaded, so
  // store the home page now; the second visit then opens instantly.
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch('/', { credentials: 'same-origin' });
        if (pageCacheable(res)) await (await caches.open(PAGE_CACHE)).put(self.location.origin + '/', res);
      } catch {}
    })(),
  );
});

// Pages the visitor opened before the worker took control.
self.addEventListener('message', (event) => {
  const urls = event.data && event.data.type === 'tl-cache-pages' ? event.data.urls : null;
  if (!Array.isArray(urls)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      for (const u of urls.slice(0, 5)) {
        const url = new URL(u, self.location.origin);
        if (url.origin !== self.location.origin || url.pathname.startsWith('/admin') || url.searchParams.has('__cms_preview')) continue;
        try {
          const res = await fetch(url.pathname, { credentials: 'same-origin' });
          if (pageCacheable(res)) await cache.put(url.origin + url.pathname, res);
        } catch {}
      }
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith('tl-') && !KEEP.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

const cacheable = (res) => {
  if (!res || !res.ok || res.type === 'opaque') return false;
  const cc = res.headers.get('Cache-Control') || '';
  return !/no-store|private/i.test(cc);
};

// Next marks these pages no-store only because they read request headers for CMS
// preview; the public HTML is identical for every visitor, so it is safe to keep a
// copy here. Admin and preview responses carry X-Robots-Tag: noindex and are skipped.
const pageCacheable = (res) =>
  !!res && res.ok && !res.redirected &&
  (res.headers.get('Content-Type') || '').includes('text/html') &&
  !/noindex/i.test(res.headers.get('X-Robots-Tag') || '');

async function trim(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const max = LIMITS[cacheName] || 200;
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function put(cacheName, request, response, check = cacheable) {
  if (!check(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  trim(cacheName);
}

async function cacheFirst(event, cacheName, refresh) {
  const cached = await caches.match(event.request);
  const network = fetch(event.request).then((res) => {
    event.waitUntil(put(cacheName, event.request, res.clone()));
    return res;
  });
  if (cached) {
    if (refresh) event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

async function page(event) {
  const cache = await caches.open(PAGE_CACHE);
  // Key pages by path only, so tracking params don't create duplicates.
  const url = new URL(event.request.url);
  const key = url.origin + url.pathname;
  const cached = await cache.match(key);
  const network = fetch(event.request).then((res) => {
    if (pageCacheable(res)) event.waitUntil(put(PAGE_CACHE, key, res.clone(), pageCacheable));
    return res;
  });
  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const p = url.pathname;
  if (
    p.startsWith('/admin') ||
    p.startsWith('/api/') ||
    p.startsWith('/_next/webpack-hmr') ||
    p === '/sw.js' ||
    url.searchParams.has('__cms_preview')
  ) return;

  if (p.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(event, STATIC_CACHE, false));
    return;
  }
  if (
    p.startsWith('/images/') ||
    p.startsWith('/_next/image') ||
    /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(p)
  ) {
    event.respondWith(cacheFirst(event, ASSET_CACHE, true));
    return;
  }
  // Full page loads only; client-side (RSC) navigations are handled by Next's own cache.
  if (req.mode === 'navigate' && !req.headers.get('RSC')) {
    event.respondWith(page(event));
  }
});
