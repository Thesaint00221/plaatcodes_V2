// ============================================
// detail.js
// CASE weergave met detail + overzichtsfoto
// ============================================


window.geselecteerdePlaat = null;


const detail =
    document.getElementById("detail");


const detailContent =
    document.getElementById("detailContent");


const terug =
    document.getElementById("terug");





function toonDetail(plaat){


window.geselecteerdePlaat =
    plaat;


document.getElementById("resultaten")
.style.display="none";


document.querySelector(".search")
.style.display="none";


detail.classList.remove("hidden");



detailContent.innerHTML = `


<div class="detail-container">


<h2>${plaat.naam}</h2>


<table class="detail-table">


<tr>
<td>Code</td>
<td>${plaat.code}</td>
</tr>


<tr>
<td>Leverancier</td>
<td>${plaat.leverancier}</td>
</tr>


</table>



<div id="galerij"></div>



</div>


`;



toonFotos(plaat);



window.scrollTo({

top:0,

behavior:"smooth"

});


}






async function toonFotos(plaat){



const galerij =
document.getElementById("galerij");



galerij.innerHTML =
`
<h3>Cases & foto's</h3>
`;




// ======================================
// Basisfoto's GitHub
// ======================================


if(
plaat.photos &&
plaat.photos.length
){


plaat.photos.forEach(foto=>{


galerij.innerHTML += `


<div class="fotoKaart">


<img
src="photos/${foto}"
class="detailFoto">


<p>Basisfoto</p>


</div>


`;


});


}





// ======================================
// Cases ophalen
// ======================================


const gebruiker =
await laadGebruikersRol();




const {data,error} =
await supabaseClient
.from("eigen_data")
.select("*")
.eq(
"code",
plaat.code
)
.order(
"datum",
{
ascending:false
}
);




if(error){

console.error(error);

galerij.innerHTML +=
"<p>Fout bij laden.</p>";

return;

}




if(
!data ||
data.length===0
){


galerij.innerHTML +=
"<p>Nog geen meldingen.</p>";


return;


}





// ======================================
// Cases tonen
// ======================================


for(const item of data){



let detailUrl="";
let overzichtUrl="";




// detailfoto

if(item.foto){


if(
item.foto.startsWith("http")
){

detailUrl=item.foto;

}
else{


const {data:urlData} =
supabaseClient
.storage
.from("plaatfotos")
.getPublicUrl(
item.foto
);


detailUrl =
urlData.publicUrl;


}


}





// overzichtsfoto


if(item.overzicht_foto){


const {data:urlData} =
supabaseClient
.storage
.from("plaatfotos")
.getPublicUrl(
item.overzicht_foto
);


overzichtUrl =
urlData.publicUrl;


}




const verwijderen =
magVerwijderen(
item,
gebruiker
);




// ======================================
// CASE KAART
// ======================================


galerij.innerHTML += `


<div class="caseKaart">



<div class="caseFotos">


${
detailUrl
?
`
<img
src="${detailUrl}"
class="detailFoto">

`
:""
}



${
overzichtUrl
?
`
<img
src="${overzichtUrl}"
class="detailFoto">

`
:""
}



</div>




<h3>
${item.type || "Case"}
</h3>




<p class="omschrijving">

${

(item.omschrijving || "")
.replace(
/\n/g,
"<br>"
)

}

</p>




<small class="fotoInfo">

    👤 ${item.toegevoegd_door || ""}

    <br>

    📅 ${item.datum
        ? new Date(item.datum).toLocaleDateString("nl-BE")
        : ""}

</small>




${
verwijderen

?

`

<br>


<button

class="verwijderFoto"

onclick="
verwijderFoto(
'${item.id}',
'${item.foto}'
)
">


🗑 Verwijderen


</button>


`

:""

}



</div>


`;



}


}







function magVerwijderen(item, gebruiker){


if(!gebruiker){

return false;

}


if(
gebruiker.rol==="beheerder"
){

return true;

}


return (
item.toegevoegd_door ===
gebruiker.email
);


}






async function verwijderFoto(id, opslagPad){


if(
!confirm(
"Deze case verwijderen?"
)
){

return;

}



const {error} =
await supabaseClient
.from("eigen_data")
.delete()
.eq(
"id",
id
);



if(error){

console.error(error);

alert(
"Verwijderen mislukt"
);

return;

}



alert(
"Case verwijderd"
);



toonFotos(
window.geselecteerdePlaat
);


}







terug.addEventListener(
"click",
()=>{


detail.classList.add(
"hidden"
);


document.getElementById("resultaten")
.style.display="grid";


document.querySelector(".search")
.style.display="block";



window.scrollTo({

top:0,

behavior:"smooth"

});
// ============================================
// FOTO VERGROTEN (LIGHTBOX)
// ============================================


document.addEventListener(
"click",
(e)=>{


if(
e.target.classList.contains(
"detailFoto"
)
){


const lightbox =
document.createElement(
"div"
);


lightbox.className =
"lightbox";



lightbox.innerHTML = `

<img
src="${e.target.src}">

`;



document.body.appendChild(
lightbox
);



lightbox.addEventListener(
"click",
()=>{


lightbox.remove();


});


}


});

});
