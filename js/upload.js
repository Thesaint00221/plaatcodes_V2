// ============================================
// upload.js
// Detail + Overzicht foto's
// Automatisch verkleinen
// ============================================



// ============================================
// Foto formulier openen
// ============================================


const fotoFormulier =
    document.getElementById("uploadKaart");



// ============================================
// Geselecteerde foto's
// ============================================


let geselecteerdeDetailFoto = null;

let geselecteerdeOverzichtFoto = null;



const detailKnop =
    document.getElementById("detailKnop");


const overzichtKnop =
    document.getElementById("overzichtKnop");



const detailBestand =
    document.getElementById("detailBestand");


const overzichtBestand =
    document.getElementById("overzichtBestand");




// ============================================
// Detailfoto kiezen
// ============================================


detailKnop?.addEventListener(
    "click",
    () => {

        detailBestand.click();

    }
);



detailBestand?.addEventListener(
    "change",
    () => {


        geselecteerdeDetailFoto =
            detailBestand.files[0];


        if (geselecteerdeDetailFoto) {


            detailKnop.innerHTML =
            "✅ DETAILFOTO GEKOZEN";


        }

    }
);




// ============================================
// Overzichtfoto kiezen
// ============================================


overzichtKnop?.addEventListener(
    "click",
    () => {

        overzichtBestand.click();

    }
);



overzichtBestand?.addEventListener(
    "change",
    () => {


        geselecteerdeOverzichtFoto =
            overzichtBestand.files[0];


        if (geselecteerdeOverzichtFoto) {


            overzichtKnop.innerHTML =
            "✅ OVERZICHTSFOTO GEKOZEN";


        }

    }
);




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
                    document.createElement("canvas");


                canvas.width =
                    breedte;


                canvas.height =
                    hoogte;



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
// Opslaan foto's
// ============================================


document
.getElementById("opslaanFoto")
?.addEventListener(
"click",
async () => {



    const plaat =
        window.geselecteerdePlaat;



    if (!plaat) {


        alert(
            "Geen plaat geselecteerd"
        );


        return;


    }




    if (
        !geselecteerdeDetailFoto &&
        !geselecteerdeOverzichtFoto
    ) {


        alert(
            "Kies eerst een foto"
        );


        return;


    }





    const titel =
        document.getElementById("fotoTitel")
        ?.value
        .trim()
        || "";



    const beschrijving =
        document.getElementById("fotoBeschrijving")
        ?.value
        .trim()
        || "";






    const { data:userData } =
        await supabaseClient
        .auth
        .getUser();




    const gebruiker =
        userData.user
        ? userData.user.email
        : "onbekend";






    const foto's = [];



    if (geselecteerdeDetailFoto) {


        foto's.push({

            bestand:
                geselecteerdeDetailFoto,

            type:
                "Detail"

        });


    }



    if (geselecteerdeOverzichtFoto) {


        foto's.push({

            bestand:
                geselecteerdeOverzichtFoto,

            type:
                "Overzicht"

        });


    }







    for (const foto of foto's) {



        const verkleindeFoto =
            await verkleinFoto(
                foto.bestand
            );




        const bestandsnaam =
            `${plaat.code}/${Date.now()}_${verkleindeFoto.name}`;





        const { error:uploadError } =
            await supabaseClient
            .storage
            .from("plaatfotos")
            .upload(
                bestandsnaam,
                verkleindeFoto
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






        const { error } =
            await supabaseClient
            .from("eigen_data")
            .insert({


                code:
                    plaat.code,


                type:
                    foto.type,


                omschrijving:
                    `${titel}\n${beschrijving}`,


                foto:
                    bestandsnaam,


                toegevoegd_door:
                    gebruiker


            });




        if (error) {


            console.error(error);


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
