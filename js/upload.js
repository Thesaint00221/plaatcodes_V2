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
            document.getElementById("fotoTitel").value.trim();


        const beschrijving =
            document.getElementById("fotoBeschrijving").value.trim();



        // Bestand opslaan onder:
        // H161/1750000000000_foto.jpg

        const bestandsnaam =
            `${plaat.code}/${Date.now()}_${bestand.name}`;



        // Upload naar Supabase Storage

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

            alert(
                "Upload mislukt:\n\n" +
                uploadError.message
            );

            return;

        }



        // Ingelogde gebruiker ophalen

        const { data: userData } =
            await supabaseClient.auth.getUser();


        const gebruiker =
            userData.user
                ? userData.user.email
                : "onbekend";



        // Alleen het opslagpad bewaren
        // GEEN volledige URL meer!

        const { error } =
            await supabaseClient
                .from("eigen_data")
                .insert({

                    code: plaat.code,

                    type: categorie,

                    omschrijving:
                        `${titel}\n${beschrijving}`,

                    foto: bestandsnaam,

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
