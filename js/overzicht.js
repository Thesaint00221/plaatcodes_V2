// ============================================
// overzicht.js
// Chronologisch overzicht van alle cases (nieuwste eerst),
// met filter op type en een "Nieuw"-markering voor de laatste 7 dagen.
// Bedoeld als basis voor het latere wekelijkse mailoverzicht.
// ============================================

const CASES_PAGINA_GROOTTE = 30;
const NIEUW_AANTAL_DAGEN = 7;

const casesLijst = document.getElementById("casesLijst");
const casesLaadMeer = document.getElementById("casesLaadMeer");
const overzichtFilter = document.getElementById("overzichtFilter");

let overzichtOffset = 0;
let overzichtType = "";
let overzichtBezig = false;
let overzichtAllesGeladen = false;

const gebruikersCacheOverzicht = {};
const platenCacheOverzicht = {};

function isNieuw(datum){

    if(!datum){
        return false;
    }

    const verschilMs = Date.now() - new Date(datum).getTime();
    const verschilDagen = verschilMs / (1000 * 60 * 60 * 24);

    return verschilDagen <= NIEUW_AANTAL_DAGEN;

}

async function laadOntbrekendeGebruikers(emails){

    const onbekend = [...new Set(emails)]
        .filter(email => email && !gebruikersCacheOverzicht[email]);

    if(onbekend.length === 0){
        return;
    }

    const {data} = await supabaseClient
        .from("gebruikers")
        .select("email,naam")
        .in("email", onbekend);

    (data || []).forEach(rij => {
        gebruikersCacheOverzicht[rij.email] = rij.naam || rij.email;
    });

    onbekend.forEach(email => {
        if(!gebruikersCacheOverzicht[email]){
            gebruikersCacheOverzicht[email] = email;
        }
    });

}

async function laadOntbrekendePlaten(codes){

    const onbekend = [...new Set(codes)]
        .filter(code => code && !platenCacheOverzicht[code]);

    if(onbekend.length === 0){
        return;
    }

    const {data} = await supabaseClient
        .from("platen")
        .select("code,naam,leverancier")
        .in("code", onbekend);

    (data || []).forEach(rij => {
        platenCacheOverzicht[rij.code] = rij;
    });

}

async function laadCasesPagina(reset){

    if(overzichtBezig){
        return;
    }

    if(!reset && overzichtAllesGeladen){
        return;
    }

    overzichtBezig = true;

    if(reset){
        overzichtOffset = 0;
        overzichtAllesGeladen = false;
        casesLijst.innerHTML = '<p class="loader">Cases laden...</p>';
    }

    if(casesLaadMeer){
        casesLaadMeer.classList.add("laadMeerActief");
    }

    let query = supabaseClient
        .from("eigen_data")
        .select("id,code,type,omschrijving,toegevoegd_door,datum");

    if(overzichtType){
        query = query.eq("type", overzichtType);
    }

    query = query
        .order("datum", {ascending: false, nullsFirst: false})
        .range(overzichtOffset, overzichtOffset + CASES_PAGINA_GROOTTE - 1);

    const {data, error} = await query;

    overzichtBezig = false;

    if(casesLaadMeer){
        casesLaadMeer.classList.remove("laadMeerActief");
    }

    if(error){
        console.error(error);
        if(reset){
            casesLijst.innerHTML = '<p class="geenResultaat">Cases konden niet geladen worden.</p>';
        }
        return;
    }

    const cases = data || [];

    if(reset){
        casesLijst.innerHTML = "";
    }

    if(reset && cases.length === 0){
        casesLijst.innerHTML = '<p class="geenResultaat">Nog geen cases gevonden.</p>';
        overzichtOffset = 0;
        overzichtAllesGeladen = true;
        casesLaadMeer?.classList.add("hidden");
        return;
    }

    await Promise.all([
        laadOntbrekendeGebruikers(cases.map(c => c.toegevoegd_door)),
        laadOntbrekendePlaten(cases.map(c => c.code))
    ]);

    toonCases(cases);

    overzichtOffset += cases.length;

    if(cases.length < CASES_PAGINA_GROOTTE){
        overzichtAllesGeladen = true;
        casesLaadMeer?.classList.add("hidden");
    }else{
        casesLaadMeer?.classList.remove("hidden");
    }

}

function toonCases(cases){

    cases.forEach(item => {

        const plaat = platenCacheOverzicht[item.code] || {naam: item.code, leverancier: ""};
        const isLeverancier = item.type === "leverancier";
        const nieuw = isNieuw(item.datum);

        const [titel] = (item.omschrijving || "").split("\n");

        const rij = document.createElement("a");
        rij.className = `caseRij${nieuw ? " caseRijNieuw" : ""}`;
        rij.href = `index.html?plaat=${encodeURIComponent(item.code)}`;

        rij.innerHTML = `

            <span class="caseTypeBadge ${isLeverancier ? "caseTypeBadge--leverancier" : "caseTypeBadge--productie"}">
                ${isLeverancier ? icoon("vrachtwagen") : icoon("fabriek")}
            </span>

            <div class="caseRijInfo">
                <strong>${plaat.naam} <span class="caseRijCode">${item.code}</span></strong>
                <span class="caseRijTitel">${titel || "Geen titel"}</span>
            </div>

            <div class="caseRijMeta">
                <span>${icoon("gebruiker")} ${gebruikersCacheOverzicht[item.toegevoegd_door] || item.toegevoegd_door || ""}</span>
                <span>${icoon("kalender")} ${item.datum ? new Date(item.datum).toLocaleDateString("nl-BE") : ""}</span>
                ${nieuw ? '<span class="nieuwBadge">Nieuw</span>' : ""}
            </div>

        `;

        casesLijst.appendChild(rij);

    });

}

overzichtFilter?.querySelectorAll(".caseTypeKnop").forEach(knop => {
    knop.addEventListener("click", () => {

        overzichtFilter.querySelectorAll(".caseTypeKnop").forEach(k => k.classList.remove("actief"));
        knop.classList.add("actief");

        overzichtType = knop.dataset.filter || "";
        laadCasesPagina(true);

    });
});

if(casesLaadMeer && "IntersectionObserver" in window){
    const observer = new IntersectionObserver(entries => {
        if(entries[0].isIntersecting){
            laadCasesPagina(false);
        }
    }, {rootMargin: "300px"});

    observer.observe(casesLaadMeer);
}

document.addEventListener("DOMContentLoaded", () => {
    laadCasesPagina(true);
});