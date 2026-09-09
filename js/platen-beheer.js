// ============================================
// platen-beheer.js
// Nieuwe platen toevoegen + bestaande platen aanpassen (enkel beheerders)
// ============================================

const plaatModal = document.getElementById("plaatModal");
const nieuwePlaatForm = document.getElementById("nieuwePlaatForm");
const plaatFormMelding = document.getElementById("plaatFormMelding");
const plaatModalTitel = document.getElementById("plaatModalTitel");
const plaatModalOmschrijving = document.getElementById("plaatModalOmschrijving");
const plaatZoekVeld = document.getElementById("plaatZoekVeld");
const plaatZoekInput = document.getElementById("plaatZoekInput");
const plaatZoekResultaten = document.getElementById("plaatZoekResultaten");
const plaatFormGrid = document.querySelector("#plaatModal .plaatFormGrid");
const plaatFormActies = document.querySelector("#plaatModal .plaatFormActies");
const plaatFotoLabelTekst = document.querySelector("#plaatFotoLabel .plaatFotoLabelTekst");

// Bewerkstatus: null = nieuwe plaat toevoegen, anders de ORIGINELE code
// van de plaat die aangepast wordt (de code zelf is niet aanpasbaar --
// zie toelichting bij openPlaatModalBewerken).
let bewerkOorspronkelijkeCode = null;

function isBeheerder(){
    return window.huidigeGebruiker?.rol === "beheerder";
}

function sluitPlaatModal(){
    plaatModal.classList.add("hidden");
    plaatFormMelding.textContent = "";
    bewerkOorspronkelijkeCode = null;
    plaatZoekVeld.classList.add("hidden");
    plaatFormGrid.classList.remove("hidden");
    plaatFormActies.classList.remove("hidden");
}

// ============================================
// Modal openen: nieuwe plaat
// ============================================

function openPlaatModalToevoegen(){

    if(!isBeheerder()){
        return;
    }

    bewerkOorspronkelijkeCode = null;
    nieuwePlaatForm.reset();

    plaatModalTitel.textContent = "Nieuwe plaat toevoegen";
    plaatModalOmschrijving.textContent = "De plaat wordt onmiddellijk in de catalogus opgeslagen.";
    plaatFotoLabelTekst.textContent = "Foto";

    document.getElementById("plaatCode").disabled = false;
    plaatZoekVeld.classList.add("hidden");
    plaatFormGrid.classList.remove("hidden");
    plaatFormActies.classList.remove("hidden");

    plaatModal.classList.remove("hidden");
    document.getElementById("plaatNaam").focus();

}

// ============================================
// Modal openen: eerst een plaat opzoeken om aan te passen
// ============================================

function openPlaatModalZoeken(){

    if(!isBeheerder()){
        return;
    }

    bewerkOorspronkelijkeCode = null;

    plaatModalTitel.textContent = "Plaat aanpassen";
    plaatModalOmschrijving.textContent = "Zoek eerst de plaat die je wil aanpassen.";

    plaatFormGrid.classList.add("hidden");
    plaatFormActies.classList.add("hidden");
    plaatZoekVeld.classList.remove("hidden");
    plaatZoekInput.value = "";
    plaatZoekResultaten.innerHTML = "";

    plaatModal.classList.remove("hidden");
    plaatZoekInput.focus();

}

// ============================================
// Modal openen: bewerkformulier, vooraf ingevuld
// (rechtstreeks aan te roepen vanaf de plaat-detailpagina,
// of na een keuze uit de zoekresultaten hierboven)
// ============================================

function openPlaatModalBewerken(plaat){

    if(!isBeheerder() || !plaat){
        return;
    }

    bewerkOorspronkelijkeCode = plaat.code;

    plaatModalTitel.textContent = "Plaat aanpassen";
    plaatModalOmschrijving.textContent = "Wijzigingen worden meteen opgeslagen.";
    plaatFotoLabelTekst.textContent = "Foto (optioneel — laat leeg om de bestaande te behouden)";

    document.getElementById("plaatNaam").value = plaat.naam || "";
    document.getElementById("plaatCode").value = plaat.code || "";
    document.getElementById("plaatCode").disabled = true;
    document.getElementById("plaatLeverancier").value = plaat.leverancier || "";
    document.getElementById("plaatReferentie").value = plaat.info?.Referentie || plaat.referentie || "";
    document.getElementById("plaatKleur").value = plaat.info?.Kleur || plaat.kleur || "";

    const kleurnummerWaarde = plaat.info?.Kleurnummer ?? plaat.kleurnummer;
    document.getElementById("plaatKleurnummer").value = kleurnummerWaarde === undefined || kleurnummerWaarde === null ? "" : kleurnummerWaarde;

    document.getElementById("plaatFoto").value = "";
    plaatFormMelding.textContent = "";

    plaatZoekVeld.classList.add("hidden");
    plaatFormGrid.classList.remove("hidden");
    plaatFormActies.classList.remove("hidden");

    plaatModal.classList.remove("hidden");

}

document.getElementById("nieuwePlaatKnop")?.addEventListener("click", openPlaatModalToevoegen);
document.getElementById("plaatAanpassenKnop")?.addEventListener("click", openPlaatModalZoeken);

document.getElementById("sluitPlaatModal")?.addEventListener("click", sluitPlaatModal);
document.getElementById("annuleerPlaat")?.addEventListener("click", sluitPlaatModal);

plaatModal?.addEventListener("click", event => {
    if(event.target === plaatModal){
        sluitPlaatModal();
    }
});

// ============================================
// Zoeken (binnen de "Plaat aanpassen"-stap)
// ============================================

plaatZoekInput?.addEventListener("input", () => {

    clearTimeout(plaatZoekInput._timer);

    plaatZoekInput._timer = setTimeout(async () => {

        const term = plaatZoekInput.value.trim();

        if(term.length < 2){
            plaatZoekResultaten.innerHTML = "";
            return;
        }

        // ✅ Gebruik saniteerZoekterm() uit security-utils.js voor betere veiligheid
        const veiligeTerm = saniteerZoekterm(term);

        if(!veiligeTerm) {
            plaatZoekResultaten.innerHTML = '<p class="geenResultaat">Voer geldige zoektermen in.</p>';
            return;
        }

        const {data, error} = await supabaseClient
            .from("platen")
            .select("naam, code, leverancier, photos, referentie, kleur, kleurnummer, gearchiveerd")
            .or(`naam.ilike.%${veiligeTerm}%,code.ilike.%${veiligeTerm}%,leverancier.ilike.%${veiligeTerm}%`)
            .limit(8);

        if(error){
            console.error("Platen zoeken mislukt:", error);
            plaatZoekResultaten.innerHTML = '<p class="geenResultaat">Zoeken mislukt. Probeer het later opnieuw.</p>';
            return;
        }

        if(!data || data.length === 0){
            plaatZoekResultaten.innerHTML = '<p class="geenResultaat">Geen platen gevonden.</p>';
            return;
        }

        plaatZoekResultaten.innerHTML = "";

        data.forEach(rij => {

            const plaat = normaliseerPlaat(rij);
            const item = document.createElement("button");

            item.type = "button";
            item.className = "plaatZoekItem";
            item.innerHTML = `
                <strong>${escapeHtml(plaat.naam)}</strong>
                <span>${escapeHtml(plaat.code)} · ${escapeHtml(plaat.leverancier)}${plaat.gearchiveerd ? " · gearchiveerd" : ""}</span>
            `;

            // ✅ Voeg event listener toe i.p.v. onclick-attribuut
            item.addEventListener("click", () => openPlaatModalBewerken(plaat));

            plaatZoekResultaten.appendChild(item);

        });

    }, 300);

});

// Toegelaten tekens in een plaatcode: letters, cijfers, spaties, punt, streepje, underscore, schuine streep
const PLAATCODE_PATROON = /^[A-Za-z0-9 ._/-]{1,50}$/;

async function codeAlBezet(code){
    const {count, error} = await supabaseClient
        .from("platen")
        .select("code", {count: "exact", head: true})
        .eq("code", code);

    if(error){
        console.error("Code check mislukt:", error);
        // Bij een onzekere check laten we de submit doorgaan; de unieke
        // constraint in de database vangt duplicaten sowieso alsnog op.
        return false;
    }

    return (count || 0) > 0;
}

nieuwePlaatForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if(!isBeheerder()){
        plaatFormMelding.textContent = "Je hebt geen toestemming om platen te beheren.";
        return;
    }

    const bewerkModus = bewerkOorspronkelijkeCode !== null;

    const opslaanKnop = nieuwePlaatForm.querySelector('[type="submit"]');
    const opslaanKnopTekst = opslaanKnop.innerHTML;
    const code = document.getElementById("plaatCode").value.trim();
    const foto = document.getElementById("plaatFoto").files[0];

    // Vooraf valideren, vóór er iets geüpload wordt (enkel relevant bij
    // een nieuwe plaat -- bij bewerken staat de code vast)
    if(!bewerkModus && !isValidePlaatcode(code)){
        plaatFormMelding.textContent =
            "Ongeldige plaatcode. Gebruik enkel letters, cijfers, spaties, punten, streepjes of underscores (max. 50 tekens).";
        return;
    }

    opslaanKnop.disabled = true;
    opslaanKnop.innerHTML = "⏳ Bezig...";
    plaatFormMelding.textContent = bewerkModus ? "Plaat aanpassen..." : "Code controleren...";

    try {

        if(!bewerkModus && await codeAlBezet(code)){
            plaatFormMelding.textContent = "Deze plaatcode bestaat al.";
            return;
        }

        const gegevens = {
            naam: document.getElementById("plaatNaam").value.trim(),
            leverancier: document.getElementById("plaatLeverancier").value.trim(),
            referentie: document.getElementById("plaatReferentie").value.trim() || null,
            kleur: document.getElementById("plaatKleur").value.trim() || null,
            kleurnummer: (() => {
                const w = document.getElementById("plaatKleurnummer").value;
                return w === "" ? null : Number(w);
            })()
        };

        if(!bewerkModus){
            gegevens.code = code;
        }

        if(foto){

            plaatFormMelding.textContent = "Foto verkleinen...";

            const verkleind = await verkleinFoto(foto);
            const doelCode = bewerkModus ? bewerkOorspronkelijkeCode : code;
            const bestandsnaam = `${doelCode.replace(/[^a-z0-9-_]/gi, "-")}-${Date.now()}.jpg`;
            const opslagpad = `platen/${bestandsnaam}`;

            plaatFormMelding.textContent = "Foto uploaden...";

            const {error: uploadError} = await supabaseClient
                .storage
                .from("plaatfotos")
                .upload(opslagpad, verkleind, {upsert: false});

            if(uploadError){
                throw uploadError;
            }

            const {data: urlData} = supabaseClient
                .storage
                .from("plaatfotos")
                .getPublicUrl(opslagpad);

            gegevens.photos = [urlData.publicUrl];

        }

        plaatFormMelding.textContent = bewerkModus ? "Wijzigingen opslaan..." : "Plaat opslaan...";

        const query = bewerkModus
            ? supabaseClient.from("platen").update(gegevens).eq("code", bewerkOorspronkelijkeCode)
            : supabaseClient.from("platen").insert(gegevens);

        const {error} = await query;

        if(error){
            throw error;
        }

        const bewerkteCode = bewerkModus ? bewerkOorspronkelijkeCode : code;

        nieuwePlaatForm.reset();
        sluitPlaatModal();

        // ✅ Invalideer leveranciers-cache zodat deze opnieuw geladen wordt
        await invalideerLeveranciersCache();

        // Als je net deze plaat aan het bekijken was, die detailpagina
        // meteen verversen i.p.v. terug te vallen op het overzicht.
        if(window.geselecteerdePlaat?.code === bewerkteCode){

            const {data: verseData} = await supabaseClient
                .from("platen")
                .select("naam, code, leverancier, photos, referentie, kleur, kleurnummer, gearchiveerd")
                .eq("code", bewerkteCode)
                .maybeSingle();

            if(verseData){
                await toonDetail(normaliseerPlaat(verseData));
            }

        }else{

            await initCatalogus();

        }

    }catch(error){
        console.error("Plaat opslaan mislukt:", error);
        plaatFormMelding.textContent = error.code === "23505"
            ? "Deze plaatcode bestaat al."
            : "Opslaan mislukt. Controleer je Supabase-instellingen en probeer het later opnieuw.";
    }finally{
        opslaanKnop.disabled = false;
        opslaanKnop.innerHTML = opslaanKnopTekst;
    }
});
