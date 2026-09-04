// ============================================
// rapport.js
// Klachtenrapport-PDF voor leverancier-cases
// jsPDF wordt pas geladen bij het eerste gebruik (niet standaard meegeladen)
// ============================================

let jsPdfGeladen = null;

function laadJsPdf(){

    if(jsPdfGeladen){
        return jsPdfGeladen;
    }

    jsPdfGeladen = new Promise((resolve, reject) => {

        if(window.jspdf){
            resolve(window.jspdf);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";
        script.onload = () => resolve(window.jspdf);
        script.onerror = () => reject(new Error("jsPDF kon niet geladen worden."));

        document.head.appendChild(script);

    });

    return jsPdfGeladen;

}

// Probeert een foto als data-URL op te halen om in te bedden in de PDF.
// Lukt dit niet (bv. CORS-beperking op de storage-bucket), dan wordt de
// foto overgeslagen en komt enkel de link in het rapport te staan --
// zo blijft het rapport hoe dan ook bruikbaar.
async function fotoAlsDataUrl(url){

    try{

        const response = await fetch(url);
        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    }catch(error){

        console.error("Foto laden voor rapport mislukt:", url, error);
        return null;

    }

}

async function genereerKlachtenRapport(caseId, knop){

    const item = window.laatstGeladenCases?.[caseId];
    const plaat = window.geselecteerdePlaat;

    if(!item || !plaat){
        alert("Kon de case-gegevens niet vinden.");
        return;
    }

    const oorspronkelijkeTekst = knop ? knop.innerHTML : "";

    if(knop){
        knop.disabled = true;
        knop.innerHTML = "⏳ Rapport maken...";
    }

    try{

        const {jsPDF} = await laadJsPdf();
        const doc = new jsPDF();

        const marge = 15;
        let y = marge;
        const paginaHoogte = doc.internal.pageSize.getHeight();
        const paginaBreedte = doc.internal.pageSize.getWidth();

        const nieuwePaginaIndienNodig = (hoogteNodig) => {
            if(y + hoogteNodig > paginaHoogte - marge){
                doc.addPage();
                y = marge;
            }
        };

        doc.setFontSize(18);
        doc.text("Klachtenrapport - fout van leverancier", marge, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gegenereerd op ${new Date().toLocaleDateString("nl-BE")}`, marge, y);
        y += 10;
        doc.setTextColor(0);

        doc.setFontSize(12);

        const info = [
            ["Plaat", plaat.naam],
            ["Code", plaat.code],
            ["Leverancier", plaat.leverancier],
            ["Referentie", plaat.info?.Referentie || "-"],
            ["Kleur", plaat.info?.Kleur || "-"],
            ["Datum case", item.datum ? new Date(item.datum).toLocaleDateString("nl-BE") : "-"],
            ["Toegevoegd door", gebruikersNaam(item.toegevoegd_door)]
        ];

        info.forEach(([label, waarde]) => {
            nieuwePaginaIndienNodig(7);
            doc.setFont(undefined, "bold");
            doc.text(`${label}:`, marge, y);
            doc.setFont(undefined, "normal");
            doc.text(String(waarde), marge + 45, y);
            y += 7;
        });

        y += 3;

        const [titel, ...beschrijvingRegels] = (item.omschrijving || "").split("\n");

        nieuwePaginaIndienNodig(10);
        doc.setFont(undefined, "bold");
        doc.text("Titel:", marge, y);
        doc.setFont(undefined, "normal");
        doc.text(titel || "-", marge + 45, y);
        y += 7;

        const beschrijving = beschrijvingRegels.join(" ").trim();

        if(beschrijving){

            nieuwePaginaIndienNodig(10);
            doc.setFont(undefined, "bold");
            doc.text("Opmerking:", marge, y);
            y += 6;
            doc.setFont(undefined, "normal");

            const regels = doc.splitTextToSize(beschrijving, paginaBreedte - marge * 2);

            regels.forEach(regel => {
                nieuwePaginaIndienNodig(6);
                doc.text(regel, marge, y);
                y += 6;
            });

        }

        y += 5;

        if(item.leveranciersbon_url){

            nieuwePaginaIndienNodig(10);
            doc.setFont(undefined, "bold");
            doc.text("Leveranciersbon:", marge, y);
            doc.setFont(undefined, "normal");

            const bonUrl = haalOpenbareUrl(item.leveranciersbon_url);
            doc.textWithLink("Bekijk de bon online", marge + 45, y, {url: bonUrl});
            y += 10;

        }

        const fotoUrls = (item.fotos || [])
            .map(pad => haalOpenbareUrl(pad))
            .filter(Boolean);

        if(fotoUrls.length){

            nieuwePaginaIndienNodig(10);
            doc.setFont(undefined, "bold");
            doc.text("Foto's:", marge, y);
            y += 8;
            doc.setFont(undefined, "normal");

            for(const url of fotoUrls){

                const dataUrl = await fotoAlsDataUrl(url);

                if(dataUrl){

                    const afbeeldingBreedte = 80;
                    const afbeeldingHoogte = 60;

                    nieuwePaginaIndienNodig(afbeeldingHoogte + 10);

                    try{
                        doc.addImage(dataUrl, "JPEG", marge, y, afbeeldingBreedte, afbeeldingHoogte);
                    }catch(fout){
                        console.error("Foto invoegen in PDF mislukt:", fout);
                        doc.textWithLink(url, marge, y + 5, {url});
                    }

                    y += afbeeldingHoogte + 8;

                }else{

                    nieuwePaginaIndienNodig(8);
                    doc.textWithLink(url, marge, y, {url});
                    y += 8;

                }

            }

        }

        const bestandsnaam = `Klachtenrapport_${plaat.code}_${Date.now()}.pdf`;
        doc.save(bestandsnaam);

    }catch(fout){

        console.error(fout);
        alert("Rapport maken is mislukt. Probeer het opnieuw.");

    }finally{

        if(knop){
            knop.disabled = false;
            knop.innerHTML = oorspronkelijkeTekst;
        }

    }

}
