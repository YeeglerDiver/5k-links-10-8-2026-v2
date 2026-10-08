const REPO_NAME = "5k-links-10-8-2026-v2";
const REPO_PREFIX = `/${REPO_NAME}/`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only intercept requests directed at the same domain
  if (url.origin === location.origin) {
    const pathname = url.pathname;

    // 1. Mock API endpoints that do not exist on static GitHub Pages
    if (pathname.startsWith("/status/") || pathname.includes("/ping")) {
      event.respondWith(
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    if (pathname === "/reviews" || pathname.startsWith("/reviews/")) {
      event.respondWith(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    if (pathname.includes("/leaderboard/")) {
      event.respondWith(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    if (pathname.includes("/__rv/version")) {
      event.respondWith(
        new Response(JSON.stringify({ version: "1.0.0" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );
      return;
    }

    // 2. Redirect root-level asset calls into the GitHub Pages repository folder
    if (!pathname.startsWith(REPO_PREFIX)) {
      const targetPath = `${REPO_PREFIX}${pathname.replace(/^\/+/, "")}`;
      const targetUrl = new URL(targetPath + url.search, location.origin);
      event.respondWith(fetch(targetUrl.href, event.request));
      return;
    }
  }

  // Pass through all other network requests
  event.respondWith(fetch(event.request));
});
