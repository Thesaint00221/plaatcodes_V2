const archiefPagina =
    document.getElementById("archiefPagina");

const archiefResultaten =
    document.getElementById("archiefResultaten");

document
.getElementById("archiefKnop")
.addEventListener("click", laadArchief);

document
.getElementById("sluitArchief")
.addEventListener("click", () => {

    archiefPagina.classList.add("hidden");

    document.getElementById("resultaten").style.display="";

});
