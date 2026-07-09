// ============================================
// detail.js
// DEEL 1
// ============================================

window.geselecteerdePlaat = null;

const detail = document.getElementById("detail");
const detailContent = document.getElementById("detailContent");
const terug = document.getElementById("terug");



function toonDetail(plaat) {

    window.geselecteerdePlaat = plaat;

    document.getElementById("resultaten").style.display = "none";
    document.querySelector(".search").style.display = "none";

    detail.classList.remove("hidden");

    detailContent.innerHTML = `

        <h2>${plaat.naam}</h2>

        <p><strong>Code:</strong> ${plaat.code}</p>

        <p><strong>Leverancier:</strong> ${plaat.leverancier}</p>

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
    // GitHub foto's
    // ==========================================

    if (plaat.photos && plaat.photos.length) {

        plaat.photos.forEach(foto => {

            galerij.innerHTML += `

                <div class="fotoKaart">

                    <img
                        src="photos/${foto}"
                        class="detailFoto"
                        alt="${plaat.naam}"

                        onerror="
                            this.style.display='none';
                        ">

                    <p>Basisfoto</p>

                </div>

            `;

        });

    }



    // ==========================================
    // gebruiker ophalen
    // ==========================================

    const gebruiker =
        await laadGebruikersRol();




    // ==========================================
    // Supabase foto's ophalen
    // ==========================================

    const { data, error } =
        await supabaseClient
            .from("eigen_data")
            .select("*")
            .eq("code", plaat.code)
            .order("datum", {
                ascending: false
            });



    if (error) {

        console.error(error);

        galerij.innerHTML += `
            <p>Fout bij ophalen foto's.</p>
        `;

        return;

    }



    if (!data || data.length === 0) {

        galerij.innerHTML += `
            <p>Nog geen extra foto's.</p>
        `;

        return;

    }



    for (const item of data) {

        let fotoUrl = "";



        // ======================================
        // Oude records (volledige URL)
        // ======================================

        if (
            item.foto &&
            item.foto.startsWith("http")
        ) {

            fotoUrl = item.foto;

        }

        // ======================================
        // Nieuwe records (opslagpad)
        // ======================================

        else {

            const { data: urlData } =
                supabaseClient
                    .storage
                    .from("plaatfotos")
                    .getPublicUrl(
                        item.foto
                    );

            fotoUrl =
                urlData.publicUrl;

        }



        const verwijderen =
            magVerwijderen(
                item,
                gebruiker
            );



        galerij.innerHTML += `

            <div class="fotoKaart">

                <img
                    src="${fotoUrl}"
                    class="detailFoto">

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

                    ${item.toegevoegd_door || ""}

                </small>

                ${
                    verwijderen
                    ?

                    `

                    <br>

                    <button
                        class="verwijderFoto"

                        onclick="verwijderFoto(
                            '${item.id}',
                            '${item.foto}'
                        )">

                        🗑 Verwijderen

                    </button>

                    `

                    :

                    ""

                }

            </div>

        `;

    }

}





function magVerwijderen(item, gebruiker) {

    if (!gebruiker) {

        return false;

    }

    if (gebruiker.rol === "beheerder") {

        return true;

    }

    return (
        item.toegevoegd_door ===
        gebruiker.email
    );

}
// ==========================================
// Foto verwijderen
// ==========================================

async function verwijderFoto(id, opslagPad) {

    if (!confirm("Deze foto verwijderen?")) {
        return;
    }


    // Oude records (volledige URL) omzetten
    // naar opslagpad

    if (
        opslagPad &&
        opslagPad.startsWith("http")
    ) {

        const marker = "/plaatfotos/";

        const positie =
            opslagPad.indexOf(marker);

        if (positie !== -1) {

            opslagPad =
                opslagPad.substring(
                    positie +
                    marker.length
                );

        }

    }


    // Bestand verwijderen uit Storage

    const { error: storageError } =
        await supabaseClient
            .storage
            .from("plaatfotos")
            .remove([
                opslagPad
            ]);


    if (storageError) {

        console.error(storageError);

        alert(
            "Foto uit opslag verwijderen mislukt."
        );

        return;

    }


    // Record verwijderen uit database

    const { error: databaseError } =
        await supabaseClient
            .from("eigen_data")
            .delete()
            .eq("id", id);


    if (databaseError) {

        console.error(databaseError);

        alert(
            "Database-record verwijderen mislukt."
        );

        return;

    }


    alert("Foto verwijderd.");

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
