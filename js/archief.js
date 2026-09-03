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

    const {data,error} =
        await supabaseClient
            .from("platen")
            .select("*")
            .eq("gearchiveerd",true)
            .order("naam");

    if(error){

        console.error(error);

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
            onclick="terugActief('${plaat.code}')">

            ♻️ Terugzetten

        </button>

    </div>

</div>

`;

    });

}
async function terugActief(code){

    const {error} =
        await supabaseClient
            .from("platen")
            .update({
                gearchiveerd:false
            })
            .eq("code",code);

    if(error){

        alert("Terugzetten mislukt");

        return;

    }

    laadArchief();

}
