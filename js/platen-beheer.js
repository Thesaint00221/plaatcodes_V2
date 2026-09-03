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

nieuwePlaatForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if(!isBeheerder()){
        plaatFormMelding.textContent = "Je hebt geen toestemming om platen toe te voegen.";
        return;
    }

    const opslaanKnop = nieuwePlaatForm.querySelector('[type="submit"]');
    const code = document.getElementById("plaatCode").value.trim();
    const foto = document.getElementById("plaatFoto").files[0];
    let photos = [];

    opslaanKnop.disabled = true;
    plaatFormMelding.textContent = "Plaat opslaan...";

    try {
        if(foto){
            const extensie = foto.name.split(".").pop().toLowerCase();
            const bestandsnaam = `${code.replace(/[^a-z0-9-_]/gi, "-")}-${Date.now()}.${extensie}`;
            const opslagpad = `platen/${bestandsnaam}`;
            const {error: uploadError} = await supabaseClient
                .storage
                .from("plaatfotos")
                .upload(opslagpad, foto, {upsert: false});

            if(uploadError){
                throw uploadError;
            }

            const {data: urlData} = supabaseClient
                .storage
                .from("plaatfotos")
                .getPublicUrl(opslagpad);

            photos = [urlData.publicUrl];
        }

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
    }
});
