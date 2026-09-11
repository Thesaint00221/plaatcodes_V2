// ============================================
// wachtwoord-beheer.js
// Laat een beheerder de gebruikersnaam en/of het wachtwoord
// van een gebruiker aanpassen.
// ============================================

const wbGebruiker = document.getElementById("wbGebruiker");
const wbForm = document.getElementById("wachtwoordBeheerForm");
const wbMelding = document.getElementById("wbMelding");
const wbVerzendKnop = document.getElementById("wbVerzendKnop");
const wbNaam = document.getElementById("wbNaam");
let wbGebruikersData = [];
let wbHuidigeNaam = "";

voegWachtwoordToggleToe("wbWachtwoord1");
voegWachtwoordToggleToe("wbWachtwoord2");

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

    wbGebruikersData = (data || []).filter(g => g.auth_user_id);

    if(wbGebruikersData.length === 0){
        wbGebruiker.innerHTML = '<option value="">Geen gebruikers gevonden</option>';
        return;
    }

    wbGebruiker.innerHTML =
        '<option value="">Kies een gebruiker...</option>' +
        wbGebruikersData.map(g => {
            const label = `${g.naam || g.email} (${g.email}) — ${g.rol}`;
            return `<option value="${g.auth_user_id}">${escapeHtml(label)}</option>`;
        }).join("");

    wbNaam.value = "";
    wbHuidigeNaam = "";
}

wbGebruiker?.addEventListener("change", () => {
    const gebruiker = wbGebruikersData.find(g => g.auth_user_id === wbGebruiker.value);
    wbHuidigeNaam = gebruiker?.naam || "";
    if(wbNaam){
        wbNaam.value = wbHuidigeNaam;
    }
    wbToonMelding("", false);
});

wbForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userId = wbGebruiker?.value;
    const nieuweNaam = wbNaam?.value.trim() || "";
    const pw1 = document.getElementById("wbWachtwoord1")?.value || "";
    const pw2 = document.getElementById("wbWachtwoord2")?.value || "";
    const naamGewijzigd = nieuweNaam !== wbHuidigeNaam;
    const wachtwoordGewijzigd = pw1.length > 0 || pw2.length > 0;

    if(!userId){
        wbToonMelding("Kies eerst een gebruiker.", true);
        return;
    }

    if(!naamGewijzigd && !wachtwoordGewijzigd){
        wbToonMelding("Er zijn geen wijzigingen ingevuld.", true);
        return;
    }

    if(wachtwoordGewijzigd){
        if(pw1.length < 8){
            wbToonMelding("Wachtwoord moet minstens 8 tekens bevatten.", true);
            return;
        }
        if(pw1 !== pw2){
            wbToonMelding("De wachtwoorden komen niet overeen.", true);
            return;
        }
    }

    if(nieuweNaam.length > 100){
        wbToonMelding("Gebruikersnaam mag maximaal 100 tekens bevatten.", true);
        return;
    }

    wbVerzendKnop.disabled = true;
    wbToonMelding("Bezig...", false);

    let naamOk = !naamGewijzigd;
    let wachtwoordOk = !wachtwoordGewijzigd;

    try{
        if(naamGewijzigd){
            const {error: naamError} = await supabaseClient
                .from("gebruikers")
                .update({naam: nieuweNaam || null})
                .eq("auth_user_id", userId);

            if(naamError){
                console.error("Gebruikersnaam wijzigen mislukt:", naamError);
                wbToonMelding(`Gebruikersnaam kon niet worden gewijzigd: ${naamError.message}`, true);
            }else{
                naamOk = true;
                wbHuidigeNaam = nieuweNaam;
            }
        }

        if(wachtwoordGewijzigd){
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
                wbToonMelding(`Wachtwoord kon niet worden gewijzigd: ${result.error || "onbekende fout"}`, true);
            }else{
                wachtwoordOk = true;
            }
        }

        if(naamOk && wachtwoordOk){
            wbToonMelding("Wijzigingen succesvol opgeslagen.", false);
            document.getElementById("wbWachtwoord1").value = "";
            document.getElementById("wbWachtwoord2").value = "";
            await wbLaadGebruikers();
            if(wbGebruiker){
                wbGebruiker.value = userId;
            }
            if(wbNaam){
                wbNaam.value = nieuweNaam;
            }
        }

        if(naamOk && !wachtwoordOk){
            wbToonMelding("Gebruikersnaam is aangepast, maar het wachtwoord niet.", true);
        }

    }catch(fout){
        console.error("Gebruikersgegevens wijzigen mislukt:", fout);
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
