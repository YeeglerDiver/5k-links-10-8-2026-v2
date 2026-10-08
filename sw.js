/* Re:Vault - legacy service-worker tombstone.
 *
 * The real, fully-cloaked service worker is registered from /dist/<random>.js by
 * the app (see src/client/app/proxy.js). This file exists ONLY to tear down any
 * historical "/sw.js" registration (e.g. from the old vaultv11 app) that pointed
 * at now-dead engine paths. Any browser that still re-fetches /sw.js will get
 * this, unregister itself, and fall back to the app registering the current SW on
 * its next load. Served no-cache so the teardown reaches stale clients promptly.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
	e.waitUntil(
		(async () => {
			try { await self.registration.unregister(); } catch (err) {}
			try { const cs = await self.clients.matchAll(); for (const c of cs) c.navigate(c.url); } catch (err) {}
		})()
	);
});
