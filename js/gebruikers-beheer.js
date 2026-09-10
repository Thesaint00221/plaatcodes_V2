// ============================================
// gebruikers-beheer.js
// Toont alle geregistreerde gebruikers (via de RPC "lijst_gebruikers")
// en laat een beheerder de rol per gebruiker wijzigen.
// De echte beveiliging zit in de database (RLS-policy + check op de
// laatste beheerder) - dit script is enkel de UI eromheen.
// ============================================

const gbLijst = document.getElementById("gbLijst");
const gbMelding = document.getElementById("gbMelding");

function gbToonMelding(tekst, isFout){
    if(!gbMelding){
        return;
    }
    gbMelding.innerHTML = tekst
        ? `${icoon(isFout ? "fout" : "vink")} ${tekst}`
        : "";
}

function gbFormatteerDatum(iso){

    if(!iso){
        return "Nooit ingelogd";
    }

    return new Date(iso).toLocaleString("nl-BE", {
        dateStyle: "medium",
        timeStyle: "short"
    });

}

function gbRijHtml(gebruiker, isZelf){

    return `

        <span class="icoon gebruikerRijIcoon" data-icon="gebruiker"></span>

        <div class="gebruikerRijInfo">
            <strong>
                ${gebruiker.naam || gebruiker.email}
                <span class="gebruikerRijEmail">${gebruiker.email}</span>
                ${isZelf ? '<span class="gebruikerZelf">jij</span>' : ""}
            </strong>
            <span class="gebruikerRijMeta">
                <span>${icoon("kalender")} Aangemaakt: ${gbFormatteerDatum(gebruiker.aangemaakt_op)}</span>
                <span>${icoon("slot")} Laatste login: ${gbFormatteerDatum(gebruiker.laatste_login)}</span>
            </span>
        </div>

        <select
            class="gebruikerRolSelect ${gebruiker.rol === "beheerder" ? "gebruikerRolSelect--beheerder" : ""}"
            data-id="${gebruiker.id}"
            data-email="${gebruiker.email}"
            ${gebruiker.auth_user_id ? "" : "disabled"}>
            <option value="gebruiker" ${gebruiker.rol === "gebruiker" ? "selected" : ""}>gebruiker</option>
            <option value="beheerder" ${gebruiker.rol === "beheerder" ? "selected" : ""}>beheerder</option>
        </select>

    `;

}

async function gbLaadGebruikers(){

    if(!gbLijst){
        return;
    }

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

    gbLijst.innerHTML = data
        .map(gebruiker => {
            const isZelf = gebruiker.email === eigenEmail;
            return `<div class="gebruikerRij">${gbRijHtml(gebruiker, isZelf)}</div>`;
        })
        .join("");

    gbLijst.querySelectorAll(".gebruikerRolSelect").forEach(select => {
        select.addEventListener("change", gbWijzigRol);
    });

}

async function gbWijzigRol(event){

    const select = event.target;
    const gebruikerId = select.dataset.id;
    const email = select.dataset.email;
    const nieuweRol = select.value;
    const vorigeRol = nieuweRol === "beheerder" ? "gebruiker" : "beheerder";

    select.disabled = true;
    gbToonMelding("Bezig...", false);

    const {data, error} = await supabaseClient
        .from("gebruikers")
        .update({rol: nieuweRol})
        .eq("id", gebruikerId)
        .select();

    select.disabled = false;

    if(error){
        console.error("Rol wijzigen mislukt:", error);
        gbToonMelding(`Kon rol niet wijzigen: ${error.message}`, true);
        select.value = vorigeRol;
        return;
    }

    if(!data || data.length === 0){
        // RLS blokkeerde de wijziging stil (bv. laatste beheerder zou verdwijnen)
        gbToonMelding(
            "Deze wijziging is niet toegestaan — waarschijnlijk omdat dit de laatste beheerder zou zijn.",
            true
        );
        select.value = vorigeRol;
        return;
    }

    select.classList.toggle("gebruikerRolSelect--beheerder", nieuweRol === "beheerder");
    gbToonMelding(`Rol van ${email} aangepast naar "${nieuweRol}".`, false);

    // Als je je eigen rol wijzigt, herlaad de pagina zodat menu/toegang
    // overal correct opnieuw geëvalueerd wordt.
    if(email === window.huidigeGebruiker?.email){
        gbToonMelding(`Je eigen rol is aangepast naar "${nieuweRol}". Pagina wordt herladen...`, false);
        setTimeout(() => window.location.reload(), 1800);
    }

}

document.addEventListener("DOMContentLoaded", async () => {

    const toegang = await controleerToegang();

    if(!toegang){
        if(gbLijst){
            gbLijst.innerHTML = "";
        }
        return;
    }

    gbLaadGebruikers();

});
