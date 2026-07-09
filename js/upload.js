// ============================================
// upload.js
// ============================================


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



    // upload naar Supabase Storage

    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("plaatfotos")
            .upload(
                bestandsnaam,
                bestand
            );


    if (uploadError) {

        console.error(uploadError);
        alert("Upload mislukt");
        return;

    }



    const { data:urlData } =
        supabaseClient
            .storage
            .from("plaatfotos")
            .getPublicUrl(bestandsnaam);



    const fotoUrl = urlData.publicUrl;



    // record opslaan

    const { error } =
        await supabaseClient
            .from("eigen_data")
            .insert({

                code: plaat.code,
                type: categorie,
                omschrijving:
                    `${titel}\n${beschrijving}`,
                foto: fotoUrl

            });



    if (error) {

        console.error(error);
        alert("Opslaan mislukt");
        return;

    }


    alert("Foto toegevoegd!");

    location.reload();

});
