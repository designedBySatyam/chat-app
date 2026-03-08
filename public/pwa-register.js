if ("serviceWorker" in navigator) {
  const metaBuild = document
    .querySelector('meta[name="novyn-build"]')
    ?.getAttribute("content")
    ?.trim();
  const buildToken = metaBuild || "dev";
  if (!metaBuild) {
    console.warn('Missing <meta name="novyn-build">, using fallback SW build token "dev".');
  }
  const swUrl = `/sw.js?v=${encodeURIComponent(buildToken)}`;

  let refreshing = false;

  function promptForUpdate(registration) {
    if (!registration?.waiting) return;
    const wantsUpdate = window.confirm(
      "A new version is available. Refresh now?"
    );
    if (wantsUpdate) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(swUrl, { updateViaCache: "none" })
      .then((registration) => {
        if (registration.waiting) {
          promptForUpdate(registration);
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promptForUpdate(registration);
            }
          });
        });
      })
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
  });
}
