// ============================================
// beheer.js
// ============================================


async function controleerBeheerder(){


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



return true;


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



if(!item.metadata){


const sub =
await haalAlleBestanden(pad);


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







async function controleerOpslag(){


const toegang =
await controleerBeheerder();



if(!toegang){
return;
}



const bestanden =
await haalAlleBestanden();



const {data:cases} =
await supabaseClient
.from("eigen_data")
.select(
"foto, overzicht_foto"
);



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
foto =>
!gebruikt.includes(foto)
&&
!foto.includes(
".emptyFolderPlaceholder"
)
);




document.getElementById(
"beheerStatus"
).innerHTML = `


<h2>
Opslagcontrole
</h2>


<p>
📸 Bestanden in opslag:
${bestanden.length}
</p>


<p>
⚠️ Ongebruikte foto's:
${ongebruikt.length}
</p>


`;



console.log(
"Ongebruikte foto's:",
ongebruikt
);



}



controleerOpslag();
