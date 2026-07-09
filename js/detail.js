// ============================================
// detail.js
// ============================================

let geselecteerdePlaat = null;

const detail = document.getElementById("detail");
const detailContent = document.getElementById("detailContent");
const terug = document.getElementById("terug");


function toonDetail(plaat) {

    geselecteerdePlaat = plaat;

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
}


async function toonFotos(plaat) {

    const galerij = document.getElementById("galerij");

    galerij.innerHTML = "";


    // bestaande GitHub foto

    if (plaat.photos && plaat.photos.length) {

        plaat.photos.forEach(foto => {

            galerij.innerHTML += `
                <img
                    src="photos/${foto}"
                    class="detailFoto"
                    alt="${plaat.naam}">
            `;

        });

    }


    // extra foto's uit Supabase

    const { data, error } =
        await supabaseClient
            .from("eigen_data")
            .select("*")
            .eq("code", plaat.code);


    if (error) {

        console.error(error);
        return;

    }


    if (data) {

        data.forEach(item => {

            if (item.foto) {

                galerij.innerHTML += `
                    <div class="extraFoto">

                        <img
                            src="${item.foto}"
                            class="detailFoto">

                        <p>
                            ${item.omschrijving || ""}
                        </p>

                    </div>
                `;

            }

        });

    }

}


terug.addEventListener("click", () => {

    detail.classList.add("hidden");

});
