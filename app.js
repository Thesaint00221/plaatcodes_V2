let platen = [];

const resultaten = document.getElementById("resultaten");
const zoekveld = document.getElementById("search");

async function laadPlaten() {

    const response = await fetch("platen.json");
    platen = await response.json();

    toonPlaten(platen);
}

laadPlaten();

zoekveld.addEventListener("input", zoeken);

function zoeken() {

    const zoekterm = zoekveld.value.toLowerCase().trim();

    const gevonden = platen.filter(plaat => {

        return (
            plaat.naam.toLowerCase().includes(zoekterm) ||
            plaat.code.toLowerCase().includes(zoekterm) ||
            plaat.leverancier.toLowerCase().includes(zoekterm) ||
            plaat.info.Referentie.toLowerCase().includes(zoekterm) ||
            plaat.info.Kleur.toLowerCase().includes(zoekterm) ||
            String(plaat.info.Kleurnummer).includes(zoekterm)
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

        kaart.innerHTML = `
            <img src="photos/${plaat.photos[0]}" alt="${plaat.naam}">

            <div class="inhoud">
                <h2>${plaat.naam}</h2>

                <p><strong>Code:</strong> ${plaat.code}</p>

                <p><strong>Leverancier:</strong> ${plaat.leverancier}</p>
            </div>
        `;

        resultaten.appendChild(kaart);

    });

}
