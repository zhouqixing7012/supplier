const CACHE_NAME = 'supplier-pwa-shell-v2';
const STATIC_ASSET_PATTERN = /\.(?:css|js|png|svg|ico|webp|jpe?g|woff2?|ttf|otf)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith('supplier-pwa-shell-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/service-worker.js')) return;

  const isNavigation = request.mode === 'navigate';
  const isStaticAsset = STATIC_ASSET_PATTERN.test(url.pathname);
  if (!isNavigation && !isStaticAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;
      return new Response('当前网络不可用，且此页面尚未缓存。请联网后重试。', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    }
  })());
});
