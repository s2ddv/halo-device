/* Build replaces the two tokens. No skipWaiting: updates activate after old tabs close. */
const VERSION = "__VERSION__";
const ASSETS = "__ASSETS__";
const PREFIX = "halo-pwa-";
const STATIC = `${PREFIX}${VERSION}-static`;
const PAGES = `${PREFIX}${VERSION}-pages`;
const DATA = `${PREFIX}${VERSION}-data`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC);
      await cache.addAll(ASSETS);
      const response = await fetch("/", { cache: "reload" });
      if (!response.ok || !response.headers.get("content-type")?.includes("text/html"))
        throw new Error("App shell unavailable");
      await (await caches.open(PAGES)).put("/", response);
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && ![STATIC, PAGES, DATA].includes(key))
          await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});
async function boundedPut(cache, request, response) {
  await cache.put(request, response);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - 40))) await cache.delete(key);
}
async function handle(request) {
  const url = new URL(request.url);
  if (ASSETS.includes(url.pathname) && !url.search) {
    return (await caches.open(STATIC)).match(request).then((cached) => cached || fetch(request));
  }
  const navigation = request.mode === "navigate";
  const cache = await caches.open(navigation ? PAGES : DATA);
  try {
    const response = await fetch(request);
    const control = response.headers.get("cache-control") || "";
    // Future private APIs/server functions must never be persisted by this worker.
    const cacheable =
      response.ok &&
      !/no-store|private/i.test(control) &&
      (navigation || /\bpublic\b/i.test(control));
    if (cacheable) await boundedPut(cache, request, response.clone());
    else await cache.delete(request);
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (navigation) return (await caches.open(STATIC)).match("/offline.html");
    return Response.error();
  }
}
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("authorization") ||
    request.destination === "iframe"
  )
    return;
  event.respondWith(
    (async () => {
      const client = event.clientId ? await self.clients.get(event.clientId) : null;
      if (client?.frameType === "nested") return fetch(request);
      return handle(request);
    })(),
  );
});
