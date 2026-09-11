// ============================================
// service-worker.js
// Cachet enkel de statische app-shell (HTML/CSS/JS/iconen).
// Supabase-API-calls en storage-afbeeldingen zijn cross-origin en worden
// bewust NIET onderschept: de catalogus moet altijd actuele data tonen.
// ============================================

const CACHE_NAAM = "plaatcodes-shell-v7";

const SHELL_BESTANDEN = [
    "./",
    "index.html",
    "beheer.html",
    "overzicht.html",
    "klachten.html",
    "style.min.css",
    "phase1.css",
    "phase3.css",
    "manifest.json",
    "js/security-utils.js",
    "js/supabase.js",
    "js/icons.js",
    "js/wachtwoord-toggle.js",
    "js/dropdown-sluiten.js",
    "js/auth.js",
    "js/mijn-wachtwoord.js",
    "js/menu.js",
    "js/catalogus.js",
    "js/detail.js",
    "js/bewerken.js",
    "js/rapport.js",
    "js/foto.js",
    "js/upload.js",
    "js/opslag.js",
    "js/overzicht.js",
    "js/opschonen.js",
    "js/platen-beheer.js",
    "js/archief.js",
    "js/beheer.js",
    "js/gebruikers-beheer.js",
    "js/wachtwoord-beheer.js",
    "js/aankoopklachten.js",
    "js/app.js",
    "js/pwa.js",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/apple-touch-icon.png",
    "icons/favicon.ico",
    "images/logo-detremmerie.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAAM).then(cache => cache.addAll(SHELL_BESTANDEN))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(namen => Promise.all(
            namen
                .filter(naam => naam !== CACHE_NAAM)
                .map(naam => caches.delete(naam))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    if(event.request.method !== "GET" || url.origin !== self.location.origin){
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAAM).then(async cache => {
            const cacheMatch = await cache.match(event.request);
            const netwerkFetch = fetch(event.request)
                .then(response => {
                    if(response.ok) cache.put(event.request, response.clone());
                    return response;
                })
                .catch(() => cacheMatch);

            return cacheMatch || netwerkFetch;
        })
    );
});