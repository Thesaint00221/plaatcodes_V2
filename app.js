let platen = [];

async function laadPlaten() {

    const response = await fetch("platen.json");
    platen = await response.json();

    console.log(platen);
}

laadPlaten();

document
.getElementById("search")
.addEventListener("input", zoeken);

function zoeken(){

    const zoekterm =
        document
        .getElementById("search")
        .value
        .toLowerCase();

    console.log("Zoeken naar:", zoekterm);

}
