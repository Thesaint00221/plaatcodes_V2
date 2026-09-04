// ============================================
// foto.js
// Gedeelde fotoverkleiner
// Gebruikt door: upload.js (cases) en platen-beheer.js (nieuwe platen)
// ============================================

const FOTO_MAX_AFMETING = 2000;
const FOTO_KWALITEIT = 0.8;

function verkleinFoto(bestand) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onerror = () => {
            reject(new Error("Bestand kon niet gelezen worden."));
        };

        reader.onload = (e) => {

            const img = new Image();

            img.onerror = () => {
                reject(new Error("Afbeelding kon niet geladen worden."));
            };

            img.onload = () => {

                let breedte = img.width;
                let hoogte = img.height;

                if (breedte > FOTO_MAX_AFMETING || hoogte > FOTO_MAX_AFMETING) {

                    if (breedte > hoogte) {
                        hoogte = hoogte * (FOTO_MAX_AFMETING / breedte);
                        breedte = FOTO_MAX_AFMETING;
                    } else {
                        breedte = breedte * (FOTO_MAX_AFMETING / hoogte);
                        hoogte = FOTO_MAX_AFMETING;
                    }

                }

                const canvas = document.createElement("canvas");
                canvas.width = breedte;
                canvas.height = hoogte;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, breedte, hoogte);

                canvas.toBlob((blob) => {

                    const naam =
                        bestand.name.replace(/\.[^/.]+$/, "") + ".jpg";

                    resolve(new File([blob], naam, { type: "image/jpeg" }));

                }, "image/jpeg", FOTO_KWALITEIT);

            };

            img.src = e.target.result;

        };

        reader.readAsDataURL(bestand);

    });

}
