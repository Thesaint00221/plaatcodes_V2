// ============================================
// foto.js
// Gedeelde fotoverkleiner voor alle foto-uploads.
// Gebruikt door: upload.js, platen-beheer.js en aankoopklachten.js
// ============================================

const FOTO_MAX_AFMETING = 2000;
const FOTO_KWALITEIT = 0.82;

async function verkleinFoto(bestand){

    if(!bestand || !bestand.type?.startsWith("image/")){
        throw new Error("Selecteer een geldig afbeeldingsbestand.");
    }

    let afbeelding = null;
    let tijdelijkeUrl = null;

    try{
        // Moderne browsers verwerken hiermee ook de foto-oriëntatie.
        if("createImageBitmap" in window){
            try{
                afbeelding = await createImageBitmap(bestand, {
                    imageOrientation: "from-image"
                });
            }catch(error){
                afbeelding = null;
            }
        }

        // Terugval voor browsers zonder createImageBitmap.
        if(!afbeelding){
            tijdelijkeUrl = URL.createObjectURL(bestand);
            afbeelding = await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("Afbeelding kon niet geladen worden."));
                img.src = tijdelijkeUrl;
            });
        }

        let breedte = afbeelding.width;
        let hoogte = afbeelding.height;

        if(!breedte || !hoogte){
            throw new Error("De afmetingen van de afbeelding zijn ongeldig.");
        }

        const schaal = Math.min(1, FOTO_MAX_AFMETING / Math.max(breedte, hoogte));
        breedte = Math.max(1, Math.round(breedte * schaal));
        hoogte = Math.max(1, Math.round(hoogte * schaal));

        const canvas = document.createElement("canvas");
        canvas.width = breedte;
        canvas.height = hoogte;

        const context = canvas.getContext("2d");
        if(!context){
            throw new Error("Fotoverwerking wordt niet ondersteund door deze browser.");
        }

        // Witte achtergrond voorkomt zwarte vlakken bij transparante afbeeldingen.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, breedte, hoogte);
        context.drawImage(afbeelding, 0, 0, breedte, hoogte);

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(resultaat => {
                if(resultaat) resolve(resultaat);
                else reject(new Error("Foto kon niet gecomprimeerd worden."));
            }, "image/jpeg", FOTO_KWALITEIT);
        });

        const basisnaam = bestand.name.replace(/\.[^/.]+$/, "") || "foto";
        return new File([blob], basisnaam + ".jpg", {
            type: "image/jpeg",
            lastModified: Date.now()
        });

    }finally{
        if(afbeelding && typeof afbeelding.close === "function"){
            afbeelding.close();
        }
        if(tijdelijkeUrl){
            URL.revokeObjectURL(tijdelijkeUrl);
        }
    }
}
