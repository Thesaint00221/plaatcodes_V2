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

// PostgREST's .or()-syntax gebruikt , ( ) als scheidingstekens — die
// verwijderen we uit de zoekterm zodat de query geldig blijft.
function saniteerZoekterm(term){
    return term.replace(/[,()%]/g, "").trim();
}

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
// Leveranciers-dropdown vullen
// ============================================

async function laadLeveranciers(){

    if(!leverancierFilter){
        return;
    }

    const {data, error} = await supabaseClient
        .from("platen")
        .select("leverancier")
        .eq("gearchiveerd", false);

    if(error){
        console.error(error);
        return;
    }

    const leveranciers = [...new Set(
        (data || [])
            .map(rij => rij.leverancier)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    leverancierFilter.innerHTML =
        `<option value="">Alle leveranciers</option>` +
        leveranciers.map(l => `<option value="${l}">${l}</option>`).join("");
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
        console.error(error);

        if(reset){
            resultaten.innerHTML = `
                <p class="geenResultaat">
                    De catalogus kon niet geladen worden.
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
