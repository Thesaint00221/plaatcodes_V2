// ============================================
// OPSCHONEN STORAGE
// ============================================
// haalAlleBestanden() staat nu in js/opslag.js (gedeeld met beheer.js)





document
.getElementById("opschonenButton")
?.addEventListener(
"click",
async(event)=>{


const scanKnop = event.currentTarget;
const scanKnopTekst = scanKnop.innerHTML;

scanKnop.disabled = true;
scanKnop.innerHTML = "⏳ Bezig met scannen...";


console.log(
"Opschonen gestart"
);



const bestanden =
    await haalAlleBestanden();



const {data: cases,error} =
await supabaseClient
.from("eigen_data")
.select(
"foto, overzicht_foto, fotos, leveranciersbon_url"
);



if(error){

console.error(error);

scanKnop.disabled = false;
scanKnop.innerHTML = scanKnopTekst;

return;

}




let gebruikt = [];



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


// Leverancier-cases: meerdere foto's + optionele bon
(item.fotos || []).forEach(pad => {
    if(pad){
        gebruikt.push(pad);
    }
});

if(item.leveranciersbon_url){
    gebruikt.push(item.leveranciersbon_url);
}


});





const weesFotos =
bestanden.filter(
bestand =>
!gebruikt.includes(bestand)
&&
!bestand.endsWith(
".emptyFolderPlaceholder"
)
);





console.log(
"Ongebruikte foto's:",
weesFotos
);



let lijst = "";

weesFotos.forEach(
(foto,index)=>{

lijst += `
<div>
<input 
type="checkbox"
class="wisFoto"
value="${foto}"
checked>

${foto}

</div>
`;

});


const beheer =
document.getElementById(
"beheerBox"
);


// Vorig scanresultaat verwijderen zodat ze niet blijven opstapelen
document.getElementById("opschoonResultaat")?.remove();


beheer.innerHTML += `

<div id="opschoonResultaat" class="opschoonKaart">

<h3>
🧹 Ongebruikte foto's
</h3>

<p>
${weesFotos.length}
bestanden gevonden
</p>

<div id="wisLijst">

${lijst}

</div>


<button id="verwijderOngebruikte">

🗑 Verwijder geselecteerde

</button>

</div>

`;


scanKnop.disabled = false;
scanKnop.innerHTML = scanKnopTekst;




document
.getElementById(
"verwijderOngebruikte"
)
.onclick =
async(event)=>{


const geselecteerd =
[
...document.querySelectorAll(
".wisFoto:checked"
)
]
.map(
(x)=>x.value
);



if(
!confirm(
geselecteerd.length +
" bestanden verwijderen?"
)
){

return;

}


const verwijderKnop = event.currentTarget;

verwijderKnop.disabled = true;
verwijderKnop.innerHTML = "⏳ Bezig met verwijderen...";


const {data,error} =
await supabaseClient
.storage
.from("plaatfotos")
.remove(
geselecteerd
);



console.log(
"Verwijderd:",
data
);


console.log(
"Fout:",
error
);


if(error){

alert(
"Verwijderen mislukt: " + error.message
);

verwijderKnop.disabled = false;
verwijderKnop.innerHTML = "🗑 Verwijder geselecteerde";

return;

}


alert(
"Opschonen klaar"
);


document.getElementById("opschoonResultaat")?.remove();


};



});
