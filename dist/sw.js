const REPO_PREFIX = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Mock internal API endpoints that static GitHub Pages cannot handle
  if (url.origin === location.origin) {
    const pathname = url.pathname;

    // Search bar suggestions
    if (pathname.startsWith("/suggest") || url.searchParams.has("engine")) {
      const query = url.searchParams.get("q") || "";
      event.respondWith(
        new Response(JSON.stringify([query, []]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    // Ping & status endpoints
    if (pathname.includes("/status/") || pathname.includes("/ping")) {
      event.respondWith(
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    // Reviews & leaderboards
    if (pathname.includes("/reviews") || pathname.includes("/leaderboard/")) {
      event.respondWith(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    // Reroute apex domain requests into the repo folder
    if (!pathname.startsWith(REPO_PREFIX)) {
      const fixedPath = REPO_PREFIX + pathname.replace(/^\/+/, "");
      const fixedUrl = new URL(fixedPath + url.search, location.origin);
      event.respondWith(
        fetch(fixedUrl.href, event.request).catch(() => new Response("", { status: 404 }))
      );
      return;
    }
  }

  // 2. Wrap cross-origin fetches in a catch block so CORS rejections do not break the worker
  event.respondWith(
    fetch(event.request).catch((err) => {
      // If a CDN blocks CORS, attempt an open CORS proxy fallback for raw assets
      if (url.hostname.includes("rawcdn.githack.com") || url.hostname.includes("githubusercontent.com")) {
        const fallbackUrl = "https://corsproxy.io/?" + encodeURIComponent(event.request.url);
        return fetch(fallbackUrl).catch(() => new Response(null, { status: 502, statusText: "CORS Blocked" }));
      }
      return new Response(null, { status: 408, statusText: "Network Error" });
    })
  );
});
