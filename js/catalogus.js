// ============================================
// catalogus.js
// Plaatcatalogus
// ============================================

let platen = [];
let huidigePlaat = null;

const resultaten = document.getElementById("resultaten");
const zoekveld = document.getElementById("search");

const detail = document.getElementById("detail");
const detailContent = document.getElementById("detailContent");

const terug = document.getElementById("terug");

terug.onclick = () => {

    detail.classList.add("hidden");
    resultaten.style.display = "grid";

};

async function laadPlaten() {

    const response = await fetch("platen.json");

    platen = await response.json();

    toonPlaten(platen);

}

zoekveld.addEventListener("input", zoeken);

function zoeken() {

    const zoekterm =
        zoekveld.value
            .toLowerCase()
            .trim();

    const gevonden = platen.filter(plaat => {

        return (

            plaat.naam
                .toLowerCase()
                .includes(zoekterm)

            ||

            plaat.code
                .toLowerCase()
                .includes(zoekterm)

            ||

            plaat.leverancier
                .toLowerCase()
                .includes(zoekterm)

            ||

            plaat.info.Referentie
                .toLowerCase()
                .includes(zoekterm)

            ||

            plaat.info.Kleur
                .toLowerCase()
                .includes(zoekterm)

            ||

            String(
                plaat.info.Kleurnummer ?? ""
            ).includes(zoekterm);

    });

    toonPlaten(gevonden);

}
function toonPlaten(lijst) {

    resultaten.innerHTML = "";

    if (lijst.length === 0) {

        resultaten.innerHTML =
            "<p class='geenResultaat'>Geen platen gevonden.</p>";

        return;
    }

    lijst.forEach(plaat => {

        const kaart = document.createElement("div");

        kaart.className = "kaart";

        kaart.onclick = () => toonDetail(plaat);

        let foto = `
            <div class="kaartPlaceholder">
                📷
            </div>
        `;

        if (plaat.photos &&
            plaat.photos.length > 0) {

            foto = `
                <img
                    src="photos/${plaat.photos[0]}"
                    alt="${plaat.naam}"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">

                <div
                    class="kaartPlaceholder"
                    style="display:none;">
                    📷
                </div>
            `;
        }

        kaart.innerHTML = `

            ${foto}

            <div class="inhoud">

                <h2>${plaat.naam}</h2>

                <p>
                    <strong>Code:</strong>
                    ${plaat.code}
                </p>

                <p>
                    <strong>Leverancier:</strong>
                    ${plaat.leverancier}
                </p>

            </div>

        `;

        resultaten.appendChild(kaart);

    });

}

document
    .getElementById("fotoToevoegen")
    .onclick = () => {

        document
            .getElementById("fotoFormulier")
            .classList.toggle("verborgen");

    };
