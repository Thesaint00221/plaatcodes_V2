// ============================================
// wachtwoord-beheer.js
// Laat een beheerder rechtstreeks een nieuw wachtwoord instellen
// voor een gebruiker, via de "set-user-password" Edge Function.
// ============================================

const wbGebruiker = document.getElementById("wbGebruiker");
const wbForm = document.getElementById("wachtwoordBeheerForm");
const wbMelding = document.getElementById("wbMelding");
const wbVerzendKnop = document.getElementById("wbVerzendKnop");

function wbToonMelding(tekst, isFout){
    if(!wbMelding){
        return;
    }
    wbMelding.innerHTML = tekst
        ? `${icoon(isFout ? "fout" : "vink")} ${tekst}`
        : "";
}

async function wbLaadGebruikers(){

    if(!wbGebruiker){
        return;
    }

    const {data, error} = await supabaseClient
        .from("gebruikers")
        .select("naam,email,rol,auth_user_id")
        .order("naam", {ascending: true});

    if(error){
        console.error("Gebruikers laden mislukt:", error);
        wbGebruiker.innerHTML = '<option value="">Kon gebruikers niet laden</option>';
        return;
    }

    const bruikbaar = (data || []).filter(g => g.auth_user_id);

    if(bruikbaar.length === 0){
        wbGebruiker.innerHTML = '<option value="">Geen gebruikers gevonden</option>';
        return;
    }

    wbGebruiker.innerHTML =
        '<option value="">Kies een gebruiker...</option>' +
        bruikbaar.map(g => {
            const label = `${g.naam || g.email} (${g.email}) — ${g.rol}`;
            return `<option value="${g.auth_user_id}">${label}</option>`;
        }).join("");

}

wbForm?.addEventListener("submit", async (event) => {

    event.preventDefault();

    const userId = wbGebruiker?.value;
    const pw1 = document.getElementById("wbWachtwoord1")?.value || "";
    const pw2 = document.getElementById("wbWachtwoord2")?.value || "";

    if(!userId){
        wbToonMelding("Kies eerst een gebruiker.", true);
        return;
    }

    if(pw1.length < 8){
        wbToonMelding("Wachtwoord moet minstens 8 tekens bevatten.", true);
        return;
    }

    if(pw1 !== pw2){
        wbToonMelding("De wachtwoorden komen niet overeen.", true);
        return;
    }

    wbVerzendKnop.disabled = true;
    wbToonMelding("Bezig...", false);

    try{

        const {data: sessionData} = await supabaseClient.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if(!accessToken){
            wbToonMelding("Je bent niet (meer) ingelogd. Meld je opnieuw aan.", true);
            wbVerzendKnop.disabled = false;
            return;
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/set-user-password`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: userId,
                password: pw1
            })
        });

        const result = await response.json();

        if(!response.ok){
            wbToonMelding(result.error || "Wachtwoord wijzigen mislukt.", true);
            wbVerzendKnop.disabled = false;
            return;
        }

        wbToonMelding("Wachtwoord succesvol aangepast.", false);
        wbForm.reset();

    }catch(fout){

        console.error("Wachtwoord instellen mislukt:", fout);
        wbToonMelding("Er ging iets mis. Probeer opnieuw.", true);

    }

    wbVerzendKnop.disabled = false;

});

document.addEventListener("DOMContentLoaded", async () => {

    const toegang = await controleerToegang();

    if(!toegang){

        if(wbForm){
            wbForm.style.display = "none";
        }

        return;

    }

    wbLaadGebruikers();

});
