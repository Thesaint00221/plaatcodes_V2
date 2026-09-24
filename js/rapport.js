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

// Haalt de natuurlijke afmetingen van een data-URL op, nodig om foto's
// verhoudingsgetrouw in een vast rastervakje te passen.
function laadAfbeeldingAfmetingen(dataUrl){
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({breedte: img.naturalWidth, hoogte: img.naturalHeight});
        img.onerror = () => reject(new Error("Afbeelding kon niet gelezen worden."));
        img.src = dataUrl;
    });
}

async function downloadBestaandRapport(pad, naam, knop){
    try{
        if(knop) knop.disabled = true;
        const url = haalOpenbareUrl(pad);
        const response = await fetch(url);
        if(!response.ok) throw new Error("Rapport niet gevonden");
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = naam;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }catch(error){
        console.error("Bestaand rapport downloaden mislukt:", error);
        alert("Het opgeslagen rapport kon niet worden gedownload.");
    }finally{
        if(knop) knop.disabled = false;
    }
}

async function slaLeveranciersRapportOp(caseId, bytes, bestandsnaam){
    const pad = `rapporten/leveranciersklachten/${caseId}.pdf`;
    const blob = new Blob([bytes], {type:"application/pdf"});
    const upload = await supabaseClient.storage.from("plaatfotos").upload(pad, blob, {
        upsert:true,
        contentType:"application/pdf"
    });
    if(upload.error) throw upload.error;

    const {data:userData} = await supabaseClient.auth.getUser();
    const gebruiker = userData.user?.email || "onbekend";

    const {error} = await supabaseClient
        .from("eigen_data")
        .update({
            rapport_url: pad,
            rapport_aangemaakt_door: gebruiker,
            rapport_aangemaakt_op: new Date().toISOString()
        })
        .eq("id", caseId);

    if(error) throw error;

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = bestandsnaam;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
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

        const logoDataUrl = await fotoAlsDataUrl("images/logo-detremmerie.png");

        if(logoDataUrl){
            const logoBreedte = 40;
            const logoHoogte = logoBreedte * (424 / 1494);
            doc.addImage(logoDataUrl, "PNG", marge, y, logoBreedte, logoHoogte);
            y += logoHoogte + 10;
        }

        doc.setFontSize(18);
        doc.text("Rapport leveranciersklacht", marge, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gegenereerd op ${new Date().toLocaleDateString("nl-BE")}`, marge, y);
        y += 10;
        doc.setTextColor(0);

        doc.setFontSize(12);

        const info = [
            ["Plaat", plaat.naam],
            ["Referentie", plaat.info?.Referentie || "-"],
            ["Leverancier", plaat.leverancier],
            ["Kleurnummer", plaat.info?.Kleurnummer || "-"],
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

            const tussenruimte = 8;
            const fotoBreedte = paginaBreedte - marge * 2;
            const fotoHoogte = 85; // ongeveer 1/3 van een A4-pagina

            for(const url of fotoUrls){

                nieuwePaginaIndienNodig(fotoHoogte + tussenruimte);

                const x = marge;

                doc.setDrawColor(219, 227, 236);
                doc.rect(x, y, fotoBreedte, fotoHoogte);

                const dataUrl = await fotoAlsDataUrl(url);

                if(dataUrl){

                    try{

                        const {breedte: natBreedte, hoogte: natHoogte} =
                            await laadAfbeeldingAfmetingen(dataUrl);

                        const schaal = Math.min(fotoBreedte / natBreedte, fotoHoogte / natHoogte);
                        const afbBreedte = natBreedte * schaal;
                        const afbHoogte = natHoogte * schaal;
                        const offsetX = x + (fotoBreedte - afbBreedte) / 2;
                        const offsetY = y + (fotoHoogte - afbHoogte) / 2;

                        doc.addImage(dataUrl, "JPEG", offsetX, offsetY, afbBreedte, afbHoogte);

                    }catch(fout){
                        console.error("Foto invoegen in PDF mislukt:", fout);
                        doc.textWithLink(url, x + 3, y + fotoHoogte / 2, {url});
                    }

                }else{

                    doc.textWithLink(url, x + 3, y + fotoHoogte / 2, {url});

                }

                y += fotoHoogte + tussenruimte;
            }

        }

        const bestandsnaam = `Rapport-leveranciersklacht_${plaat.code}.pdf`;
        let eindBytes = doc.output("arraybuffer");

        if(bonBytes){
            if(knop) knop.innerHTML = "⏳ Bon samenvoegen...";
            try{
                const PDFLib = await laadPdfLib();
                const samengevoegd = await PDFLib.PDFDocument.create();
                const reportDoc = await PDFLib.PDFDocument.load(eindBytes);
                const reportPaginas = await samengevoegd.copyPages(reportDoc, reportDoc.getPageIndices());
                reportPaginas.forEach(pagina => samengevoegd.addPage(pagina));

                const bonDoc = await PDFLib.PDFDocument.load(bonBytes);
                const bonPaginas = await samengevoegd.copyPages(bonDoc, bonDoc.getPageIndices());
                bonPaginas.forEach(pagina => samengevoegd.addPage(pagina));
                eindBytes = await samengevoegd.save();
            }catch(samenvoegFout){
                console.error("Bon samenvoegen mislukt:", samenvoegFout);
            }
        }

        if(knop) knop.innerHTML = "⏳ Rapport opslaan...";
        await slaLeveranciersRapportOp(caseId, eindBytes, bestandsnaam);

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
