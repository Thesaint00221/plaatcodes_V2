// ============================================
// upload.js
// Eén case met detail + overzichtsfoto
// ============================================


let geselecteerdeDetailFoto = null;
let geselecteerdeOverzichtFoto = null;



const detailKnop =
    document.getElementById("detailKnop");


const overzichtKnop =
    document.getElementById("overzichtKnop");


const detailBestand =
    document.getElementById("detailBestand");


const overzichtBestand =
    document.getElementById("overzichtBestand");




// ============================================
// Foto selectie
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
        "Case",

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



});
