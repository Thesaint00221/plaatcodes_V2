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
async function laadArchief(){

    document.getElementById("resultaten").style.display="none";

    archiefPagina.classList.remove("hidden");

    archiefResultaten.innerHTML = '<p class="loader">Archief laden...</p>';

    const {data,error} =
        await supabaseClient
            .from("platen")
            .select("*")
            .eq("gearchiveerd",true)
            .order("naam");

    if(error){

        console.error(error);

        archiefResultaten.innerHTML =
            '<p class="geenResultaat">Archief kon niet geladen worden.</p>';

        return;

    }

    if(data.length === 0){

        archiefResultaten.innerHTML =
            '<p class="geenResultaat">Geen gearchiveerde platen.</p>';

        return;

    }

    archiefResultaten.innerHTML="";

    data.forEach(plaat=>{

        archiefResultaten.innerHTML+=`

<div class="kaart modern-kaart">

    <div class="kaartBody">

        <div class="kaartTitel">

            ${plaat.naam}

        </div>

        <div class="kaartCode">

            ${plaat.code}

        </div>

        <button
            onclick="terugActief('${plaat.code}', this)">

            ♻️ Terugzetten

        </button>

    </div>

</div>

`;

    });

}
async function terugActief(code, knop){

    const oorspronkelijkeTekst = knop ? knop.innerHTML : "";

    if(knop){
        knop.disabled = true;
        knop.innerHTML = "⏳ Bezig...";
    }

    const {error} =
        await supabaseClient
            .from("platen")
            .update({
                gearchiveerd:false
            })
            .eq("code",code);

    if(error){

        alert("Terugzetten mislukt");

        if(knop){
            knop.disabled = false;
            knop.innerHTML = oorspronkelijkeTekst;
        }

        return;

    }

    laadArchief();

}
