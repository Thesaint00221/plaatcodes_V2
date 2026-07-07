let platen = [];

const basis = "./";

const cards = document.getElementById("cards");
const detail = document.getElementById("detail");
const detailTitle = document.getElementById("detailTitle");
const detailCode = document.getElementById("detailCode");
const detailTable = document.getElementById("detailTable");


document
    .getElementById("backButton")
    .onclick = () => detail.classList.add("hidden");



async function start(){

    const response = await fetch(basis + "data.json");

    platen = await response.json();

    render(platen);

}



function render(lijst){

    cards.innerHTML = "";

    lijst.forEach(plaat => {

        const card = document.createElement("div");

        card.className = "card";


        card.innerHTML = `
        <div class="cardBody">

            <h2>${plaat.naam}</h2>

            <div class="code">
                ${plaat.code}
            </div>

            <div class="leverancier">
                ${plaat.leverancier}
            </div>

        </div>
        `;


        card.onclick = () => openDetail(plaat);


        cards.appendChild(card);

    });

}



function openDetail(plaat){

    detail.classList.remove("hidden");


    detailTitle.textContent = plaat.naam;

    detailCode.textContent = "Referentie " + plaat.code;


    detailTable.innerHTML = `

    <tr>
        <td>Leverancier</td>
        <td>${plaat.leverancier}</td>
    </tr>

    <tr>
        <td>Referentie</td>
        <td>${plaat.info?.Referentie ?? ""}</td>
    </tr>

    <tr>
        <td>Kleur</td>
        <td>${plaat.info?.Kleur ?? ""}</td>
    </tr>

    <tr>
        <td>Kleurnummer</td>
        <td>${plaat.info?.Kleurnummer ?? ""}</td>
    </tr>

    `;

}




document
.getElementById("search")
.addEventListener("input", function(){

    const zoek = this.value.toLowerCase();


    const resultaat = platen.filter(plaat =>

        plaat.naam.toLowerCase().includes(zoek) ||

        plaat.code.toLowerCase().includes(zoek) ||

        plaat.leverancier.toLowerCase().includes(zoek)

    );


    render(resultaat);

});



start();
