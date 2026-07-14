// ============================================
// migratie.js
// Eenmalige import van data.json naar Supabase
// ============================================

const startMigratie = document.getElementById("startMigratie");
const migratieStatus = document.getElementById("migratieStatus");

function maakMigratieRecord(plaat){
    return {
        naam: plaat.naam,
        code: plaat.code,
        leverancier: plaat.leverancier,
        photos: plaat.photos || [],
        referentie: plaat.info?.Referentie || null,
        kleur: plaat.info?.Kleur || null,
        kleurnummer: plaat.info?.Kleurnummer ?? null
    };
}

async function migreerPlaten(){
    const gebruiker = await laadGebruikersRol();

    if(gebruiker?.rol !== "beheerder"){
        migratieStatus.textContent = "Meld je aan als beheerder om de migratie uit te voeren.";
        return;
    }

    startMigratie.disabled = true;

    try {
        const response = await fetch("data.json");

        if(!response.ok){
            throw new Error("data.json kon niet geladen worden.");
        }

        const oudePlaten = await response.json();
        const platen = oudePlaten.map(maakMigratieRecord);
        const grootte = 100;

        for(let start = 0; start < platen.length; start += grootte){
            const reeks = platen.slice(start, start + grootte);
            migratieStatus.textContent = `Migreren: ${Math.min(start + reeks.length, platen.length)} van ${platen.length} platen...`;

            const {error} = await supabaseClient
                .from("platen")
                .upsert(reeks, {onConflict: "code"});

            if(error){
                throw error;
            }
        }

        migratieStatus.textContent = `${platen.length} platen zijn succesvol gemigreerd.`;
    }catch(error){
        console.error(error);
        migratieStatus.textContent = `Migratie mislukt: ${error.message}`;
    }finally{
        startMigratie.disabled = false;
    }
}

startMigratie.addEventListener("click", migreerPlaten);
