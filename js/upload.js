// ============================================
// upload.js
// ============================================

const fotoKnop = document.getElementById("fotoToevoegen");
const fotoFormulier = document.getElementById("fotoFormulier");


fotoKnop?.addEventListener("click", () => {

    fotoFormulier.classList.toggle("verborgen");

});



document
.getElementById("opslaanFoto")
?.addEventListener("click", async () => {


    const plaat = window.geselecteerdePlaat;


    if (!plaat) {
        alert("Geen plaat geselecteerd");
        return;
    }


    const bestand =
        document.getElementById("fotoBestand").files[0];


    if (!bestand) {
        alert("Kies eerst een foto");
        return;
    }


    const categorie =
        document.getElementById("categorie").value;


    const titel =
        document.getElementById("fotoTitel").value;


    const beschrijving =
        document.getElementById("fotoBeschrijving").value;



    const bestandsnaam =
        `${plaat.code}/${Date.now()}_${bestand.name}`;



    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("plaatfotos")
            .upload(
                bestandsnaam,
                bestand
            );


if (uploadError) {

    console.error("UPLOAD ERROR:", uploadError);

    alert(
        "Upload mislukt:\n\n" +
        uploadError.message
    );

    return;

}



    const { data:urlData } =
        supabaseClient
            .storage
            .from("plaatfotos")
            .getPublicUrl(bestandsnaam);



    const fotoUrl = urlData.publicUrl;



// huidige gebruiker ophalen

const { data: userData } =
    await supabaseClient.auth.getUser();


const gebruiker =
    userData.user
        ? userData.user.email
        : "onbekend";


// record opslaan

const { error } =
    await supabaseClient
        .from("eigen_data")
        .insert({

            code: plaat.code,
            type: categorie,
            omschrijving:
                `${titel}\n${beschrijving}`,
            foto: fotoUrl,
            toegevoegd_door: gebruiker

        });

    if (error) {

        console.error(error);
        alert("Opslaan mislukt");
        return;

    }


    alert("Foto toegevoegd!");

    location.reload();

});
