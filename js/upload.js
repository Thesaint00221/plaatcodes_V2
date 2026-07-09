// ============================================
// upload.js
// Foto optimalisatie versie
// DEEL 1
// ============================================

const fotoKnop = document.getElementById("fotoToevoegen");
const fotoFormulier = document.getElementById("fotoFormulier");


fotoKnop?.addEventListener("click", () => {

    fotoFormulier.classList.toggle("verborgen");

});



// ============================================
// Foto verkleinen
// maximum 2000px
// ============================================

function verkleinFoto(bestand) {

    return new Promise((resolve) => {

        const img = new Image();

        const reader = new FileReader();


        reader.onload = (e) => {

            img.onload = () => {


                let breedte = img.width;
                let hoogte = img.height;


                const maximum = 2000;


                if (breedte > maximum || hoogte > maximum) {


                    if (breedte > hoogte) {

                        hoogte =
                            hoogte *
                            (maximum / breedte);

                        breedte = maximum;

                    } else {

                        breedte =
                            breedte *
                            (maximum / hoogte);

                        hoogte = maximum;

                    }

                }



                const canvas =
                    document.createElement("canvas");


                canvas.width = breedte;
                canvas.height = hoogte;


                const ctx =
                    canvas.getContext("2d");


                ctx.drawImage(
                    img,
                    0,
                    0,
                    breedte,
                    hoogte
                );



                canvas.toBlob(
                    (blob) => {

                        const nieuweNaam =
                            bestand.name
                            .replace(
                                /\.[^/.]+$/,
                                ""
                            )
                            + ".jpg";


                        resolve(
                            new File(
                                [blob],
                                nieuweNaam,
                                {
                                    type: "image/jpeg"
                                }
                            )
                        );

                    },
                    "image/jpeg",
                    0.8
                );


            };


            img.src = e.target.result;

        };


        reader.readAsDataURL(bestand);


    });

}
// ============================================
// Upload en opslaan
// DEEL 2
// ============================================


document
.getElementById("opslaanFoto")
?.addEventListener("click", async () => {


    const plaat = window.geselecteerdePlaat;


    if (!plaat) {

        alert("Geen plaat geselecteerd");
        return;

    }



    const origineleFoto =
        document
        .getElementById("fotoBestand")
        .files[0];



    if (!origineleFoto) {

        alert("Kies eerst een foto");
        return;

    }



    // Foto verkleinen

    const bestand =
        await verkleinFoto(
            origineleFoto
        );



    const categorie =
        document
        .getElementById("categorie")
        .value;



    const titel =
        document
        .getElementById("fotoTitel")
        .value
        .trim();



    const beschrijving =
        document
        .getElementById("fotoBeschrijving")
        .value
        .trim();




    const bestandsnaam =
        `${plaat.code}/${Date.now()}_${bestand.name}`;



    // Upload naar Storage

    const { error: uploadError } =
        await supabaseClient
        .storage
        .from("plaatfotos")
        .upload(
            bestandsnaam,
            bestand
        );



    if (uploadError) {


        console.error(
            "UPLOAD ERROR:",
            uploadError
        );


        alert(
            "Upload mislukt:\n\n" +
            uploadError.message
        );


        return;

    }




    // gebruiker ophalen

    const { data: userData } =
        await supabaseClient.auth.getUser();



    const gebruiker =
        userData.user
        ? userData.user.email
        : "onbekend";




    // Database record

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


        console.error(
            error
        );


        alert(
            "Opslaan mislukt"
        );


        return;

    }




    alert(
        "Foto toegevoegd!"
    );


    location.reload();


});
