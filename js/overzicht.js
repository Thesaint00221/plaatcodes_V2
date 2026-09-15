// ============================================
// overzicht.js
// Chronologisch overzicht van alle cases (nieuwste eerst),
// inclusief aankoopklachten.
// ============================================

const CASES_PAGINA_GROOTTE = 30;
const NIEUW_AANTAL_DAGEN = 7;

const casesLijst = document.getElementById("casesLijst");
const casesLaadMeer = document.getElementById("casesLaadMeer");
const overzichtFilter = document.getElementById("overzichtFilter");

let overzichtOffset = 0;
let aankoopOffset = 0;
let overzichtType = "";
let overzichtBezig = false;
let overzichtAllesGeladen = false;

const gebruikersCacheOverzicht = {};
const platenCacheOverzicht = {};

function isNieuw(datum){
    if(!datum) return false;
    const verschilMs = Date.now() - new Date(datum).getTime();
    return verschilMs / (1000 * 60 * 60 * 24) <= NIEUW_AANTAL_DAGEN;
}

async function laadOntbrekendeGebruikers(emails){
    const onbekend = [...new Set(emails)].filter(email => email && !gebruikersCacheOverzicht[email]);
    if(onbekend.length === 0) return;

    const {data} = await supabaseClient
        .from("gebruikers")
        .select("email,naam")
        .in("email", onbekend);

    (data || []).forEach(rij => {
        gebruikersCacheOverzicht[rij.email] = rij.naam || rij.email;
    });

    onbekend.forEach(email => {
        if(!gebruikersCacheOverzicht[email]) gebruikersCacheOverzicht[email] = email;
    });
}

async function laadOntbrekendePlaten(codes){
    const onbekend = [...new Set(codes)].filter(code => code && !platenCacheOverzicht[code]);
    if(onbekend.length === 0) return;

    const {data} = await supabaseClient
        .from("platen")
        .select("code,naam,leverancier")
        .in("code", onbekend);

    (data || []).forEach(rij => {
        platenCacheOverzicht[rij.code] = rij;
    });
}

async function laadCasesPagina(reset){
    if(overzichtBezig) return;
    if(!reset && overzichtAllesGeladen) return;

    overzichtBezig = true;

    if(reset){
        overzichtOffset = 0;
        aankoopOffset = 0;
        overzichtAllesGeladen = false;
        casesLijst.innerHTML = '<p class="loader">Cases laden...</p>';
    }

    casesLaadMeer?.classList.add("laadMeerActief");

    let gewoneCases = [];
    let aankoopklachten = [];

    if(overzichtType !== "aankoop"){
        let query = supabaseClient
            .from("eigen_data")
            .select("id,code,type,omschrijving,toegevoegd_door,datum")
            .order("datum", {ascending:false, nullsFirst:false})
            .range(overzichtOffset, overzichtOffset + CASES_PAGINA_GROOTTE - 1);

        if(overzichtType) query = query.eq("type", overzichtType);

        const resultaat = await query;
        if(resultaat.error){
            console.error(resultaat.error);
            if(reset) casesLijst.innerHTML = '<p class="geenResultaat">Cases konden niet geladen worden.</p>';
            overzichtBezig = false;
            casesLaadMeer?.classList.remove("laadMeerActief");
            return;
        }
        gewoneCases = resultaat.data || [];
    }

    if(overzichtType === "" || overzichtType === "aankoop"){
        const resultaat = await supabaseClient
            .from("aankoopklachten")
            .select("id,artikel,leverancier,referentie,omschrijving,datum,aantal,toegevoegd_door")
            .order("datum", {ascending:false, nullsFirst:false})
            .order("created_at", {ascending:false})
            .range(aankoopOffset, aankoopOffset + CASES_PAGINA_GROOTTE - 1);

        if(resultaat.error){
            console.error(resultaat.error);
            if(overzichtType === "aankoop" && reset){
                casesLijst.innerHTML = '<p class="geenResultaat">Aankoopklachten konden niet geladen worden.</p>';
            }
            overzichtBezig = false;
            casesLaadMeer?.classList.remove("laadMeerActief");
            return;
        }
        aankoopklachten = resultaat.data || [];
    }

    await Promise.all([
        laadOntbrekendeGebruikers([
            ...gewoneCases.map(c => c.toegevoegd_door),
            ...aankoopklachten.map(c => c.toegevoegd_door)
        ]),
        laadOntbrekendePlaten(gewoneCases.map(c => c.code))
    ]);

    const items = [
        ...gewoneCases.map(item => ({...item, overzichtSoort:"case", sortDatum:item.datum})),
        ...aankoopklachten.map(item => ({...item, overzichtSoort:"aankoop", sortDatum:item.datum}))
    ].sort((a,b) => new Date(b.sortDatum || 0) - new Date(a.sortDatum || 0));

    if(reset) casesLijst.innerHTML = "";
    toonCases(items);

    overzichtOffset += gewoneCases.length;
    aankoopOffset += aankoopklachten.length;

    const gewoneKlaar = overzichtType === "aankoop" || gewoneCases.length < CASES_PAGINA_GROOTTE;
    const aankoopKlaar = overzichtType !== "" || aankoopklachten.length < CASES_PAGINA_GROOTTE;
    overzichtAllesGeladen = gewoneKlaar && aankoopKlaar;

    if(overzichtAllesGeladen){
        casesLaadMeer?.classList.add("hidden");
    }else{
        casesLaadMeer?.classList.remove("hidden");
    }

    if(reset && items.length === 0){
        casesLijst.innerHTML = '<p class="geenResultaat">Nog geen cases gevonden.</p>';
        overzichtAllesGeladen = true;
        casesLaadMeer?.classList.add("hidden");
    }

    overzichtBezig = false;
    casesLaadMeer?.classList.remove("laadMeerActief");
}

function toonCases(items){
    items.forEach(item => {
        if(item.overzichtSoort === "aankoop"){
            toonAankoopklacht(item);
            return;
        }

        const plaat = platenCacheOverzicht[item.code] || {naam:item.code, leverancier:""};
        const isLeverancier = item.type === "leverancier";
        const nieuw = isNieuw(item.datum);
        const [titel] = (item.omschrijving || "").split("\n");

        const rij = document.createElement("a");
        rij.className = `caseRij${nieuw ? " caseRijNieuw" : ""}`;
        rij.href = `index.html?plaat=${encodeURIComponent(item.code)}&case=${encodeURIComponent(item.id)}`;

        rij.innerHTML = `
            <span class="caseTypeBadge ${isLeverancier ? "caseTypeBadge--leverancier" : "caseTypeBadge--productie"}">
                ${isLeverancier ? icoon("vrachtwagen") : icoon("fabriek")}
            </span>
            <div class="caseRijInfo">
                <strong>${escapeHtml(plaat.naam)} <span class="caseRijCode">${escapeHtml(item.code)}</span></strong>
                <span class="caseRijTitel">${escapeHtml(titel || "Geen titel")}</span>
            </div>
            <div class="caseRijMeta">
                <span>${icoon("gebruiker")} ${escapeHtml(gebruikersCacheOverzicht[item.toegevoegd_door] || item.toegevoegd_door || "")}</span>
                <span>${icoon("kalender")} ${item.datum ? new Date(item.datum).toLocaleDateString("nl-BE") : ""}</span>
                ${nieuw ? '<span class="nieuwBadge">Nieuw</span>' : ""}
            </div>
        `;
        casesLijst.appendChild(rij);
    });
}

function toonAankoopklacht(item){
    const nieuw = isNieuw(item.datum);
    const rij = document.createElement("a");
    rij.className = `caseRij${nieuw ? " caseRijNieuw" : ""}`;
    rij.href = `klachten.html?klacht=${encodeURIComponent(item.id)}`;

    rij.innerHTML = `
        <span class="caseTypeBadge caseTypeBadge--leverancier">${icoon("document")}</span>
        <div class="caseRijInfo">
            <strong>Aankoopklacht <span class="caseRijCode">${escapeHtml(item.artikel || "")}</span></strong>
            <span class="caseRijTitel">${escapeHtml(item.omschrijving || "Geen omschrijving")}</span>
        </div>
        <div class="caseRijMeta">
            <span>${icoon("vrachtwagen")} ${escapeHtml(item.leverancier || "")}</span>
            <span>${icoon("kalender")} ${item.datum ? new Date(item.datum).toLocaleDateString("nl-BE") : ""}</span>
            ${nieuw ? '<span class="nieuwBadge">Nieuw</span>' : ""}
        </div>
    `;
    casesLijst.appendChild(rij);
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
        if(entries[0].isIntersecting) laadCasesPagina(false);
    }, {rootMargin:"300px"});
    observer.observe(casesLaadMeer);
}

document.addEventListener("DOMContentLoaded", () => laadCasesPagina(true));
