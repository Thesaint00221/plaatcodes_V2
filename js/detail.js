// ============================================
// detail.js
// ============================================


window.geselecteerdePlaat = null;

const detail = document.getElementById("detail");
const detailContent = document.getElementById("detailContent");
const terug = document.getElementById("terug");



function toonDetail(plaat) {

    window.geselecteerdePlaat = plaat;


    // zoekpagina verbergen
    document.getElementById("resultaten").style.display = "none";
    document.querySelector(".search").style.display = "none";


    // detail tonen
    detail.classList.remove("hidden");


    detailContent.innerHTML = `

        <h2>${plaat.naam}</h2>

        <p>
            <strong>Code:</strong> ${plaat.code}
        </p>

        <p>
            <strong>Leverancier:</strong> ${plaat.leverancier}
        </p>

        <div id="galerij"></div>

    `;


    toonFotos(plaat);


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}




async function toonFotos(plaat) {

    const galerij =
        document.getElementById("galerij");


    galerij.innerHTML = `
        <h3>Foto's</h3>
    `;



    // ==========================================
    // Basisfoto's uit GitHub
    // ==========================================


    if (plaat.photos && plaat.photos.length) {


        plaat.photos.forEach(foto => {


            galerij.innerHTML += `

                <div class="fotoKaart">

                    <img
                        src="photos/${foto}"
                        class="detailFoto"
                        alt="${plaat.naam}">

                    <p>
                        Basisfoto
                    </p>

                </div>

            `;

        });

    }




    // ==========================================
    // Gebruiker ophalen
    // ==========================================

    const gebruiker =
        await laadGebruikersRol();




    // ==========================================
    // Extra foto's Supabase
    // ==========================================


    const { data, error } =
        await supabaseClient
            .from("eigen_data")
            .select("*")
            .eq("code", plaat.code)
            .not("foto", "is", null);



    if (error) {

        console.error(
            "Fout bij ophalen foto's:",
            error
        );

        return;

    }




    if (!data || data.length === 0) {


        galerij.innerHTML += `

            <p>
                Nog geen extra foto's toegevoegd.
            </p>

        `;


        return;

    }




    data.forEach(item => {



        const verwijderen =
            magVerwijderen(
                item,
                gebruiker
            );



        galerij.innerHTML += `


            <div class="fotoKaart">


                <img
                    src="${item.foto}"
                    class="detailFoto"
                    alt="${plaat.code}">



                <p>
                    <strong>
                        ${item.type || ""}
                    </strong>
                </p>



                <p>
                    ${item.omschrijving || ""}
                </p>



                <small>

                    ${item.datum
                        ? new Date(item.datum)
                            .toLocaleDateString("nl-BE")
                        : ""}


                    <br>


                    Toegevoegd door:
                    ${item.toegevoegd_door || "onbekend"}

                </small>



                ${
                    verwijderen
                    ?
                    `

                    <br>

<button
    class="verwijderFoto"
    onclick="verwijderFoto('${item.id}', '${item.foto}')">

    🗑 Verwijderen

</button>

                    `
                    :
                    ""
                }



            </div>


        `;


    });


}




// ==========================================
// Controle verwijderrechten
// ==========================================


function magVerwijderen(item, gebruiker) {


    if (!gebruiker) {

        return false;

    }



    // beheerder mag alles

    if (gebruiker.rol === "beheerder") {

        return true;

    }



    // gewone gebruiker alleen eigen foto's

    return item.toegevoegd_door === gebruiker.email;


}


// ==========================================
// Foto verwijderen
// ==========================================

async function verwijderFoto(id, fotoUrl) {


    if (!confirm("Deze foto verwijderen?")) {
        return;
    }


    // bestandsnaam uit URL halen

    const pad =
        fotoUrl.split("/plaatfotos/")[1];


    if (!pad) {

        alert("Kan bestandslocatie niet vinden");
        return;

    }



    // verwijderen uit Storage

    const { error: storageError } =
        await supabaseClient
            .storage
            .from("plaatfotos")
            .remove([
                pad
            ]);



    if (storageError) {

        console.error(storageError);

        alert(
            "Foto verwijderen mislukt"
        );

        return;

    }



    // verwijderen uit database

    const { error: databaseError } =
        await supabaseClient
            .from("eigen_data")
            .delete()
            .eq("id", id);



    if (databaseError) {

        console.error(databaseError);

        alert(
            "Gegevens verwijderen mislukt"
        );

        return;

    }



    alert("Foto verwijderd");


    toonFotos(
        window.geselecteerdePlaat
    );

}


// ==========================================
// Terug knop
// ==========================================


terug.addEventListener("click", () => {


    detail.classList.add("hidden");


    document.getElementById("resultaten").style.display = "grid";

    document.querySelector(".search").style.display = "block";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


});

