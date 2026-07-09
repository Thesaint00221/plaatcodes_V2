// ============================================
// catalogus.js
// ============================================

let platen = [];

const resultaten = document.getElementById("resultaten");
const zoekveld = document.getElementById("search");

async function initCatalogus() {
    try {
        const response = await fetch("data.json");

        if (!response.ok) {
            throw new Error(`Kan data.json niet laden (${response.status})`);
        }

        platen = await response.json();

        toonPlaten(platen);

    } catch (err) {
        console.error(err);

        resultaten.innerHTML = `
            <p class="geenResultaat">
                Fout bij het laden van de catalogus.
            </p>
        `;
    }
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
        resultaten.innerHTML =
            "<p class='geenResultaat'>Geen platen gevonden.</p>";
        return;
    }

    lijst.forEach(plaat => {

        const kaart = document.createElement("div");
        kaart.className = "kaart";

        kaart.addEventListener("click", () => {
            if (typeof toonDetail === "function") {
                toonDetail(plaat);
            }
        });

        const eersteFoto =
            plaat.photos && plaat.photos.length
                ? `photos/${plaat.photos[0]}`
                : "";

        kaart.innerHTML = `
            <div class="kaartFoto">
                ${
                    eersteFoto
                        ? `
                    <img src="${eersteFoto}"
                         alt="${plaat.naam}"
                         onerror="this.remove();this.parentElement.innerHTML='📷';">
                    `
                        : "📷"
                }
            </div>

            <div class="inhoud">
                <h2>${plaat.naam}</h2>

                <p><strong>Code:</strong> ${plaat.code}</p>

                <p><strong>Leverancier:</strong> ${plaat.leverancier}</p>
            </div>
        `;

        resultaten.appendChild(kaart);

    });

}

function getPlaat(code) {
    return platen.find(p => p.code === code);
}
    };
