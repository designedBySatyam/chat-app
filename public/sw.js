const CACHE_NAME = "novyn-shell-v32";
const APP_SHELL = [
  "/",
  "/index.html",
  "/login.html",
  "/styles.css",
  "/vibe.css",
  "/login.css",
  "/dashboard.css",
  "/revamp.css",
  "/room-theme.css",
  "/app.js",
  "/chat-extras.js",
  "/login.js",
  "/visuals.js",
  "/pwa-register.js",
  "/manifest.json",
  "/icons/novyn-badge.svg",
  "/icons/icon-192.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isRangeRequest = request.headers.has("range");
  if (isRangeRequest || url.pathname.startsWith("/uploads/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallbackPath =
          url.pathname === "/" || url.pathname === "/login.html" ? "/login.html" : "/index.html";
        const cached = await caches.match(fallbackPath);
        return cached || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.status !== 206) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
