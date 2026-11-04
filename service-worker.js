// ============================================
// Plaatcodes - Service worker
// App-code: netwerk eerst, cache als offline reserve.
// Afbeeldingen/iconen: cache eerst, daarna vernieuwen.
// ============================================

const CACHE_NAAM = "plaatcodes-shell-v9";

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
    "js/aankoopklachten-fotos.js",
    "js/app.js",
    "js/pwa.js",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/apple-touch-icon.png",
    "icons/favicon.ico",
    "images/logo-detremmerie.png"
];

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAAM);
        await cache.addAll(SHELL_BESTANDEN);
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const namen = await caches.keys();
        await Promise.all(
            namen
                .filter(naam => naam.startsWith("plaatcodes-shell-") && naam !== CACHE_NAAM)
                .map(naam => caches.delete(naam))
        );
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    if(request.method !== "GET" || url.origin !== self.location.origin){
        return;
    }

    // HTML, JavaScript en CSS moeten altijd eerst de nieuwste versie proberen.
    const appCode = request.mode === "navigate" ||
        /\.(html|js|css|json)$/i.test(url.pathname);

    if(appCode){
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_NAAM);
            try {
                const response = await fetch(request, {cache:"no-store"});
                if(response.ok){
                    await cache.put(request, response.clone());
                }
                return response;
            } catch(error) {
                const opgeslagen = await cache.match(request);
                if(opgeslagen) return opgeslagen;
                throw error;
            }
        })());
        return;
    }

    // Afbeeldingen en iconen: direct uit cache tonen en op de achtergrond vernieuwen.
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAAM);
        const opgeslagen = await cache.match(request);
        const netwerk = fetch(request).then(response => {
            if(response.ok) cache.put(request, response.clone());
            return response;
        }).catch(() => opgeslagen);

        return opgeslagen || netwerk;
    })());
});
