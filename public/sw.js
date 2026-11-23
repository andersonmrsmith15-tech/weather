/* O'zbekiston ob-havosi — service worker
 * - Statik fayllar (JS/CSS/ikonkalar): cache-first
 * - Sahifalar va RSC: network-first, internet bo'lmasa oxirgi saqlangan nusxa
 * - Xarita plitkalari (OpenStreetMap): cache-first, cheklangan hajm
 * - /api/*: hech qachon keshlanmaydi
 */
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const TILES = `tiles-${VERSION}`;
const OFFLINE_URL = "/ob-havo/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"];
const MAX_PAGES = 40;
const MAX_TILES = 400;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES, TILES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === "opaque") {
    cache.put(request, res.clone());
    if (max) trim(cacheName, max);
  }
  return res;
}

async function networkFirst(request, { navigate }) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok) {
      cache.put(request, res.clone());
      trim(PAGES, MAX_PAGES);
    }
    return res;
  } catch (err) {
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    if (navigate) {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw err; // Next.js useOffline buni ushlab, aloqa tiklanganda qayta urinadi
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.hostname === "tile.openstreetmap.org") {
    event.respondWith(cacheFirst(request, TILES, MAX_TILES));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/webpack-hmr") || url.pathname.includes("__nextjs")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(?:png|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  const isRsc = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (request.mode === "navigate" || isRsc) {
    event.respondWith(networkFirst(request, { navigate: request.mode === "navigate" }));
  }
});
