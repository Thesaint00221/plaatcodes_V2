document
.getElementById("opschonenButton")
?.addEventListener(
"click",
async()=>{


alert(
"Opschonen wordt gestart..."
);


const {data: bestanden,error} =
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

console.error(error);

return;

}


console.log(
"Bestanden:",
bestanden
);


});
