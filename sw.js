const CACHE_NAME = "algtimer-pwa-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Pass-through fetch (offline fallback is already built into app.js)
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});