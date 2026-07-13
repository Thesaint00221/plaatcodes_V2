// ============================================
// OPSCHONEN STORAGE
// ============================================

async function haalAlleBestanden(map = "") {

    const { data, error } =
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


    let bestanden = [];


    for(const item of data){


        const pad =
            map
            ? `${map}/${item.name}`
            : item.name;



        if(!item.metadata){

            const sub =
                await haalAlleBestanden(pad);

            bestanden.push(
                ...sub
            );

        }
        else {

            bestanden.push(pad);

        }

    }


    return bestanden;

}





document
.getElementById("opschonenButton")
?.addEventListener(
"click",
async()=>{


console.log(
"Opschonen gestart"
);



const bestanden =
    await haalAlleBestanden();



const {data: cases,error} =
await supabaseClient
.from("eigen_data")
.select(
"foto, overzicht_foto"
);



if(error){

console.error(error);

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


beheer.innerHTML += `

<div class="opschoonKaart">

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




document
.getElementById(
"verwijderOngebruikte"
)
.onclick =
async()=>{


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


alert(
"Opschonen klaar"
);


};



});
