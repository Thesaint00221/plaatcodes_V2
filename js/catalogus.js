// ============================================
// catalogus.js
// Server-side zoeken + leverancier-filter + paginatie
// ============================================

const PAGINA_GROOTTE = 24;

const resultaten = document.getElementById("resultaten");
const zoekveld = document.getElementById("search");
const leverancierFilter = document.getElementById("leverancierFilter");
const laadMeer = document.getElementById("laadMeer");

// Status van de huidige weergave
let huidigeOffset = 0;
let huidigeZoekterm = "";
let huidigeLeverancier = "";
let bezigMetLaden = false;
let allesGeladen = false;
let opgezet = false;

// Cache voor leveranciers (voorkomen van dubbele queries)
let leveranciersCache = null;

function normaliseerPlaat(plaat){
    return {
        ...plaat,
        gearchiveerd: plaat.gearchiveerd || false,
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

// ============================================
// SQL-VEILIGHEID: Betere sanitatie van zoekinvoer
// ============================================
// Oude functie vervangen door de versie uit security-utils.js
// (die is al geïmporteerd via index.html)
//
// De saniteerZoekterm() uit security-utils.js doet:
// 1. Verwijder alle niet-alfanumerieke karakters behalve veilige interpunctie
// 2. Extra: verwijder SQL-operators (,()%;'")
// 3. Max 100 tekens (DOS-preventie)
//
// Dit is veel robuuster dan de oude versie die enkel [,()%] verwijderde.

async function initCatalogus(){

    if(!opgezet){

        opgezet = true;

        zoekveld?.addEventListener("input", () => {
            clearTimeout(zoekveld._timer);
            zoekveld._timer = setTimeout(() => {
                huidigeZoekterm = zoekveld.value.toLowerCase();
                herlaadCatalogus(true);
            }, 350);
        });

        leverancierFilter?.addEventListener("change", () => {
            huidigeLeverancier = leverancierFilter.value;
            herlaadCatalogus(true);
        });

        if(laadMeer && "IntersectionObserver" in window){
            const observer = new IntersectionObserver(entries => {
                if(entries[0].isIntersecting){
                    herlaadCatalogus(false);
                }
            }, {rootMargin: "300px"});

            observer.observe(laadMeer);
        }

        laadLeveranciers();
    }

    huidigeZoekterm = "";
    huidigeLeverancier = "";
    if(zoekveld){
        zoekveld.value = "";
    }
    if(leverancierFilter){
        leverancierFilter.value = "";
    }

    await herlaadCatalogus(true);
}

// ============================================
// Leveranciers-dropdown vullen (met caching)
// ============================================

async function laadLeveranciers(){

    if(!leverancierFilter){
        return;
    }

    // ✅ Controleer cache: als leveranciers al geladen zijn, gebruik ze opnieuw
    if(leveranciersCache !== null){
        vulLeverancierDropdown(leveranciersCache);
        return;
    }

    const {data, error} = await supabaseClient
        .from("platen")
        .select("leverancier")
        .eq("gearchiveerd", false);

    if(error){
        console.error("Leveranciers laden mislukt:", error);
        // Toon fout aan gebruiker
        leverancierFilter.innerHTML = `
            <option value="">Fout: leveranciers konden niet geladen worden</option>
        `;
        return;
    }

    const leveranciers = [...new Set(
        (data || [])
            .map(rij => rij.leverancier)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    // ✅ Cache de leveranciers zodat we ze niet elke keer opnieuw ophalen
    leveranciersCache = leveranciers;
    vulLeverancierDropdown(leveranciers);
}

function vulLeverancierDropdown(leveranciers){
    leverancierFilter.innerHTML =
        `<option value="">Alle leveranciers</option>` +
        leveranciers.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
}

// ✅ Vernieuw cache als platen worden toegevoegd/bewerkt
async function invalideerLeveranciersCache(){
    leveranciersCache = null;
    await laadLeveranciers();
}

// ============================================
// Pagina laden (reset = nieuwe zoekopdracht, anders volgende pagina)
// ============================================

async function herlaadCatalogus(reset){

    if(bezigMetLaden){
        return;
    }

    if(!reset && allesGeladen){
        return;
    }

    bezigMetLaden = true;

    if(reset){
        huidigeOffset = 0;
        allesGeladen = false;
        resultaten.innerHTML = '<p class="loader">Catalogus laden...</p>';
    }

    if(laadMeer){
        laadMeer.classList.add("laadMeerActief");
    }

    let query = supabaseClient
        .from("platen")
        .select("naam, code, leverancier, photos, referentie, kleur, kleurnummer, gearchiveerd")
        .eq("gearchiveerd", false);

    if(huidigeLeverancier){
        query = query.eq("leverancier", huidigeLeverancier);
    }

    // ✅ Gebruik saniteerZoekterm() uit security-utils.js
    const term = saniteerZoekterm(huidigeZoekterm);

    if(term){
        let voorwaarden = [
            `naam.ilike.%${term}%`,
            `code.ilike.%${term}%`,
            `leverancier.ilike.%${term}%`,
            `referentie.ilike.%${term}%`,
            `kleur.ilike.%${term}%`
        ];

        if(/^\d+$/.test(term)){
            voorwaarden.push(`kleurnummer.eq.${term}`);
        }

        query = query.or(voorwaarden.join(","));
    }

    query = query
        .order("leverancier")
        .order("naam")
        .range(huidigeOffset, huidigeOffset + PAGINA_GROOTTE - 1);

    const {data, error} = await query;

    bezigMetLaden = false;

    if(laadMeer){
        laadMeer.classList.remove("laadMeerActief");
    }

    if(error){
        console.error("Catalogus laden mislukt:", error);

        if(reset){
            resultaten.innerHTML = `
                <p class="geenResultaat">
                    De catalogus kon niet geladen worden. Probeer het later opnieuw.
                </p>
            `;
        }

        return;
    }

    const plaatjes = (data || []).map(normaliseerPlaat);

    if(reset){
        resultaten.innerHTML = "";
    }

    if(reset && plaatjes.length === 0){
        resultaten.innerHTML = `
            <p class="geenResultaat">
                Geen platen gevonden.
            </p>
        `;
    }else{
        toonPlaten(plaatjes);
    }

    huidigeOffset += plaatjes.length;

    if(plaatjes.length < PAGINA_GROOTTE){
        allesGeladen = true;
        laadMeer?.classList.add("hidden");
    }else{
        laadMeer?.classList.remove("hidden");
    }
}

// ============================================
// Kaarten toevoegen aan het raster
// ============================================

function toonPlaten(lijst){

    lijst.forEach(plaat => {
        const kaart = document.createElement("div");
        kaart.className = "kaart modern-kaart";

        const eersteFoto = haalPlaatFotoUrl(plaat.photos[0]);
        const fotoIconHtml = icoon("foto");
        const uniqueId = `foto-${plaat.code}-${Date.now()}-${Math.random()}`;

        kaart.innerHTML = `
            <div class="kaartFoto">
                ${eersteFoto
                    ? `<img 
                        id="${uniqueId}"
                        src="${eersteFoto}" 
                        alt="${escapeHtml(plaat.naam)}" 
                        loading="lazy"
                        class="kaartImg">`
                    : `<div class="geenFoto">${fotoIconHtml}</div>`}
            </div>
            <div class="kaartBody">
                <div class="kaartTitel">${escapeHtml(plaat.naam)}</div>
                <div class="kaartCode">${escapeHtml(plaat.referentie || "")}</div>
                <div class="kaartLeverancier">${escapeHtml(plaat.leverancier)}</div>
                <button class="detailKnop" type="button">Bekijk details ${icoon("pijl-rechts")}</button>
            </div>
        `;

        // ✅ Voeg event listener toe ÁNA innerHTML (niet via onclick-attribuut)
        kaart.addEventListener("click", () => toonDetail(plaat));

        // ✅ Foutafhandeling voor foto's via event listener
        const kaartImg = kaart.querySelector(".kaartImg");
        if(kaartImg){
            kaartImg.addEventListener("error", () => {
                kaartImg.parentElement.innerHTML = `<div class="geenFoto">${fotoIconHtml}</div>`;
            }, {once: true});
        }

        resultaten.appendChild(kaart);
    });
}
