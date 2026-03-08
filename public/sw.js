const SW_VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE_NAME = `novyn-shell-${SW_VERSION}`;
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/login.css",
  "/styles.css",
  "/src/main.js",
  "/src/login-main.js",
  "/src/app/router.js",
  "/src/app/store.js",
  "/src/app/socket-client.js",
  "/src/pages/login/LoginPage.js",
  "/src/pages/login/LoginScene3D.js",
  "/src/pages/chat/ChatPage.js",
  "/src/components/sidebar.js",
  "/src/components/messages.js",
  "/src/components/composer.js",
  "/src/components/typing-bar.js",
  "/src/components/smart-replies.js",
  "/src/components/toasts.js",
  "/src/components/modals.js",
  "/src/ai/novyn-ai.js",
  "/src/theme/tokens.css",
  "/src/theme/iris-dark.css",
  "/src/theme/iris-light.css",
  "/src/theme/motion.css",
  "/src/styles/base.css",
  "/src/styles/layout.css",
  "/src/styles/components.css",
  "/pwa-register.js",
  "/manifest.json",
  "/icons/irisync-icon.svg",
  "/icons/irisync-logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        SHELL_ASSETS.map(async (assetPath) => {
          try {
            const request = new Request(assetPath, { cache: "no-store" });
            const response = await fetch(request);
            if (!response.ok) return;
            await cache.put(request, response.clone());
          } catch (_err) {
            // Ignore optional/missing assets so install cannot fail hard.
          }
        })
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Do not intercept realtime socket transport requests.
  if (url.pathname.startsWith("/socket.io/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((res) => res || caches.match(url.pathname) || caches.match("/index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
