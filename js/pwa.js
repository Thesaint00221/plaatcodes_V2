// ============================================
// pwa.js
// Registreert de service worker (indien de browser dit ondersteunt)
// ============================================

if("serviceWorker" in navigator){

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("service-worker.js")
            .catch(error => {
                console.error("Service worker registratie mislukt:", error);
            });

    });

}
