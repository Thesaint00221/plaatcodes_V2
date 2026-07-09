const detail = document.getElementById("detail");
const detailContent = document.getElementById("detailContent");
const terug = document.getElementById("terug");

terug.onclick = () => {
    detail.classList.add("hidden");
    resultaten.style.display = "grid";
};

let platen = [];

const resultaten = document.getElementById("resultaten");
const zoekveld = document.getElementById("search");

async function laadPlaten() { ... }

laadPlaten();

zoekveld.addEventListener("input", zoeken);

function zoeken() { ... }

function toonPlaten(lijst) { ... }

function toonDetail(plaat) { ... }
