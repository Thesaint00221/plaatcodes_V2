// ============================================
// detail.js
// Detailpagina
// ============================================

window.geselecteerdePlaat = null;

// ============================================
// Gebruikerscache
// ============================================

const gebruikersCache = {};

// Eén gebundelde query voor alle onbekende e-mailadressen tegelijk,
// i.p.v. een aparte query per case (voorheen haalGebruikersNaam per item).
async function laadGebruikersNamen(emails){

    const onbekend = [...new Set(emails)]
        .filter(email => email && !gebruikersCache[email]);

    if(onbekend.length === 0){
        return;
    }

    const {data, error} =
        await supabaseClient
            .from("gebruikers")
            .select("email,naam")
            .in("email", onbekend);

    if(error){
        console.error("Gebruikersnamen laden mislukt:", error);
        // Toon fout in console, maar zet geen lege waarden in cache
        // (users zien dit niet direct, maar we voorkomen dat de app breekt)
    }

    (data || []).forEach(rij => {
        gebruikersCache[rij.email] = rij.naam || rij.email;
    });

    // E-mails zonder gebruikersrecord tonen we gewoon als e-mailadres
    onbekend.forEach(email => {
        if(!gebruikersCache[email]){
            gebruikersCache[email] = email;
        }
    });

}

function gebruikersNaam(email){
    return gebruikersCache[email] || email || "";
}

// ============================================
// Opslagpad -> publieke URL
// ============================================

function haalOpenbareUrl(pad){

    if(!pad){
        return "";
    }

    if(pad.startsWith("http")){
        return pad;
    }

    const {data} =
        supabaseClient.storage.from("plaatfotos").getPublicUrl(pad);

    return data.publicUrl;

}

// Bewaart de ruwe case-data per id, zodat rapport.js (klachtenrapport)
// er zonder extra query bij kan.
window.laatstGeladenCases = {};

// ============================================
// Lightbox (foto vergroten)
// ============================================

const fotoLightbox = document.getElementById("fotoLightbox");
const lightboxAfbeelding = document.getElementById("lightboxAfbeelding");
const lightboxSluitenKnop = document.getElementById("lightboxSluitenKnop");

function openLightbox(url, alt){

    if(!fotoLightbox || !lightboxAfbeelding){
        return;
    }

    lightboxAfbeelding.src = url;
    lightboxAfbeelding.alt = alt || "";

    fotoLightbox.classList.add("actief");
    document.body.classList.add("lightboxOpen");

}

function sluitLightbox(){

    if(!fotoLightbox){
        return;
    }

    fotoLightbox.classList.remove("actief");
    document.body.classList.remove("lightboxOpen");
    lightboxAfbeelding.src = "";

}

lightboxSluitenKnop?.addEventListener("click", sluitLightbox);

// Sluiten bij klikken op de donkere achtergrond (buiten de foto)
fotoLightbox?.addEventListener("click", (event) => {
    if(event.target === fotoLightbox){
        sluitLightbox();
    }
});

// Sluiten met Escape
document.addEventListener("keydown", (event) => {
    if(event.key === "Escape" && fotoLightbox?.classList.contains("actief")){
        sluitLightbox();
    }
});

// ============================================
// Elementen
// ============================================

const detail =
    document.getElementById("detail");

const detailContent =
    document.getElementById("detailContent");

const terug =
    document.getElementById("terug");

// ============================================
// Detail tonen
// ============================================

function toonDetail(plaat){

    window.geselecteerdePlaat = plaat;

    document.getElementById("resultaten").style.display = "none";

    const zoekContainer =
        document.querySelector(".zoekContainer");

    if(zoekContainer){
        zoekContainer.style.display = "none";
    }

    detail.classList.remove("hidden");

const basisFoto =
    plaat.photos && plaat.photos.length
        ? haalPlaatFotoUrl(plaat.photos[0])
        : "";

    detailContent.innerHTML = `

<div class="detailPagina">

    <div class="detailHeader">

        <div class="detailFotoGroot" id="detailFotoGroot">

            ${
                basisFoto
                ?
                `
                <img
                    id="groteFoto"
                    src="${basisFoto}"
                    alt="${escapeHtml(plaat.naam)}"
                    loading="lazy"
                    class="groteFotoImg"
                    style="width: 100%; height: 100%; object-fit: contain;"
                >
                `
                :
                `
                <div class="geenFotoGroot">
                    ${icoon("foto")}
                </div>
                `
            }

        </div>

        <div class="detailInfo">

            <span class="detailBadge">
                ${escapeHtml(plaat.leverancier)}
            </span>

            <h1>
                ${escapeHtml(plaat.naam)}
            </h1>

            <div class="detailCode">
                ${escapeHtml(plaat.code)}
            </div>

            <table class="detailTable">

                <tr>
                    <td>Leverancier</td>
                    <td>${escapeHtml(plaat.leverancier)}</td>
                </tr>

                <tr>
                    <td>Code</td>
                    <td>${escapeHtml(plaat.code)}</td>
                </tr>

                ${
                    plaat.info?.Referentie
                    ?
                    `
                    <tr>
                        <td>Referentie</td>
                        <td>${escapeHtml(plaat.info.Referentie)}</td>
                    </tr>
                    `
                    :
                    ""
                }

                ${
                    plaat.info?.Kleur
                    ?
                    `
                    <tr>
                        <td>Kleur</td>
                        <td>${escapeHtml(plaat.info.Kleur)}</td>
                    </tr>
                    `
                    :
                    ""
                }

                ${
                    plaat.info?.Kleurnummer
                    ?
                    `
                    <tr>
                        <td>Kleurnummer</td>
                        <td>${escapeHtml(String(plaat.info.Kleurnummer))}</td>
                    </tr>
                    `
                    :
                    ""
                }

            </table>

            ${
                window.huidigeGebruiker?.rol === "beheerder"
                ?
                `
                <button
                    class="bewerkPlaatKnop"
                    id="bewerkPlaatBtn"
                    type="button">

                    ${icoon("tools")} Bewerken

                </button>

                <button
                    class="archiveerKnop"
                    id="archiveerPlaatBtn"
                    type="button">

                    ${icoon("archief")} Archiveren

                </button>
                `
                :
                ""
            }

        </div>

    </div>

    <div id="galerij">

        <h3>Cases & foto's</h3>

    </div>

</div>

`;

    // ✅ Voeg event listeners toe ÁNA innerHTML
    const bewerkBtn = detailContent.querySelector("#bewerkPlaatBtn");
    if(bewerkBtn) {
        bewerkBtn.addEventListener("click", () => openPlaatModalBewerken(plaat));
    }

    const archiveerBtn = detailContent.querySelector("#archiveerPlaatBtn");
    if(archiveerBtn) {
        archiveerBtn.addEventListener("click", () => archiveerPlaat(plaat.code, archiveerBtn));
    }

    toonFotos(plaat);

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}
// ============================================
// Cases en foto's laden
// ============================================

async function toonFotos(plaat){

    const galerij =
        document.getElementById("galerij");

    galerij.innerHTML = `
        <h3>Cases & foto's</h3>
    `;

    const gebruiker =
        await laadGebruikersRol();

    const {data,error} =
        await supabaseClient
            .from("eigen_data")
            .select("*")
            .eq("code",plaat.code)
            .order("datum",{ascending:false});

    if(error){

        console.error("Cases laden mislukt:", error);

        galerij.innerHTML += `
            <p>Fout bij laden van de cases. Probeer het later opnieuw.</p>
        `;

        return;

    }

    if(!data || data.length===0){

        galerij.innerHTML += `
            <p>Nog geen cases toegevoegd.</p>
        `;

        return;

    }

    // Eén query voor alle betrokken gebruikersnamen, i.p.v. één per case
    await laadGebruikersNamen(data.map(item => item.toegevoegd_door));

    let html = "";

    for(const item of data){

        window.laatstGeladenCases[item.id] = item;

        const isLeverancier = item.type === "leverancier";

        const naam =
            gebruikersNaam(item.toegevoegd_door);

        const verwijderen =
            magVerwijderen(item,gebruiker);

        html += `

<div class="caseKaart" data-case-id="${item.id}">

    <div class="caseFotos${isLeverancier ? " caseFotosGalerij" : ""}">

        ${
            isLeverancier
            ?
            (item.fotos || [])
                .map(pad => haalOpenbareUrl(pad))
                .filter(Boolean)
                .map((url, idx) => `
                    <img
                        src="${url}"
                        class="detailFoto"
                        loading="lazy"
                        data-foto-url="${escapeHtml(url)}"
                        data-foto-index="${idx}"
                    >
                `)
                .join("")
            :
            `
            ${
                item.foto
                ?
                `
                <img
                    src="${haalOpenbareUrl(item.foto)}"
                    class="detailFoto"
                    loading="lazy"
                    data-foto-url="${escapeHtml(haalOpenbareUrl(item.foto))}"
                >
                `
                :
                ""
            }
            ${
                item.overzicht_foto
                ?
                `
                <img
                    src="${haalOpenbareUrl(item.overzicht_foto)}"
                    class="detailFoto"
                    loading="lazy"
                    data-foto-url="${escapeHtml(haalOpenbareUrl(item.overzicht_foto))}"
                >
                `
                :
                ""
            }
            `
        }

    </div>

    <div class="caseKaartInhoud" data-case-id="${item.id}">

    <span class="caseTypeBadge ${isLeverancier ? "caseTypeBadge--leverancier" : "caseTypeBadge--productie"}">
        ${isLeverancier ? icoon("vrachtwagen") + " Fout van leverancier" : icoon("fabriek") + " Fout in productie"}
    </span>

    <p class="omschrijving">
        ${escapeHtml(item.omschrijving || "").replace(/\n/g,"<br>")}
    </p>

    ${
        isLeverancier && item.leveranciersbon_url
        ?
        `
        <a
            class="bonKnop"
            href="${haalOpenbareUrl(item.leveranciersbon_url)}"
            target="_blank"
            rel="noopener">

            ${icoon("document")} Bon bekijken

        </a>
        `
        :
        ""
    }

    ${
        isLeverancier
        ?
        `
        <button
            type="button"
            class="rapportKnop"
            id="rapport-${item.id}">

            ${icoon("rapport")} Rapport leveranciersklacht genereren

        </button>
        `
        :
        ""
    }

    <small class="fotoInfo">

        ${icoon("gebruiker")} ${escapeHtml(naam)}

        <br>

        ${icoon("kalender")} ${
            item.datum
            ? new Date(item.datum).toLocaleDateString("nl-BE")
            : ""
        }

    </small>

    ${
        verwijderen
        ?
        `
        <br><br>

        <button
            type="button"
            class="bewerkFoto"
            id="bewerk-${item.id}">

            ${icoon("tools")} Bewerken

        </button>

        <button
            class="verwijderFoto"
            id="verwijder-${item.id}">

            ${icoon("vuilbak")} Verwijderen

        </button>
        `
        :
        ""
    }

    </div>

</div>

`;

    }

    galerij.innerHTML += html;

    // ✅ Voeg event listeners toe ÁNA HTML
    galerij.querySelectorAll(".detailFoto").forEach(img => {
        img.addEventListener("click", () => {
            const url = img.dataset.fotoUrl;
            if(url) {
                openLightbox(url, img.alt || "");
            }
        });
    });

    galerij.querySelectorAll(".rapportKnop").forEach(btn => {
        const caseId = btn.id.replace("rapport-", "");
        btn.addEventListener("click", () => genereerKlachtenRapport(caseId, btn));
    });

    galerij.querySelectorAll(".bewerkFoto").forEach(btn => {
        const caseId = btn.id.replace("bewerk-", "");
        btn.addEventListener("click", () => bewerkCase(caseId, btn));
    });

    galerij.querySelectorAll(".verwijderFoto").forEach(btn => {
        const caseId = btn.id.replace("verwijder-", "");
        btn.addEventListener("click", () => verwijderCase(caseId, btn));
    });

}
// ============================================
// Mag verwijderen?
// ============================================

function magVerwijderen(item, gebruiker){

    if(!gebruiker){
        return false;
    }

    if(gebruiker.rol === "beheerder"){
        return true;
    }

    return item.toegevoegd_door === gebruiker.email;

}

// ============================================
// Opslagpad bepalen
// ============================================

function haalOpslagPad(pad){

    if(!pad){
        return null;
    }

    if(pad.startsWith("http")){

        const marker = "/plaatfotos/";
        const positie = pad.indexOf(marker);

        if(positie !== -1){
            return pad.substring(
                positie + marker.length
            );
        }

    }

    return pad;

}

// ============================================
// Case verwijderen
// ============================================

async function verwijderCase(id, knop){

    if(!confirm(
        "Deze case en alle foto's verwijderen?"
    )){
        return;
    }

    const oorspronkelijkeTekst = knop ? knop.innerHTML : "";

    const herstelKnop = () => {
        if(knop){
            knop.disabled = false;
            knop.innerHTML = oorspronkelijkeTekst;
        }
    };

    if(knop){
        knop.disabled = true;
        knop.innerHTML = "⏳ Bezig...";
    }

    const {data:item,error:zoekError} =
        await supabaseClient
            .from("eigen_data")
            .select("foto,overzicht_foto,fotos,leveranciersbon_url")
            .eq("id",id)
            .single();

    if(zoekError){

        console.error("Case ophalen voor verwijdering mislukt:", zoekError);

        alert("Case ophalen mislukt. Probeer het later opnieuw.");

        herstelKnop();

        return;

    }

    const bestanden = [];

    if(item.foto){

        const pad =
            haalOpslagPad(item.foto);

        if(pad){
            bestanden.push(pad);
        }

    }

    if(item.overzicht_foto){

        const pad =
            haalOpslagPad(item.overzicht_foto);

        if(pad){
            bestanden.push(pad);
        }

    }

    (item.fotos || []).forEach(foto => {
        const pad = haalOpslagPad(foto);
        if(pad){
            bestanden.push(pad);
        }
    });

    if(item.leveranciersbon_url){
        const pad = haalOpslagPad(item.leveranciersbon_url);
        if(pad){
            bestanden.push(pad);
        }
    }

    if(bestanden.length){

        const {error:storageError} =
            await supabaseClient
                .storage
                .from("plaatfotos")
                .remove(bestanden);

        if(storageError){

            console.error("Foto's verwijderen mislukt:", storageError);

            alert(
                "Foto's verwijderen mislukt. De case is niet verwijderd."
            );

            herstelKnop();

            return;

        }

    }

    const {error} =
        await supabaseClient
            .from("eigen_data")
            .delete()
            .eq("id",id);

    if(error){

        console.error("Case verwijderen mislukt:", error);

        alert(
            "Case verwijderen mislukt. Probeer het later opnieuw."
        );

        herstelKnop();

        return;

    }

    alert(
        "Case succesvol verwijderd."
    );

    toonFotos(
        window.geselecteerdePlaat
    );

}
// ============================================
// Plaat archiveren
// ============================================

async function archiveerPlaat(code, knop){

    if(!confirm(
        "Deze plaat archiveren?"
    )){
        return;
    }

    const oorspronkelijkeTekst = knop ? knop.innerHTML : "";

    if(knop){
        knop.disabled = true;
        knop.innerHTML = "⏳ Bezig...";
    }

    const {error} =
        await supabaseClient
            .from("platen")
            .update({
                gearchiveerd:true
            })
            .eq("code",code);


    if(error){

        console.error("Archiveren mislukt:", error);

        alert(
            "Archiveren mislukt. Probeer het later opnieuw."
        );

        if(knop){
            knop.disabled = false;
            knop.innerHTML = oorspronkelijkeTekst;
        }

        return;

    }


    alert(
        "Plaat werd gearchiveerd."
    );


    detail.classList.add("hidden");


    document.getElementById("resultaten").style.display = "";


    await initCatalogus();

}

// ============================================
// Terugknop
// ============================================

if(terug){

    terug.addEventListener("click",function(){

        detail.classList.add("hidden");

        document.getElementById("resultaten").style.display = "";

        const zoekContainer =
            document.querySelector(".zoekContainer");

        if(zoekContainer){
            zoekContainer.style.display = "";
        }

        // Verwijder alleen de deeplink-parameter uit de URL.
        // De rest van de huidige pagina en functionaliteit blijft ongewijzigd.
        if(window.location.search.includes("plaat=")){
            const url = new URL(window.location.href);
            url.searchParams.delete("plaat");
            window.history.replaceState({},"",url.pathname + (url.search ? url.search : "") + url.hash);
        }

        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    });

}
