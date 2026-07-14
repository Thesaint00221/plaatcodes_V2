// ============================================
// detail.js
// Detailpagina
// ============================================

window.geselecteerdePlaat = null;

// ============================================
// Gebruikerscache
// ============================================

const gebruikersCache = {};

async function haalGebruikersNaam(email){

    if(!email){
        return "";
    }

    if(gebruikersCache[email]){
        return gebruikersCache[email];
    }

    const {data} =
        await supabaseClient
            .from("gebruikers")
            .select("naam")
            .eq("email",email)
            .single();

    const naam =
        (data && data.naam)
            ? data.naam
            : email;

    gebruikersCache[email] = naam;

    return naam;

}

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
        ? plaat.photos[0]
        : "";

    detailContent.innerHTML = `

<div class="detailPagina">

    <div class="detailHeader">

        <div class="detailFotoGroot">

            ${
                basisFoto
                ?
                `
                <img
                    id="groteFoto"
                    src="${basisFoto}"
                    alt="${plaat.naam}"
                    loading="lazy"
                    onclick="openFotoLightbox('${basisFoto}')"
                >
                `
                :
                `
                <div class="geenFotoGroot">
                    📷
                </div>
                `
            }

        </div>

        <div class="detailInfo">

            <span class="detailBadge">
                ${plaat.leverancier}
            </span>

            <h1>
                ${plaat.naam}
            </h1>

            <div class="detailCode">
                ${plaat.code}
            </div>

            <table class="detailTable">

                <tr>
                    <td>Leverancier</td>
                    <td>${plaat.leverancier}</td>
                </tr>

                <tr>
                    <td>Code</td>
                    <td>${plaat.code}</td>
                </tr>

                ${
                    plaat.info?.Referentie
                    ?
                    `
                    <tr>
                        <td>Referentie</td>
                        <td>${plaat.info.Referentie}</td>
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
                        <td>${plaat.info.Kleur}</td>
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
                        <td>${plaat.info.Kleurnummer}</td>
                    </tr>
                    `
                    :
                    ""
                }

            </table>

        </div>

    </div>

    <div id="galerij">

        <h3>Cases & foto's</h3>

    </div>

</div>

`;

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

        console.error(error);

        galerij.innerHTML += `
            <p>Fout bij laden van de cases.</p>
        `;

        return;

    }

    if(!data || data.length===0){

        galerij.innerHTML += `
            <p>Nog geen cases toegevoegd.</p>
        `;

        return;

    }

    let html = "";

    for(const item of data){

        let detailUrl = "";
        let overzichtUrl = "";

        // Detailfoto

        if(item.foto){

            if(item.foto.startsWith("http")){

                detailUrl = item.foto;

            }else{

                const {data:urlData} =
                    supabaseClient
                        .storage
                        .from("plaatfotos")
                        .getPublicUrl(item.foto);

                detailUrl = urlData.publicUrl;

            }

        }

        // Overzichtsfoto

        if(item.overzicht_foto){

            if(item.overzicht_foto.startsWith("http")){

                overzichtUrl = item.overzicht_foto;

            }else{

                const {data:urlData} =
                    supabaseClient
                        .storage
                        .from("plaatfotos")
                        .getPublicUrl(item.overzicht_foto);

                overzichtUrl = urlData.publicUrl;

            }

        }

        const naam =
            await haalGebruikersNaam(item.toegevoegd_door);

        const verwijderen =
            magVerwijderen(item,gebruiker);

        html += `

<div class="caseKaart">

    <div class="caseFotos">

        ${
            detailUrl
            ?
            `
            <img
                src="${detailUrl}"
                class="detailFoto"
                loading="lazy"
                onclick="openFotoLightbox('${detailUrl}')"
            >
            `
            :
            ""
        }

        ${
            overzichtUrl
            ?
            `
            <img
                src="${overzichtUrl}"
                class="detailFoto"
                loading="lazy"
                onclick="openFotoLightbox('${overzichtUrl}')"
            >
            `
            :
            ""
        }

    </div>

    <h3>
        ${item.type || "Case"}
    </h3>

    <p class="omschrijving">
        ${(item.omschrijving || "").replace(/\n/g,"<br>")}
    </p>

    <small class="fotoInfo">

        👤 ${naam}

        <br>

        📅 ${
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
            class="verwijderFoto"
            onclick="verwijderCase('${item.id}')">

            🗑 Verwijderen

        </button>
        `
        :
        ""
    }

</div>

`;

    }

    galerij.innerHTML += html;

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

async function verwijderCase(id){

    if(!confirm(
        "Deze case en alle foto's verwijderen?"
    )){
        return;
    }

    const {data:item,error:zoekError} =
        await supabaseClient
            .from("eigen_data")
            .select("foto,overzicht_foto")
            .eq("id",id)
            .single();

    if(zoekError){

        console.error(zoekError);

        alert("Case ophalen mislukt.");

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

    if(bestanden.length){

        const {error:storageError} =
            await supabaseClient
                .storage
                .from("plaatfotos")
                .remove(bestanden);

        if(storageError){

            console.error(storageError);

            alert(
                "Foto's verwijderen mislukt."
            );

            return;

        }

    }

    const {error} =
        await supabaseClient
            .from("eigen_data")
            .delete()
            .eq("id",id);

    if(error){

        console.error(error);

        alert(
            "Case verwijderen mislukt."
        );

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
// Lightbox
// ============================================

function openFotoLightbox(url){

    if(!url){
        return;
    }

    let lightbox =
        document.getElementById(
            "fotoLightbox"
        );

    if(!lightbox){

        lightbox =
            document.createElement("div");

        lightbox.id =
            "fotoLightbox";

        document.body.appendChild(
            lightbox
        );

    }

    lightbox.innerHTML = `

        <div class="lightboxBinnen">

            <button
                class="lightboxSluiten"
                type="button"
                aria-label="Foto sluiten">
                ×
            </button>

            <img
                src="${url}"
                alt="Foto"
            >

        </div>

    `;

    lightbox.classList.add("actief");

    const sluitLightbox = function(){
        lightbox.classList.remove("actief");
        document.body.classList.remove("lightboxOpen");
    };

    document.body.classList.add("lightboxOpen");

    lightbox.onclick = function(event){
        if(event.target === lightbox){
            sluitLightbox();
        }
    };

    lightbox
        .querySelector(".lightboxSluiten")
        .addEventListener("click", sluitLightbox);

    document.onkeydown = function(event){
        if(event.key === "Escape"){
            sluitLightbox();
        }
    };

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

        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    });

}
