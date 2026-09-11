// ============================================
// gebruikers-beheer.js
// Toont alle geregistreerde gebruikers (via de RPC "lijst_gebruikers")
// en laat een beheerder de rol per gebruiker wijzigen of een gebruiker verwijderen.
// ============================================

const gbLijst = document.getElementById("gbLijst");
const gbMelding = document.getElementById("gbMelding");

function gbToonMelding(tekst, isFout){
    if(!gbMelding){ return; }
    gbMelding.innerHTML = tekst ? `${icoon(isFout ? "fout" : "vink")} ${tekst}` : "";
}

function gbFormatteerDatum(iso){
    if(!iso){ return "Nooit ingelogd"; }
    return new Date(iso).toLocaleString("nl-BE", {dateStyle:"medium", timeStyle:"short"});
}

function gbRijHtml(gebruiker, isZelf){
    return `
        <span class="icoon gebruikerRijIcoon" data-icon="gebruiker"></span>
        <div class="gebruikerRijInfo">
            <strong>
                ${escapeHtml(gebruiker.naam || gebruiker.email)}
                <span class="gebruikerRijEmail">${escapeHtml(gebruiker.email)}</span>
                ${isZelf ? '<span class="gebruikerZelf">jij</span>' : ""}
            </strong>
            <span class="gebruikerRijMeta">
                <span>${icoon("kalender")} Aangemaakt: ${gbFormatteerDatum(gebruiker.aangemaakt_op)}</span>
                <span>${icoon("slot")} Laatste login: ${gbFormatteerDatum(gebruiker.laatste_login)}</span>
            </span>
        </div>
        <select class="gebruikerRolSelect ${gebruiker.rol === "beheerder" ? "gebruikerRolSelect--beheerder" : ""}"
            data-id="${gebruiker.id}" data-email="${gebruiker.email}" ${gebruiker.auth_user_id ? "" : "disabled"}>
            <option value="gebruiker" ${gebruiker.rol === "gebruiker" ? "selected" : ""}>gebruiker</option>
            <option value="beheerder" ${gebruiker.rol === "beheerder" ? "selected" : ""}>beheerder</option>
        </select>`;
}

async function gbLaadGebruikers(){
    if(!gbLijst){ return; }
    const {data, error} = await supabaseClient.rpc("lijst_gebruikers");
    if(error){
        console.error("Gebruikerslijst laden mislukt:", error);
        gbLijst.innerHTML = `<p class="geenResultaat">${icoon("fout")} Kon gebruikerslijst niet laden (${error.message}).</p>`;
        return;
    }
    if(!data || data.length === 0){
        gbLijst.innerHTML = '<p class="geenResultaat">Geen gebruikers gevonden.</p>';
        return;
    }
    const eigenEmail = window.huidigeGebruiker?.email;
    gbLijst.innerHTML = data.map(gebruiker => `<div class="gebruikerRij">${gbRijHtml(gebruiker, gebruiker.email === eigenEmail)}</div>`).join("");
    gbLijst.querySelectorAll(".gebruikerRolSelect").forEach(select => select.addEventListener("change", gbWijzigRol));
    vgVulGebruikers(data);
}

function gbVulVerwijderSelect(data){
    const select = document.getElementById("vgGebruiker");
    if(!select){ return; }
    const eigenEmail = window.huidigeGebruiker?.email?.toLowerCase();
    select.innerHTML = '<option value="">Kies een gebruiker...</option>' + data
        .filter(gebruiker => gebruiker.email?.toLowerCase() !== eigenEmail)
        .map(gebruiker => `<option value="${escapeHtml(gebruiker.id)}">${escapeHtml(gebruiker.naam || gebruiker.email)} — ${escapeHtml(gebruiker.email)}</option>`)
        .join("");
}

function vgVulGebruikers(data){
    window.gbGebruikersData = data;
    gbVulVerwijderSelect(data);
}

async function gbWijzigRol(event){
    const select = event.target;
    const gebruikerId = select.dataset.id;
    const email = select.dataset.email;
    const nieuweRol = select.value;
    const vorigeRol = nieuweRol === "beheerder" ? "gebruiker" : "beheerder";
    select.disabled = true;
    gbToonMelding("Bezig...", false);
    const {data, error} = await supabaseClient.from("gebruikers").update({rol: nieuweRol}).eq("id", gebruikerId).select();
    select.disabled = false;
    if(error){
        console.error("Rol wijzigen mislukt:", error);
        gbToonMelding(`Kon rol niet wijzigen: ${error.message}`, true);
        select.value = vorigeRol;
        return;
    }
    if(!data || data.length === 0){
        gbToonMelding("Deze wijziging is niet toegestaan — waarschijnlijk omdat dit de laatste beheerder zou zijn.", true);
        select.value = vorigeRol;
        return;
    }
    select.classList.toggle("gebruikerRolSelect--beheerder", nieuweRol === "beheerder");
    gbToonMelding(`Rol van ${email} aangepast naar "${nieuweRol}".`, false);
    if(email === window.huidigeGebruiker?.email){
        gbToonMelding(`Je eigen rol is aangepast naar "${nieuweRol}". Pagina wordt herladen...`, false);
        setTimeout(() => window.location.reload(), 1800);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const toegang = await controleerToegang();
    if(!toegang){
        if(gbLijst){ gbLijst.innerHTML = ""; }
        ["gbNieuweGebruikerKnop", "gbVerwijderGebruikerKnop"].forEach(id => {
            const knop = document.getElementById(id);
            if(knop){ knop.style.display = "none"; }
        });
        return;
    }
    gbLaadGebruikers();
});

// ============================================
// Nieuwe gebruiker toevoegen (modal)
// ============================================

const ngModal = document.getElementById("nieuweGebruikerModal");
const ngForm = document.getElementById("nieuweGebruikerForm");
const ngMelding = document.getElementById("ngMelding");
const ngVerzendKnop = document.getElementById("ngVerzendKnop");

voegWachtwoordToggleToe("ngWachtwoord");

function ngToonMelding(tekst, isFout){
    if(!ngMelding){ return; }
    ngMelding.innerHTML = tekst ? `${icoon(isFout ? "fout" : "vink")} ${tekst}` : "";
}

function ngOpenen(){
    if(!ngModal){ return; }
    ngForm.reset();
    ngToonMelding("", false);
    ngModal.classList.remove("hidden");
    document.getElementById("ngEmail")?.focus();
}

function ngSluiten(){ ngModal?.classList.add("hidden"); }

document.getElementById("gbNieuweGebruikerKnop")?.addEventListener("click", ngOpenen);
document.getElementById("sluitNieuweGebruikerModal")?.addEventListener("click", ngSluiten);
document.getElementById("ngAnnuleren")?.addEventListener("click", ngSluiten);
ngModal?.addEventListener("click", event => { if(event.target === ngModal){ ngSluiten(); } });

ngForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("ngEmail")?.value.trim();
    const naam = document.getElementById("ngNaam")?.value.trim() || null;
    const wachtwoord = document.getElementById("ngWachtwoord")?.value || "";
    const rol = document.getElementById("ngRol")?.value;
    if(!email || !wachtwoord || !rol){ ngToonMelding("Vul alle verplichte velden in.", true); return; }
    if(wachtwoord.length < 8){ ngToonMelding("Wachtwoord moet minstens 8 tekens bevatten.", true); return; }
    ngVerzendKnop.disabled = true;
    ngToonMelding("Bezig met aanmaken...", false);
    try{
        const {data: sessionData} = await supabaseClient.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if(!accessToken){ ngToonMelding("Je bent niet (meer) ingelogd. Meld je opnieuw aan.", true); ngVerzendKnop.disabled = false; return; }
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
            method:"POST",
            headers:{Authorization:`Bearer ${accessToken}`, "Content-Type":"application/json"},
            body:JSON.stringify({email, password:wachtwoord, rol, naam})
        });
        const result = await response.json();
        if(!response.ok){ ngToonMelding(result.error || "Aanmaken van gebruiker mislukt.", true); ngVerzendKnop.disabled = false; return; }
        ngSluiten();
        gbToonMelding(`Gebruiker ${naam || email} is aangemaakt met rol "${rol}".`, false);
        gbLaadGebruikers();
        if(typeof wbLaadGebruikers === "function"){ wbLaadGebruikers(); }
    }catch(fout){
        console.error("Gebruiker aanmaken mislukt:", fout);
        ngToonMelding("Er ging iets mis. Probeer opnieuw.", true);
    }
    ngVerzendKnop.disabled = false;
});

// ============================================
// Gebruiker verwijderen (modal)
// ============================================

const vgModal = document.getElementById("verwijderGebruikerModal");
const vgForm = document.getElementById("verwijderGebruikerForm");
const vgMelding = document.getElementById("vgMelding");
const vgVerzendKnop = document.getElementById("vgVerzendKnop");

function vgToonMelding(tekst, isFout){
    if(!vgMelding){ return; }
    vgMelding.innerHTML = tekst ? `${icoon(isFout ? "fout" : "vink")} ${tekst}` : "";
}

function vgOpenen(){
    if(!vgModal){ return; }
    vgToonMelding("", false);
    const select = document.getElementById("vgGebruiker");
    if(select){ select.value = ""; }
    vgModal.classList.remove("hidden");
    select?.focus();
}

function vgSluiten(){ vgModal?.classList.add("hidden"); }

document.getElementById("gbVerwijderGebruikerKnop")?.addEventListener("click", vgOpenen);
document.getElementById("sluitVerwijderGebruikerModal")?.addEventListener("click", vgSluiten);
document.getElementById("vgAnnuleren")?.addEventListener("click", vgSluiten);
vgModal?.addEventListener("click", event => { if(event.target === vgModal){ vgSluiten(); } });

vgForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const gebruikerId = document.getElementById("vgGebruiker")?.value;
    const gebruiker = window.gbGebruikersData?.find(item => item.id === gebruikerId);
    if(!gebruiker){ vgToonMelding("Kies eerst een gebruiker.", true); return; }
    const naamOfEmail = gebruiker.naam || gebruiker.email;
    if(!confirm(`Gebruiker "${naamOfEmail}" definitief verwijderen?`)){ return; }
    vgVerzendKnop.disabled = true;
    vgToonMelding("Bezig met verwijderen...", false);
    try{
        const {data: sessionData} = await supabaseClient.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if(!accessToken){ vgToonMelding("Je bent niet (meer) ingelogd. Meld je opnieuw aan.", true); vgVerzendKnop.disabled = false; return; }
        const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
            method:"POST",
            headers:{Authorization:`Bearer ${accessToken}`, "Content-Type":"application/json"},
            body:JSON.stringify({id: gebruiker.id, email: gebruiker.email})
        });
        const result = await response.json();
        if(!response.ok){ vgToonMelding(result.error || "Verwijderen van gebruiker mislukt.", true); vgVerzendKnop.disabled = false; return; }
        vgSluiten();
        gbToonMelding(`Gebruiker ${naamOfEmail} is verwijderd.`, false);
        gbLaadGebruikers();
        if(typeof wbLaadGebruikers === "function"){ wbLaadGebruikers(); }
    }catch(fout){
        console.error("Gebruiker verwijderen mislukt:", fout);
        vgToonMelding("Er ging iets mis. Probeer opnieuw.", true);
    }
    vgVerzendKnop.disabled = false;
});
