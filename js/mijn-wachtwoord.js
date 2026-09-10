// ============================================
// mijn-wachtwoord.js
// Laat elke ingelogde gebruiker (rol maakt niet uit) zijn eigen
// wachtwoord wijzigen. Injecteert de modal dynamisch in de pagina,
// zodat dit overal werkt waar het gebruikersmenu (auth.js) staat,
// zonder dat elke HTML-pagina apart aangepast moet worden.
// ============================================

function mwInjecteerModal(){

    if(document.getElementById("mijnWachtwoordModal")){
        return;
    }

    const wrapper = document.createElement("section");
    wrapper.id = "mijnWachtwoordModal";
    wrapper.className = "plaatModal hidden";
    wrapper.setAttribute("role", "dialog");
    wrapper.setAttribute("aria-modal", "true");
    wrapper.setAttribute("aria-labelledby", "mijnWachtwoordTitel");

    wrapper.innerHTML = `

        <form id="mijnWachtwoordForm" class="plaatForm">

            <div class="plaatFormKop">
                <div>
                    <p class="beheerEyebrow">Account</p>
                    <h2 id="mijnWachtwoordTitel">Wachtwoord wijzigen</h2>
                    <p>Kies een nieuw wachtwoord voor je eigen account.</p>
                </div>
                <button id="sluitMijnWachtwoordModal" class="modalSluiten" type="button" aria-label="Sluiten">×</button>
            </div>

            <div class="plaatFormGrid">
                <label>Nieuw wachtwoord<input id="mwWachtwoord1" type="password" autocomplete="new-password" minlength="8" required></label>
                <label>Bevestig wachtwoord<input id="mwWachtwoord2" type="password" autocomplete="new-password" minlength="8" required></label>
            </div>

            <p id="mwMelding" class="plaatFormMelding" aria-live="polite"></p>

            <div class="plaatFormActies">
                <button id="mwAnnuleren" class="secundaireKnop" type="button">Annuleren</button>
                <button id="mwVerzendKnop" class="primary" type="submit">Wachtwoord wijzigen</button>
            </div>

        </form>

    `;

    document.body.appendChild(wrapper);

    voegWachtwoordToggleToe("mwWachtwoord1");
    voegWachtwoordToggleToe("mwWachtwoord2");

    document.getElementById("sluitMijnWachtwoordModal")?.addEventListener("click", sluitMijnWachtwoordModal);
    document.getElementById("mwAnnuleren")?.addEventListener("click", sluitMijnWachtwoordModal);

    // Sluiten bij klikken op de donkere achtergrond (buiten het formulier)
    wrapper.addEventListener("click", (event) => {
        if(event.target === wrapper){
            sluitMijnWachtwoordModal();
        }
    });

    document.getElementById("mijnWachtwoordForm")?.addEventListener("submit", mwOpslaan);

}

function mwToonMelding(tekst, isFout){

    const melding = document.getElementById("mwMelding");

    if(!melding){
        return;
    }

    melding.innerHTML = tekst
        ? `${icoon(isFout ? "fout" : "vink")} ${tekst}`
        : "";

}

function openMijnWachtwoordModal(){

    mwInjecteerModal();

    const modal = document.getElementById("mijnWachtwoordModal");
    const form = document.getElementById("mijnWachtwoordForm");

    form?.reset();
    mwToonMelding("", false);
    modal?.classList.remove("hidden");
    document.getElementById("mwWachtwoord1")?.focus();

}

function sluitMijnWachtwoordModal(){
    document.getElementById("mijnWachtwoordModal")?.classList.add("hidden");
}

async function mwOpslaan(event){

    event.preventDefault();

    const pw1 = document.getElementById("mwWachtwoord1")?.value || "";
    const pw2 = document.getElementById("mwWachtwoord2")?.value || "";
    const knop = document.getElementById("mwVerzendKnop");

    if(pw1.length < 8){
        mwToonMelding("Wachtwoord moet minstens 8 tekens bevatten.", true);
        return;
    }

    if(pw1 !== pw2){
        mwToonMelding("De wachtwoorden komen niet overeen.", true);
        return;
    }

    if(knop){
        knop.disabled = true;
    }

    mwToonMelding("Bezig...", false);

    const {error} = await supabaseClient.auth.updateUser({password: pw1});

    if(knop){
        knop.disabled = false;
    }

    if(error){
        console.error("Eigen wachtwoord wijzigen mislukt:", error);
        mwToonMelding(`Kon wachtwoord niet wijzigen: ${error.message}`, true);
        return;
    }

    mwToonMelding("Wachtwoord succesvol gewijzigd.", false);

    setTimeout(sluitMijnWachtwoordModal, 1500);

}
