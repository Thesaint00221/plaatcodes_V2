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

    inhoud.innerHTML = `

        <div class="uploadVeld">
            <label for="bewerkTitel-${id}">Titel</label>
            <input
                id="bewerkTitel-${id}"
                type="text"
                maxlength="80"
                value="${(titelOud || "").replace(/"/g,"&quot;")}">
        </div>

        <div class="uploadVeld">
            <label for="bewerkOpmerking-${id}">Opmerking</label>
            <textarea
                id="bewerkOpmerking-${id}"
                rows="4">${opmerkingOud}</textarea>
        </div>

        <button
            type="button"
            class="bewerkOpslaan"
            onclick="slaBewerkingOp('${id}', this)">

            ${icoon("vink")} Opslaan

        </button>

        <button
            type="button"
            class="bewerkAnnuleren"
            onclick="annuleerBewerking('${id}', this)">

            Annuleren

        </button>

    `;

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
        console.error(error);
        alert("Opslaan mislukt.");
        knop.disabled = false;
        knop.innerHTML = oorspronkelijkeTekst;
        return;
    }

    // Eenvoudigste, veiligste manier om de kaart weer in lijn te
    // brengen met de database: de hele galerij herladen.
    await toonFotos(window.geselecteerdePlaat);

}
