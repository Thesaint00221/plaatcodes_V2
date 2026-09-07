// ============================================
// rapport.js
// Klachtenrapport-PDF voor leverancier-cases
// jsPDF + pdf-lib worden pas geladen bij het eerste gebruik
// (niet standaard meegeladen op elke pagina)
// ============================================

let jsPdfGeladen = null;
let pdfLibGeladen = null;

function laadScript(src){
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Kon script niet laden: ${src}`));
        document.head.appendChild(script);
    });
}

function laadJsPdf(){

    if(jsPdfGeladen){
        return jsPdfGeladen;
    }

    jsPdfGeladen = window.jspdf
        ? Promise.resolve(window.jspdf)
        : laadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js")
            .then(() => window.jspdf);

    return jsPdfGeladen;

}

// pdf-lib wordt enkel gebruikt om de bon-PDF als extra pagina's achteraan
// het rapport te plakken (echte samenvoeging, geen los linkje meer).
function laadPdfLib(){

    if(pdfLibGeladen){
        return pdfLibGeladen;
    }

    pdfLibGeladen = window.PDFLib
        ? Promise.resolve(window.PDFLib)
        : laadScript("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js")
            .then(() => window.PDFLib);

    return pdfLibGeladen;

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

// Haalt de bon-PDF als ruwe bytes op, nodig om ze in het rapport te
// plakken. Lukt dit niet (CORS, bestand weg, ...), dan geven we null
// terug en valt het rapport terug op een klikbare link naar de bon.
async function bonAlsBytes(url){

    try{

        const response = await fetch(url);

        if(!response.ok){
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.arrayBuffer();

    }catch(error){

        console.error("Leveranciersbon ophalen voor rapport mislukt:", url, error);
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

        const bonUrl = item.leveranciersbon_url
            ? haalOpenbareUrl(item.leveranciersbon_url)
            : null;

        // Bon-bytes vooraf ophalen: zo weten we, vóór we de tekstpagina
        // schrijven, of de bon effectief ingevoegd kan worden of dat we
        // moeten terugvallen op een link.
        let bonBytes = null;

        if(bonUrl){
            if(knop){
                knop.innerHTML = "⏳ Bon ophalen...";
            }
            bonBytes = await bonAlsBytes(bonUrl);
        }

        if(knop){
            knop.innerHTML = "⏳ Rapport maken...";
        }

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

        if(bonUrl){

            nieuwePaginaIndienNodig(10);
            doc.setFont(undefined, "bold");
            doc.text("Leveranciersbon:", marge, y);
            doc.setFont(undefined, "normal");

            if(bonBytes){
                doc.text("zie bijlage (laatste pagina's van dit document)", marge + 45, y);
            }else{
                doc.textWithLink("Bekijk de bon online", marge + 45, y, {url: bonUrl});
            }

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

        if(!bonBytes){

            // Geen bon om samen te voegen: gewoon het rapport downloaden.
            doc.save(bestandsnaam);

        }else{

            // Bon-PDF echt samenvoegen als extra pagina's achteraan het
            // rapport, i.p.v. enkel een link te plaatsen.
            if(knop){
                knop.innerHTML = "⏳ Bon samenvoegen...";
            }

            try{

                const PDFLib = await laadPdfLib();
                const reportBytes = doc.output("arraybuffer");

                const samengevoegd = await PDFLib.PDFDocument.create();

                const reportDoc = await PDFLib.PDFDocument.load(reportBytes);
                const reportPaginas = await samengevoegd.copyPages(reportDoc, reportDoc.getPageIndices());
                reportPaginas.forEach(pagina => samengevoegd.addPage(pagina));

                const bonDoc = await PDFLib.PDFDocument.load(bonBytes);
                const bonPaginas = await samengevoegd.copyPages(bonDoc, bonDoc.getPageIndices());
                bonPaginas.forEach(pagina => samengevoegd.addPage(pagina));

                const samengevoegdeBytes = await samengevoegd.save();

                const blob = new Blob([samengevoegdeBytes], {type: "application/pdf"});
                const url = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = bestandsnaam;
                document.body.appendChild(link);
                link.click();
                link.remove();

                URL.revokeObjectURL(url);

            }catch(samenvoegFout){

                // De bon kon niet samengevoegd worden (bv. geen geldige
                // PDF) -- dan valt het rapport terug op het gewone
                // jsPDF-bestand zonder bijlage, met de link als fallback.
                console.error("Bon samenvoegen mislukt:", samenvoegFout);
                doc.save(bestandsnaam);

            }

        }

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
