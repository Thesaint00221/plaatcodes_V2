// ============================================
// detail.js
// CASE weergave met detail + overzichtsfoto
// ============================================

window.geselecteerdePlaat = null;

// ============================================
// Naam gebruiker ophalen
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
        (data && data.naam) || email;

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

    detailContent.innerHTML = `

<div class="detailPagina">

    <div class="detailHeader">

        <div class="detailFotoGroot">

            ${
                plaat.photos && plaat.photos.length
                ?
                `
                <img
                    id="groteFoto"
                    src="photos/${plaat.photos[0]}"
                    alt="${plaat.naam}"
                    loading="lazy">
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
                    plaat.info && plaat.info.Referentie
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
                    plaat.info && plaat.info.Kleur
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

            </table>

        </div>

    </div>

    <div id="galerij"></div>

</div>

`;

    // Cases laden
    toonFotos(plaat);

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}
// ============================================
// Foto's en cases laden
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
            <p>Fout bij laden.</p>
        `;

        return;

    }

    if(!data || data.length===0){

        galerij.innerHTML += `
            <p>Nog geen meldingen.</p>
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

                detailUrl =
                    urlData.publicUrl;

            }

        }

        // Overzichtsfoto

        if(item.overzicht_foto){

            if(item.overzicht_foto.startsWith("http")){

                overzichtUrl =
                    item.overzicht_foto;

            }else{

                const {data:urlData} =
                    supabaseClient
                    .storage
                    .from("plaatfotos")
                    .getPublicUrl(item.overzicht_foto);

                overzichtUrl =
                    urlData.publicUrl;

            }

        }

        const verwijderen =
            magVerwijderen(item,gebruiker);

        const naam =
            await haalGebruikersNaam(
                item.toegevoegd_door
            );

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
                loading="lazy">
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
                loading="lazy">
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
            ?
            new Date(item.datum)
                .toLocaleDateString("nl-BE")
            :
            ""
        }

    </small>

    ${
        verwijderen
        ?
        `
        <br>

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

activeerFotoKlik();

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

        const pad = haalOpslagPad(item.foto);

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

        const {
            error:storageError
        } =
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

    const {
        error
    } =
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
// LIGHTBOX VOOR CASE FOTO'S
// ============================================


function openFotoLightbox(url){

    let lightbox =
        document.getElementById(
            "fotoLightbox"
        );


    if(!lightbox){

        lightbox =
        document.createElement(
            "div"
        );

        lightbox.id =
            "fotoLightbox";


        document.body.appendChild(
            lightbox
        );

    }


    lightbox.innerHTML = `

        <div class="lightboxBinnen">

            <img src="${url}">

        </div>

    `;


    lightbox.classList.add(
        "actief"
    );


    lightbox.onclick = function(){

        lightbox.classList.remove(
            "actief"
        );

    };

}



// ============================================
// FOTO KLIK EVENTS TOEVOEGEN
// ============================================


function activeerFotoKlik(){

    const foto's =
        document.querySelectorAll(
            ".caseFotos img"
        );


    foto's.forEach(
        foto => {


            foto.onclick = function(){

                openFotoLightbox(
                    this.src
                );

            };


        }
    );

}
