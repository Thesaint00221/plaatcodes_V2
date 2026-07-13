// ============================================
// beheer.js
// Dashboard beheerpagina
// ============================================


async function controleerToegang(){


const gebruiker =
    await laadGebruikersRol();



if(!gebruiker){


document.getElementById(
    "beheerStatus"
).innerHTML =

"❌ Geen toegang";


return false;

}



if(
    gebruiker.rol !== "beheerder"
){


document.getElementById(
    "beheerStatus"
).innerHTML =

"❌ Alleen beheerders hebben toegang";


return false;

}



document.getElementById(
    "beheerStatus"
).innerHTML =

`
Welkom ${gebruiker.naam || gebruiker.email}
`;



return true;


}





async function laadStatistieken(){



const toegang =
    await controleerToegang();



if(!toegang){
    return;
}



// aantal cases

const {count:cases} =
await supabaseClient
.from("eigen_data")
.select(
"id",
{
count:"exact",
head:true
}
);



// aantal foto's

const fotos =
await haalAlleBestanden();



document.getElementById(
"aantalCases"
).innerHTML =
cases || 0;



document.getElementById(
"aantalFotos"
).innerHTML =
fotos.length;



// aantal platen uit data.json


try{


const antwoord =
await fetch(
"data.json"
);


const platen =
await antwoord.json();



document.getElementById(
"aantalPlaten"
).innerHTML =
platen.length;


}
catch(error){


console.error(
"Platen laden mislukt:",
error
);


document.getElementById(
"aantalPlaten"
).innerHTML =
"Fout";


}





async function haalAlleBestanden(map=""){


const {data,error} =
await supabaseClient
.storage
.from("plaatfotos")
.list(
map,
{
limit:1000
}
);



if(error){

console.error(error);

return [];

}



let bestanden=[];



for(const item of data){


const pad =
map
?
`${map}/${item.name}`
:
item.name;



if(
!item.metadata
){


const sub =
await haalAlleBestanden(
pad
);


bestanden.push(
...sub
);


}
else{


bestanden.push(
pad
);


}


}



return bestanden;


}





laadStatistieken();
// ============================================
// Opslagcontrole knop
// ============================================


document
.getElementById("controleerOpslag")
?.addEventListener(
"click",
async()=>{


const veld =
document.getElementById(
"opslagControle"
);



veld.innerHTML =
"⏳ Bezig met controleren...";



const bestanden =
await haalAlleBestanden();



const {data:cases,error} =
await supabaseClient
.from("eigen_data")
.select(
"foto, overzicht_foto"
);



if(error){

console.error(error);

veld.innerHTML =
"❌ Fout bij ophalen cases";

return;

}



let gebruikt=[];



cases.forEach(item=>{


if(item.foto){

gebruikt.push(
item.foto
);

}


if(item.overzicht_foto){

gebruikt.push(
item.overzicht_foto
);

}


});



const ongebruikt =
bestanden.filter(
bestand =>
!gebruikt.includes(bestand)
&&
!bestand.includes(
".emptyFolderPlaceholder"
)
);



veld.innerHTML = `


<p>
📸 Bestanden in bucket:
<b>${bestanden.length}</b>
</p>


<p>
⚠️ Ongebruikte foto's:
<b>${ongebruikt.length}</b>
</p>


`;



console.log(
"Alle bestanden:",
bestanden
);


console.log(
"Ongebruikte foto's:",
ongebruikt
);



}
);
