// ============================================
// Plaatcodes - PWA updatebeheer
// Controleert automatisch op nieuwe versies.
// ============================================

if("serviceWorker" in navigator){

    let laatsteUpdateControle = 0;
    let herladenNaUpdate = false;
    const hadController = !!navigator.serviceWorker.controller;

    async function controleerNieuweVersie(registration){
        const nu = Date.now();

        // Vermijd onnodige updateverzoeken bij snel wisselen tussen tabbladen.
        if(nu - laatsteUpdateControle < 5 * 60 * 1000) return;

        laatsteUpdateControle = nu;

        try {
            await registration.update();
        } catch(error) {
            console.warn("Controleren op website-update is niet gelukt:", error);
        }
    }

    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "service-worker.js",
                { updateViaCache: "none" }
            );

            // Meteen na openen controleren en daarna periodiek.
            await controleerNieuweVersie(registration);
            window.setInterval(() => controleerNieuweVersie(registration), 30 * 60 * 1000);

            document.addEventListener("visibilitychange", () => {
                if(document.visibilityState === "visible"){
                    controleerNieuweVersie(registration);
                }
            });

            window.addEventListener("focus", () => controleerNieuweVersie(registration));

        } catch(error) {
            console.error("Service worker registratie mislukt:", error);
        }
    });

    // Bij een echte update wordt de pagina één keer vernieuwd.
    // Bij de allereerste installatie is dat niet nodig.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if(hadController && !herladenNaUpdate){
            herladenNaUpdate = true;
            window.location.reload();
        }
    });
}
