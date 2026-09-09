// ============================================
// bewerken.js
// Titel + opmerking van een bestaande case aanpassen.
// Rechten: dezelfde regel als verwijderen (eigenaar of beheerder),
// zie magVerwijderen() in detail.js.
// ============================================

function bewerkCase(id, knop){

    const item = window.laatstGeladenCases?.[id];

    if(!item){
        alert("Kon de case-gegevens niet vinden.");
        return;
    }

    const kaart = knop.closest(".caseKaart");
    const inhoud = kaart?.querySelector(".caseKaartInhoud");

    if(!inhoud){
        return;
    }

    const [titelOud, ...restOud] = (item.omschrijving || "").split("\n");
    const opmerkingOud = restOud.join("\n");

    inhoud.dataset.oorspronkelijkeInhoud = inhoud.innerHTML;

    // ✅ HTML zonder onclick-attributen
    inhoud.innerHTML = `

        <div class="uploadVeld">
            <label for="bewerkTitel-${escapeHtml(id)}">Titel</label>
            <input
                id="bewerkTitel-${escapeHtml(id)}"
                type="text"
                maxlength="80"
                value="${escapeHtml(titelOud || "")}">
        </div>

        <div class="uploadVeld">
            <label for="bewerkOpmerking-${escapeHtml(id)}">Opmerking</label>
            <textarea
                id="bewerkOpmerking-${escapeHtml(id)}"
                rows="4">${escapeHtml(opmerkingOud)}</textarea>
        </div>

        <button
            type="button"
            class="bewerkOpslaan"
            data-case-id="${escapeHtml(id)}">

            ${icoon("vink")} Opslaan

        </button>

        <button
            type="button"
            class="bewerkAnnuleren"
            data-case-id="${escapeHtml(id)}">

            Annuleren

        </button>

    `;

    // ✅ Voeg event listeners toe ÁNA HTML
    const opslaarKnop = inhoud.querySelector('.bewerkOpslaan');
    const annuleerKnop = inhoud.querySelector('.bewerkAnnuleren');

    if(opslaarKnop) {
        opslaarKnop.addEventListener('click', async () => {
            await slaBewerkingOp(id, opslaarKnop);
        });
    }

    if(annuleerKnop) {
        annuleerKnop.addEventListener('click', () => {
            annuleerBewerking(id, annuleerKnop);
        });
    }

}

function annuleerBewerking(id, knop){

    const kaart = knop.closest(".caseKaart");
    const inhoud = kaart?.querySelector(".caseKaartInhoud");

    if(inhoud?.dataset.oorspronkelijkeInhoud){
        inhoud.innerHTML = inhoud.dataset.oorspronkelijkeInhoud;
    }

}

async function slaBewerkingOp(id, knop){

    const titelVeld = document.getElementById(`bewerkTitel-${id}`);
    const opmerkingVeld = document.getElementById(`bewerkOpmerking-${id}`);

    if(!titelVeld || !opmerkingVeld) {
        alert("Kon de invoervelden niet vinden.");
        return;
    }

    const titel = titelVeld.value.trim() || "Geen titel";
    const opmerking = opmerkingVeld.value.trim() || "Geen opmerking";

    const oorspronkelijkeTekst = knop.innerHTML;

    knop.disabled = true;
    knop.innerHTML = `${icoon("vink")} Bezig met opslaan...`;

    const {error} =
        await supabaseClient
            .from("eigen_data")
            .update({
                omschrijving: `${titel}\n${opmerking}`
            })
            .eq("id", id);

    if(error){
        console.error("Bewerking opslaan mislukt:", error);
        alert("Opslaan mislukt. Probeer het later opnieuw.");
        knop.disabled = false;
        knop.innerHTML = oorspronkelijkeTekst;
        return;
    }

    // Eenvoudigste, veiligste manier om de kaart weer in lijn te
    // brengen met de database: de hele galerij herladen.
    await toonFotos(window.geselecteerdePlaat);

}
