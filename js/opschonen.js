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



        // map herkennen
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



console.log(
"Alle bestanden:",
bestanden
);



alert(
bestanden.length +
" bestanden gevonden"
);



});
