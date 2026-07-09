// ============================================
// upload.js
// ============================================

let huidigePlaat = null;


function startFotoToevoegen(plaat) {
    huidigePlaat = plaat;

    document
        .getElementById("fotoFormulier")
        .classList.remove("verborgen");
}


document
    .getElementById("fotoToevoegen")
    ?.addEventListener("click", () => {

        document
            .getElementById("fotoFormulier")
            .classList.toggle("verborgen");

    });


document
    .getElementById("opslaanFoto")
    ?.addEventListener("click", async () => {

        if (!huidigePlaat) {
            alert("Geen plaat geselecteerd");
            return;
        }

        const bestand =
            document.getElementById("fotoBestand").files[0];

        if (!bestand) {
            alert("Selecteer eerst een foto");
            return;
        }


        const categorie =
            document.getElementById("categorie").value;

        const titel =
            document.getElementById("fotoTitel").value;

        const beschrijving =
            document.getElementById("fotoBeschrijving").value;


        const bestandsnaam =
            `${huidigePlaat.code}_${Date.now()}_${bestand.name}`;


        // upload naar Storage

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


        const { data } =
            supabaseClient
                .storage
                .from("plaatfotos")
                .getPublicUrl(bestandsnaam);


        const fotoUrl = data.publicUrl;


        // opslaan in database

        const { error } =
            await supabaseClient
                .from("eigen_data")
                .insert({

                    code: huidigePlaat.code,
                    type: categorie,
                    omschrijving:
                        `${titel}\n${beschrijving}`,
                    foto: fotoUrl

                });


        if (error) {

            console.error(error);
            alert("Opslaan database mislukt");
            return;

        }


        alert("Foto toegevoegd!");

        location.reload();

    });
