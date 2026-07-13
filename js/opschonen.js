// ============================================
// OPSCHONEN STORAGE
// ============================================

document
.getElementById("opschonenButton")
?.addEventListener(
"click",
async()=>{


console.log("Opschonen gestart");


const { data: bestanden, error } =
await supabaseClient
.storage
.from("plaatfotos")
.list(
"",
{
limit:1000
}
);



if(error){

console.error(
"Fout bij ophalen bestanden:",
error
);

alert(
"Bestanden ophalen mislukt"
);

return;

}



console.log(
"Bestanden in bucket:",
bestanden
);



alert(
bestanden.length +
" bestanden gevonden. Kijk in F12 console."
);


});
