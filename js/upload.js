// ============================================
// upload.js
// Case toevoegen: type 'productie' (detail + overzicht) of
// 'leverancier' (meerdere foto's + optionele bon-PDF)
// ============================================


let geselecteerdeDetailFoto = null;
let geselecteerdeOverzichtFoto = null;
let geselecteerdeLeverancierFotos = [];
let geselecteerdeLeverancierBon = null;
let huidigCaseType = "productie";

const MAX_LEVERANCIER_FOTOS = 10;


const detailKnop =
    document.getElementById("detailKnop");


const overzichtKnop =
    document.getElementById("overzichtKnop");


const detailBestand =
    document.getElementById("detailBestand");


const overzichtBestand =
    document.getElementById("overzichtBestand");

const typeProductieKnop =
    document.getElementById("typeProductieKnop");

const typeLeverancierKnop =
    document.getElementById("typeLeverancierKnop");

const productieVelden =
    document.getElementById("productieVelden");

const leverancierVelden =
    document.getElementById("leverancierVelden");

const leverancierFotosKnop =
    document.getElementById("leverancierFotosKnop");

const leverancierFotosBestand =
    document.getElementById("leverancierFotosBestand");

const leverancierBonKnop =
    document.getElementById("leverancierBonKnop");

const leverancierBonBestand =
    document.getElementById("leverancierBonBestand");


// ============================================
// Type-keuze (productie / leverancier)
// ============================================

function kiesCaseType(type){

    huidigCaseType = type;

    typeProductieKnop?.classList.toggle("actief", type === "productie");
    typeLeverancierKnop?.classList.toggle("actief", type === "leverancier");

    productieVelden?.classList.toggle("hidden", type !== "productie");
    leverancierVelden?.classList.toggle("hidden", type !== "leverancier");

}

typeProductieKnop?.addEventListener("click", () => kiesCaseType("productie"));
typeLeverancierKnop?.addEventListener("click", () => kiesCaseType("leverancier"));


// ============================================
// Foto selectie (productie)
// ============================================


detailKnop?.addEventListener(
"click",
() => {

    detailBestand.click();

});



detailBestand?.addEventListener(
"change",
() => {

    geselecteerdeDetailFoto =
        detailBestand.files[0];


    if(geselecteerdeDetailFoto){

        detailKnop.innerHTML =
            "✅ DETAILFOTO GEKOZEN";

    }

});




overzichtKnop?.addEventListener(
"click",
() => {

    overzichtBestand.click();

});



overzichtBestand?.addEventListener(
"change",
() => {

    geselecteerdeOverzichtFoto =
        overzichtBestand.files[0];


    if(geselecteerdeOverzichtFoto){

        overzichtKnop.innerHTML =
            "✅ OVERZICHTSFOTO GEKOZEN";

    }

});


// ============================================
// Foto's + bon selectie (leverancier)
// ============================================

leverancierFotosKnop?.addEventListener("click", () => {
    leverancierFotosBestand.click();
});

leverancierFotosBestand?.addEventListener("change", () => {

    let bestanden = Array.from(leverancierFotosBestand.files);

    if(bestanden.length > MAX_LEVERANCIER_FOTOS){
        alert(`Je kan maximaal ${MAX_LEVERANCIER_FOTOS} foto's tegelijk toevoegen. De eerste ${MAX_LEVERANCIER_FOTOS} worden gebruikt.`);
        bestanden = bestanden.slice(0, MAX_LEVERANCIER_FOTOS);
    }

    geselecteerdeLeverancierFotos = bestanden;

    if(bestanden.length > 0){
        leverancierFotosKnop.innerHTML =
            `✅ ${bestanden.length} FOTO${bestanden.length > 1 ? "'S" : ""} GEKOZEN`;
    }

});

leverancierBonKnop?.addEventListener("click", () => {
    leverancierBonBestand.click();
});

leverancierBonBestand?.addEventListener("change", () => {

    const bestand = leverancierBonBestand.files[0];

    if(bestand && bestand.type !== "application/pdf"){
        alert("Kies een PDF-bestand voor de leveranciersbon.");
        leverancierBonBestand.value = "";
        return;
    }

    geselecteerdeLeverancierBon = bestand || null;

    if(geselecteerdeLeverancierBon){
        leverancierBonKnop.innerHTML = "✅ BON GEKOZEN";
    }

});


// ============================================
// Foto verkleinen
// ============================================
// verkleinFoto() staat nu in js/foto.js (gedeeld met platen-beheer.js)



// ============================================
// CASE OPSLAAN
// ============================================


document
.getElementById("opslaanFoto")
?.addEventListener(
"click",
async()=>{


const knop =
    document.getElementById(
        "opslaanFoto"
    );


knop.disabled = true;


knop.innerHTML =
    "⏳ Bezig met uploaden...";



const plaat =
    window.geselecteerdePlaat;



if(!plaat){


alert(
"Geen plaat geselecteerd"
);


knop.disabled=false;

knop.innerHTML="✔ Opslaan";


return;


}


if(huidigCaseType === "productie"){
    await slaProductieCaseOp(knop, plaat);
}else{
    await slaLeverancierCaseOp(knop, plaat);
}

});


// ============================================
// Case type: productie (detail + overzichtsfoto)
// ============================================

async function slaProductieCaseOp(knop, plaat){

if(
!geselecteerdeDetailFoto &&
!geselecteerdeOverzichtFoto
){


alert(
"Kies eerst een foto"
);


knop.disabled=false;

knop.innerHTML="✔ Opslaan";


return;


}




const titel =
document
.getElementById("fotoTitel")
.value
.trim()
|| "Geen titel";



const beschrijving =
document
.getElementById("fotoBeschrijving")
.value
.trim()
|| "Geen opmerking";





const {data:userData} =
await supabaseClient
.auth
.getUser();



const gebruiker =
userData.user
?
userData.user.email
:
"onbekend";





let detailPad = null;

let overzichtPad = null;




// ============================================
// Detail upload
// ============================================


if(geselecteerdeDetailFoto){


const foto =
await verkleinFoto(
    geselecteerdeDetailFoto
);



detailPad =
`${plaat.code}/${Date.now()}_detail_${foto.name}`;



const {error} =
await supabaseClient
.storage
.from("plaatfotos")
.upload(
detailPad,
foto
);



if(error){

alert(
"Detailfoto upload mislukt"
);

console.error(error);

knop.disabled=false;

knop.innerHTML="✔ Opslaan";

return;

}


}





// ============================================
// Overzicht upload
// ============================================


if(geselecteerdeOverzichtFoto){


const foto =
await verkleinFoto(
    geselecteerdeOverzichtFoto
);



overzichtPad =
`${plaat.code}/${Date.now()}_overzicht_${foto.name}`;



const {error} =
await supabaseClient
.storage
.from("plaatfotos")
.upload(
overzichtPad,
foto
);



if(error){

alert(
"Overzichtsfoto upload mislukt"
);

console.error(error);

knop.disabled=false;

knop.innerHTML="✔ Opslaan";

return;

}


}





// ============================================
// Eén CASE opslaan
// ============================================


const {error} =
await supabaseClient
.from("eigen_data")
.insert({

    code:
        plaat.code,

    type:
        "productie",

    omschrijving:
        `${titel}\n${beschrijving}`,

    foto:
        detailPad,

    overzicht_foto:
        overzichtPad,

    toegevoegd_door:
        gebruiker,

    datum:
        new Date().toISOString()

});




if(error){


console.error(error);


alert(
"Case opslaan mislukt"
);


knop.disabled=false;

knop.innerHTML="✔ Opslaan";


return;


}





knop.innerHTML =
"✅ Opgeslagen";



setTimeout(()=>{


location.reload();


},1200);

}


// ============================================
// Case type: leverancier (meerdere foto's + bon)
// ============================================

async function slaLeverancierCaseOp(knop, plaat){

    if(geselecteerdeLeverancierFotos.length === 0){
        alert("Kies minstens één foto van de fout.");
        knop.disabled = false;
        knop.innerHTML = "✔ Opslaan";
        return;
    }

    const titel =
        document.getElementById("fotoTitel").value.trim() || "Geen titel";

    const beschrijving =
        document.getElementById("fotoBeschrijving").value.trim() || "Geen opmerking";

    const {data:userData} =
        await supabaseClient.auth.getUser();

    const gebruiker =
        userData.user ? userData.user.email : "onbekend";

    const fotoPaden = [];

    for(let i = 0; i < geselecteerdeLeverancierFotos.length; i++){

        knop.innerHTML = `⏳ Foto ${i + 1}/${geselecteerdeLeverancierFotos.length} uploaden...`;

        const foto = await verkleinFoto(geselecteerdeLeverancierFotos[i]);
        const pad = `${plaat.code}/${Date.now()}_leverancier_${i}_${foto.name}`;

        const {error} =
            await supabaseClient.storage.from("plaatfotos").upload(pad, foto);

        if(error){
            console.error(error);
            alert(`Upload van foto ${i + 1} mislukt.`);
            knop.disabled = false;
            knop.innerHTML = "✔ Opslaan";
            return;
        }

        fotoPaden.push(pad);

    }

    let bonPad = null;

    if(geselecteerdeLeverancierBon){

        knop.innerHTML = "⏳ Bon uploaden...";

        bonPad = `bonnen/${plaat.code}/${Date.now()}_${geselecteerdeLeverancierBon.name}`;

        const {error} =
            await supabaseClient.storage
                .from("plaatfotos")
                .upload(bonPad, geselecteerdeLeverancierBon);

        if(error){
            console.error(error);
            alert("Upload van de leveranciersbon mislukt. De foto's zijn wel al opgeslagen.");
            bonPad = null;
        }

    }

    knop.innerHTML = "⏳ Case opslaan...";

    const {error} =
        await supabaseClient.from("eigen_data").insert({
            code: plaat.code,
            type: "leverancier",
            omschrijving: `${titel}\n${beschrijving}`,
            foto: null,
            overzicht_foto: null,
            fotos: fotoPaden,
            leveranciersbon_url: bonPad,
            toegevoegd_door: gebruiker,
            datum: new Date().toISOString()
        });

    if(error){
        console.error(error);
        alert("Case opslaan mislukt");
        knop.disabled = false;
        knop.innerHTML = "✔ Opslaan";
        return;
    }

    knop.innerHTML = "✅ Opgeslagen";

    setTimeout(() => {
        location.reload();
    }, 1200);

}
