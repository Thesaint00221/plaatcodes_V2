// ============================================
// wachtwoord-herstellen.js
// Vangt de sessie op uit een Supabase "recovery"-link
// (index.html#access_token=...&type=recovery) en laat
// de gebruiker een nieuw wachtwoord instellen.
// ============================================

const SUPABASE_URL = "https://tiuxjwaovmchswunwouz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdXhqd2Fvdm1jaHN3dW53b3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTUyNTAsImV4cCI6MjA5OTA3MTI1MH0.iSnRGSxhEJQ0wjlznYdC89KTKovkhaKLO9cohsLHxLo";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const meldingLink = document.getElementById("meldingLink");
const statusControle = document.getElementById("statusControle");
const herstelForm = document.getElementById("herstelForm");
const meldingForm = document.getElementById("meldingForm");
const succesBlok = document.getElementById("succesBlok");
const verzendKnop = document.getElementById("verzendKnop");
const wachtwoord1 = document.getElementById("wachtwoord1");
const wachtwoord2 = document.getElementById("wachtwoord2");

let sessieGeldig = false;

function toonLinkFout(bericht){

    if(bericht){
        meldingLink.textContent = bericht;
    }

    meldingLink.style.display = "block";
    statusControle.classList.add("verborgen");
    herstelForm.classList.add("verborgen");

}

function toonFormulier(){

    if(sessieGeldig){
        return;
    }

    sessieGeldig = true;
    meldingLink.style.display = "none";
    statusControle.classList.add("verborgen");
    herstelForm.classList.remove("verborgen");

}

function toonFormMelding(tekst, isFout){

    meldingForm.textContent = tekst;
    meldingForm.className = `melding ${isFout ? "melding--fout" : "melding--succes"}`;

}

// Supabase-js verwerkt de #access_token uit de URL automatisch bij het
// laden van de client (detectSessionInUrl staat standaard aan) en stuurt
// daarna een PASSWORD_RECOVERY event.
supabaseClient.auth.onAuthStateChange((event, session) => {
    if(event === "PASSWORD_RECOVERY" && session){
        toonFormulier();
    }
});

// Vangnet: als de link zelf al een foutmelding bevat (bv. verlopen token),
// staat die als querystring in de hash, bv. #error=access_denied&error_code=otp_expired
(function controleerLinkFout(){

    const hash = window.location.hash.startsWith("#")
        ? window.location.hash.substring(1)
        : window.location.hash;

    const params = new URLSearchParams(hash);

    if(params.get("error")){
        toonLinkFout("Deze link is verlopen of al gebruikt. Vraag een nieuwe herstelmail aan.");
        return;
    }

    if(!params.get("access_token") && !params.get("type")){
        // Geen tokens in de link: mogelijk direct geopend zonder via de mail te gaan.
        toonLinkFout("Geen geldige herstellink gevonden. Open de link opnieuw vanuit je e-mail.");
    }

})();

// Extra vangnet: als er na 4 seconden nog geen PASSWORD_RECOVERY event kwam
// (en er ook geen link-fout getoond wordt), toch even de sessie checken.
setTimeout(async () => {

    if(sessieGeldig || meldingLink.style.display === "block"){
        return;
    }

    const {data} = await supabaseClient.auth.getSession();

    if(data?.session){
        toonFormulier();
    }else{
        toonLinkFout();
    }

}, 4000);

herstelForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const pw1 = wachtwoord1.value;
    const pw2 = wachtwoord2.value;

    if(pw1.length < 6){
        toonFormMelding("Wachtwoord moet minstens 6 tekens bevatten.", true);
        return;
    }

    if(pw1 !== pw2){
        toonFormMelding("De wachtwoorden komen niet overeen.", true);
        return;
    }

    verzendKnop.disabled = true;
    verzendKnop.textContent = "Bezig...";

    const {error} = await supabaseClient.auth.updateUser({password: pw1});

    verzendKnop.disabled = false;
    verzendKnop.textContent = "Wachtwoord opslaan";

    if(error){
        toonFormMelding(`Kon wachtwoord niet opslaan: ${error.message}`, true);
        return;
    }

    herstelForm.classList.add("verborgen");
    succesBlok.classList.remove("verborgen");

    setTimeout(() => {
        window.location.href = "index.html";
    }, 2500);

});
