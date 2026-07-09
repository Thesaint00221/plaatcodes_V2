
// ============================================
// upload.js
// Meerdere foto's versie
// Foto 1 = Detail
// Foto 2 = Overzicht
// Automatisch verkleinen
// DEEL 1
// ============================================


const fotoKnop =
    document.getElementById("fotoToevoegen");


const fotoFormulier =
    document.getElementById("fotoFormulier");



fotoKnop?.addEventListener("click", () => {

    fotoFormulier.classList.toggle("verborgen");

});




// ============================================
// Foto verkleinen
// Maximum 2000 pixels
// ============================================


function verkleinFoto(bestand) {

    return new Promise((resolve) => {


        const img =
            new Image();


        const reader =
            new FileReader();



        reader.onload = (e) => {


            img.onload = () => {


                let breedte =
                    img.width;


                let hoogte =
                    img.height;



                const maximum =
                    2000;



                if (
                    breedte > maximum ||
                    hoogte > maximum
                ) {


                    if (breedte > hoogte) {


                        hoogte =
                            hoogte *
                            (maximum / breedte);


                        breedte =
                            maximum;


                    } else {


                        breedte =
                            breedte *
                            (maximum / hoogte);


                        hoogte =
                            maximum;


                    }

                }




                const canvas =
                    document.createElement(
                        "canvas"
                    );


                canvas.width =
                    breedte;


                canvas.height =
                    hoogte;




                const ctx =
                    canvas.getContext(
                        "2d"
                    );



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
                                    type:
                                    "image/jpeg"
                                }

                            )

                        );


                    },


                    "image/jpeg",


                    0.8

                );



            };



            img.src =
                e.target.result;



        };



        reader.readAsDataURL(bestand);



    });

}
// ============================================
// Upload foto's
// Foto 1 = Detail
// Foto 2 = Overzicht
// ============================================


document
.getElementById("opslaanFoto")
?.addEventListener("click", async () => {



    const plaat =
        window.geselecteerdePlaat;



    if (!plaat) {

        alert("Geen plaat geselecteerd");

        return;

    }



    const bestanden =
        document
        .getElementById("fotoBestand")
        .files;



    if (!bestanden.length) {

        alert("Kies eerst een foto");

        return;

    }




    if (bestanden.length > 2) {


        alert(
            "Je mag maximaal 2 foto's toevoegen.\n\nFoto 1 = Detail\nFoto 2 = Overzicht"
        );


        return;

    }




const titel =
    document.getElementById("fotoTitel")
    ? document.getElementById("fotoTitel").value.trim()
    : "";


const beschrijving =
    document.getElementById("fotoBeschrijving")
    ? document.getElementById("fotoBeschrijving").value.trim()
    : "";





    // gebruiker ophalen

    const { data: userData } =
        await supabaseClient
        .auth
        .getUser();



    const gebruiker =
        userData.user
        ? userData.user.email
        : "onbekend";






    for (
        let i = 0;
        i < bestanden.length;
        i++
    ) {



        // Foto verkleinen

        const bestand =
            await verkleinFoto(
                bestanden[i]
            );




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
                uploadError
            );


            alert(
                "Upload mislukt:\n\n" +
                uploadError.message
            );


            return;

        }





        // Automatisch type bepalen

        const type =
            i === 0
            ? "Detail"
            : "Overzicht";






        // Opslaan database

        const { error } =
            await supabaseClient
            .from("eigen_data")
            .insert({


                code:
                    plaat.code,


                type:
                    type,


                omschrijving:
                    `${titel}\n${beschrijving}`,



                foto:
                    bestandsnaam,



                toegevoegd_door:
                    gebruiker


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



    }




    alert(
        "Foto('s) toegevoegd!"
    );



    location.reload();



});
