// ============================================
// service-worker.js
// Cachet enkel de statische app-shell (HTML/CSS/JS/iconen).
// Supabase-API-calls en storage-afbeeldingen zijn cross-origin en worden
// bewust NIET onderschept: de catalogus moet altijd actuele data tonen.
// ============================================

const CACHE_NAAM = "plaatcodes-shell-v1";

const SHELL_BESTANDEN = [
    "./",
    "index.html",
    "beheer.html",
    "style.min.css",
    "manifest.json",
    "js/supabase.js",
    "js/auth.js",
    "js/catalogus.js",
    "js/detail.js",
    "js/foto.js",
    "js/upload.js",
    "js/opslag.js",
    "js/opschonen.js",
    "js/platen-beheer.js",
    "js/archief.js",
    "js/beheer.js",
    "js/app.js",
    "js/pwa.js",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/apple-touch-icon.png",
    "icons/favicon.ico"
];

self.addEventListener("install", event => {

    event.waitUntil(
        caches
            .open(CACHE_NAAM)
            .then(cache => cache.addAll(SHELL_BESTANDEN))
    );

    self.skipWaiting();

});

self.addEventListener("activate", event => {

    event.waitUntil(
        caches
            .keys()
            .then(namen => Promise.all(
                namen
                    .filter(naam => naam !== CACHE_NAAM)
                    .map(naam => caches.delete(naam))
            ))
    );

    self.clients.claim();

});

self.addEventListener("fetch", event => {

    const url = new URL(event.request.url);

    // Enkel eigen GET-requests cachen. Alles cross-origin (Supabase API,
    // storage-foto's, de supabase-js CDN-link) gaat gewoon rechtstreeks
    // naar het netwerk, zoals in een pagina zonder service worker.
    if(event.request.method !== "GET" || url.origin !== self.location.origin){
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAAM).then(async cache => {

            const cacheMatch = await cache.match(event.request);

            const netwerkFetch = fetch(event.request)
                .then(response => {
                    if(response.ok){
                        cache.put(event.request, response.clone());
                    }
                    return response;
                })
                .catch(() => cacheMatch);

            // Stale-while-revalidate: toon direct de cache-versie indien
            // aanwezig (snel, ook bij een slechte verbinding op de
            // werkvloer) en ververs de cache op de achtergrond.
            return cacheMatch || netwerkFetch;

        })
    );

});
