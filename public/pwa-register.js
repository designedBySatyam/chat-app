(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (err) {
      console.warn("Service worker registration failed:", err);
    }
  });
})();
