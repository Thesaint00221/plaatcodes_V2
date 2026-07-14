// ============================================
// catalogus.js
// ============================================

let platen = [];

const resultaten = document.getElementById("resultaten");
const zoekveld = document.getElementById("search");

function normaliseerPlaat(plaat){
    return {
        ...plaat,
        photos: plaat.photos || [],
        info: {
            Referentie: plaat.referentie || "",
            Kleur: plaat.kleur || "",
            Kleurnummer: plaat.kleurnummer
        }
    };
}

function haalPlaatFotoUrl(foto){
    if(!foto){
        return "";
    }

    return foto.startsWith("http") ? foto : `photos/${foto}`;
}

async function initCatalogus() {
    resultaten.innerHTML = '<p class="loader">Catalogus laden...</p>';

const {data, error} = await supabaseClient
    .from("platen")
    .select("naam, code, leverancier, photos, referentie, kleur, kleurnummer, gearchiveerd")
    .eq("gearchiveerd", false)
    .order("leverancier")
    .order("naam");

    if(error){
        console.error(error);
        resultaten.innerHTML = `
            <p class="geenResultaat">
                De catalogus kon niet geladen worden.
            </p>
        `;
        return;
    }

    platen = (data || []).map(normaliseerPlaat);
    toonPlaten(platen);
}

zoekveld.addEventListener("input", zoeken);

function zoeken() {
    const zoekterm = zoekveld.value.toLowerCase().trim();

    if (!zoekterm) {
        toonPlaten(platen);
        return;
    }

    const gevonden = platen.filter(plaat => {
        const info = plaat.info || {};

        return (
            (plaat.naam || "").toLowerCase().includes(zoekterm) ||
            (plaat.code || "").toLowerCase().includes(zoekterm) ||
            (plaat.leverancier || "").toLowerCase().includes(zoekterm) ||
            (info.Referentie || "").toLowerCase().includes(zoekterm) ||
            (info.Kleur || "").toLowerCase().includes(zoekterm) ||
            String(info.Kleurnummer || "").includes(zoekterm)
        );
    });

    toonPlaten(gevonden);
}

function toonPlaten(lijst) {
    resultaten.innerHTML = "";

    if (lijst.length === 0) {
        resultaten.innerHTML = `
            <p class="geenResultaat">
                Geen platen gevonden.
            </p>
        `;
        return;
    }

    lijst.forEach(plaat => {
        const kaart = document.createElement("div");
        kaart.className = "kaart modern-kaart";
        kaart.addEventListener("click", () => toonDetail(plaat));

        const eersteFoto = haalPlaatFotoUrl(plaat.photos[0]);

        kaart.innerHTML = `
            <div class="kaartFoto">
                ${eersteFoto
                    ? `<img src="${eersteFoto}" alt="${plaat.naam}" loading="lazy" onerror="this.parentElement.innerHTML='📷';">`
                    : '<div class="geenFoto">📷</div>'}
            </div>
            <div class="kaartBody">
                <div class="kaartTitel">${plaat.naam}</div>
                <div class="kaartCode">${plaat.code}</div>
                <div class="kaartLeverancier">${plaat.leverancier}</div>
                <button class="detailKnop" type="button">Bekijk details →</button>
            </div>
        `;

        resultaten.appendChild(kaart);
    });
}

function getPlaat(code) {
    return platen.find(plaat => plaat.code === code);
}
