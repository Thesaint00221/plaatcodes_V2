// ============================================
// platen-beheer.js
// Nieuwe platen toevoegen (enkel beheerders)
// ============================================

const plaatModal = document.getElementById("plaatModal");
const nieuwePlaatForm = document.getElementById("nieuwePlaatForm");
const plaatFormMelding = document.getElementById("plaatFormMelding");

function isBeheerder(){
    return window.huidigeGebruiker?.rol === "beheerder";
}

function sluitPlaatModal(){
    plaatModal.classList.add("hidden");
    plaatFormMelding.textContent = "";
}

document.getElementById("nieuwePlaatKnop")?.addEventListener("click", () => {
    if(!isBeheerder()){
        return;
    }

    plaatModal.classList.remove("hidden");
    document.getElementById("plaatNaam").focus();
});

document.getElementById("sluitPlaatModal")?.addEventListener("click", sluitPlaatModal);
document.getElementById("annuleerPlaat")?.addEventListener("click", sluitPlaatModal);

plaatModal?.addEventListener("click", event => {
    if(event.target === plaatModal){
        sluitPlaatModal();
    }
});

// Toegelaten tekens in een plaatcode: letters, cijfers, spaties, punt, streepje, underscore, schuine streep
const PLAATCODE_PATROON = /^[A-Za-z0-9 ._/-]{1,50}$/;

async function codeAlBezet(code){
    const {count, error} = await supabaseClient
        .from("platen")
        .select("code", {count: "exact", head: true})
        .eq("code", code);

    if(error){
        console.error(error);
        // Bij een onzekere check laten we de submit doorgaan; de unieke
        // constraint in de database vangt duplicaten sowieso alsnog op.
        return false;
    }

    return (count || 0) > 0;
}

nieuwePlaatForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if(!isBeheerder()){
        plaatFormMelding.textContent = "Je hebt geen toestemming om platen toe te voegen.";
        return;
    }

    const opslaanKnop = nieuwePlaatForm.querySelector('[type="submit"]');
    const opslaanKnopTekst = opslaanKnop.innerHTML;
    const code = document.getElementById("plaatCode").value.trim();
    const foto = document.getElementById("plaatFoto").files[0];
    let photos = [];

    // Vooraf valideren, vóór er iets geüpload wordt
    if(!PLAATCODE_PATROON.test(code)){
        plaatFormMelding.textContent =
            "Ongeldige plaatcode. Gebruik enkel letters, cijfers, spaties, punten, streepjes of underscores (max. 50 tekens).";
        return;
    }

    opslaanKnop.disabled = true;
    opslaanKnop.innerHTML = "⏳ Bezig...";
    plaatFormMelding.textContent = "Code controleren...";

    try {
        if(await codeAlBezet(code)){
            plaatFormMelding.textContent = "Deze plaatcode bestaat al.";
            return;
        }

        plaatFormMelding.textContent = "Plaat opslaan...";

        if(foto){
            plaatFormMelding.textContent = "Foto verkleinen...";

            const verkleind = await verkleinFoto(foto);
            const bestandsnaam = `${code.replace(/[^a-z0-9-_]/gi, "-")}-${Date.now()}.jpg`;
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

            photos = [urlData.publicUrl];
        }

        plaatFormMelding.textContent = "Plaat opslaan...";

        const kleurnummerWaarde = document.getElementById("plaatKleurnummer").value;
        const nieuwePlaat = {
            naam: document.getElementById("plaatNaam").value.trim(),
            code,
            leverancier: document.getElementById("plaatLeverancier").value.trim(),
            referentie: document.getElementById("plaatReferentie").value.trim() || null,
            kleur: document.getElementById("plaatKleur").value.trim() || null,
            kleurnummer: kleurnummerWaarde === "" ? null : Number(kleurnummerWaarde),
            photos
        };

        const {error} = await supabaseClient
            .from("platen")
            .insert(nieuwePlaat);

        if(error){
            throw error;
        }

        nieuwePlaatForm.reset();
        sluitPlaatModal();
        await initCatalogus();
    }catch(error){
        console.error(error);
        plaatFormMelding.textContent = error.code === "23505"
            ? "Deze plaatcode bestaat al."
            : "Opslaan mislukt. Controleer je Supabase-instellingen.";
    }finally{
        opslaanKnop.disabled = false;
        opslaanKnop.innerHTML = opslaanKnopTekst;
    }
});
