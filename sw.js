const REPO_PREFIX = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin === location.origin) {
    const pathname = url.pathname;

    // Mock missing endpoints that static GitHub Pages cannot handle
    if (pathname.includes("/status/") || pathname.includes("/ping")) {
      event.respondWith(
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    if (pathname.includes("/reviews") || pathname.includes("/leaderboard/")) {
      event.respondWith(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    // Fix requests that were aimed directly at domain root (e.g. /data/, /books/, /dist/)
    if (!pathname.startsWith(REPO_PREFIX)) {
      const fixedPath = REPO_PREFIX + pathname.replace(/^\/+/, "");
      const fixedUrl = new URL(fixedPath + url.search, location.origin);
      event.respondWith(fetch(fixedUrl.href, event.request));
      return;
    }
  }

  event.respondWith(fetch(event.request));
});
