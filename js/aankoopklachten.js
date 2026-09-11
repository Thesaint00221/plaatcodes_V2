// ============================================
// aankoopklachten.js
// Beheer van klachten over aankoopartikelen
// ============================================

const akForm = document.getElementById("aankoopKlachtForm");
const akLijst = document.getElementById("aankoopKlachtenLijst");
const akMelding = document.getElementById("akMelding");
const akFotos = document.getElementById("akFotos");
const akBon = document.getElementById("akBon");

function akPadFoto(id, index, naam){
    return `aankoopklachten/${id}/foto_${index}_${Date.now()}_${naam}`;
}

function akPadBon(id, naam){
    return `aankoopklachten/${id}/bon_${Date.now()}_${naam}`;
}

function akUrl(pad){
    if(!pad) return null;
    return supabaseClient.storage.from("plaatfotos").getPublicUrl(pad).data.publicUrl;
}

function akEsc(waarde){
    const div = document.createElement("div");
    div.textContent = waarde ?? "";
    return div.innerHTML;
}

function akDatum(waarde){
    return waarde ? new Date(waarde).toLocaleDateString("nl-BE") : "-";
}

async function laadAankoopKlachten(){
    const {data, error} = await supabaseClient
        .from("aankoopklachten")
        .select("*")
        .order("datum", {ascending:false})
        .order("created_at", {ascending:false});

    if(error){
        console.error(error);
        akLijst.innerHTML = "<p>Klachten konden niet worden geladen.</p>";
        return;
    }

    if(!data?.length){
        akLijst.innerHTML = "<p>Nog geen aankoopklachten geregistreerd.</p>";
        return;
    }

    akLijst.innerHTML = data.map(item => {
        const fotos = Array.isArray(item.fotos) ? item.fotos : [];
        return `
            <article class="plaatCard">
                <div class="plaatInfo">
                    <h3>${akEsc(item.artikel)}</h3>
                    <p><strong>Leverancier:</strong> ${akEsc(item.leverancier)}</p>
                    <p><strong>Referentie:</strong> ${akEsc(item.referentie || "-")}</p>
                    <p><strong>Datum:</strong> ${akDatum(item.datum)} &nbsp; <strong>Aantal:</strong> ${akEsc(item.aantal ?? "-")}</p>
                    ${item.bestelnummer ? `<p><strong>Bestelnummer:</strong> ${akEsc(item.bestelnummer)}</p>` : ""}
                    <p>${akEsc(item.omschrijving)}</p>
                    ${item.gewenste_oplossing ? `<p><strong>Gewenste oplossing:</strong> ${akEsc(item.gewenste_oplossing)}</p>` : ""}
                    <p><strong>Foto's:</strong> ${fotos.length}</p>
                    <div class="plaatFormActies">
                        <button type="button" class="primary akRapport" data-id="${item.id}"><span class="icoon" data-icon="document"></span> Leveranciersrapport</button>
                        <button type="button" class="secundaireKnop akVerwijder" data-id="${item.id}"><span class="icoon" data-icon="vuilbak"></span> Verwijderen</button>
                    </div>
                </div>
            </article>`;
    }).join("");

    document.querySelectorAll(".akRapport").forEach(knop => {
        knop.addEventListener("click", () => genereerAankoopKlachtRapport(knop.dataset.id, knop));
    });

    document.querySelectorAll(".akVerwijder").forEach(knop => {
        knop.addEventListener("click", () => verwijderAankoopKlacht(knop.dataset.id));
    });
}

akForm?.addEventListener("submit", async event => {
    event.preventDefault();
    akMelding.textContent = "Bezig met opslaan...";

    const bestanden = Array.from(akFotos.files || []).slice(0, 5);
    const bon = akBon.files?.[0] || null;

    if(bon && bon.type !== "application/pdf"){
        akMelding.textContent = "De leveranciersbon moet een PDF zijn.";
        return;
    }

    const {data:userData} = await supabaseClient.auth.getUser();
    const gebruiker = userData.user?.email || "onbekend";

    const {data:item, error} = await supabaseClient
        .from("aankoopklachten")
        .insert({
            artikel: document.getElementById("akArtikel").value.trim(),
            leverancier: document.getElementById("akLeverancier").value.trim(),
            referentie: document.getElementById("akReferentie").value.trim() || null,
            datum: document.getElementById("akDatum").value,
            aantal: document.getElementById("akAantal").value || null,
            omschrijving: document.getElementById("akOmschrijving").value.trim(),
            bestelnummer: document.getElementById("akBestelnummer").value.trim() || null,
            gewenste_oplossing: document.getElementById("akOplossing").value.trim() || null,
            toegevoegd_door: gebruiker
        })
        .select()
        .single();

    if(error){
        console.error(error);
        akMelding.textContent = "Klacht opslaan mislukt.";
        return;
    }

    const fotoPaden = [];

    for(let i = 0; i < bestanden.length; i++){
        const foto = await verkleinFoto(bestanden[i]);
        const pad = akPadFoto(item.id, i + 1, foto.name);
        const upload = await supabaseClient.storage.from("plaatfotos").upload(pad, foto);

        if(upload.error){
            console.error(upload.error);
            akMelding.textContent = `Upload foto ${i + 1} mislukt.`;
            return;
        }
        fotoPaden.push(pad);
    }

    let bonPad = null;
    if(bon){
        const pad = akPadBon(item.id, bon.name);
        const upload = await supabaseClient.storage.from("plaatfotos").upload(pad, bon);
        if(upload.error){
            console.error(upload.error);
            akMelding.textContent = "Upload van de leveranciersbon mislukt.";
            return;
        }
        bonPad = pad;
    }

    const {error:updateError} = await supabaseClient
        .from("aankoopklachten")
        .update({fotos: fotoPaden, leveranciersbon_url: bonPad})
        .eq("id", item.id);

    if(updateError){
        console.error(updateError);
        akMelding.textContent = "Bestanden zijn opgeslagen, maar de klacht kon niet volledig worden afgewerkt.";
        return;
    }

    akForm.reset();
    document.getElementById("akDatum").value = new Date().toISOString().slice(0, 10);
    akMelding.textContent = "Klacht opgeslagen.";
    await laadAankoopKlachten();
});

async function verwijderAankoopKlacht(id){
    if(!confirm("Deze aankoopklacht verwijderen?")) return;

    const {data:item, error:leesError} = await supabaseClient
        .from("aankoopklachten")
        .select("fotos, leveranciersbon_url")
        .eq("id", id)
        .single();

    if(leesError){
        console.error(leesError);
        return;
    }

    const paden = [...(Array.isArray(item.fotos) ? item.fotos : [])];
    if(item.leveranciersbon_url) paden.push(item.leveranciersbon_url);
    if(paden.length) await supabaseClient.storage.from("plaatfotos").remove(paden);

    const {error} = await supabaseClient.from("aankoopklachten").delete().eq("id", id);
    if(error) console.error(error);
    await laadAankoopKlachten();
}

async function genereerAankoopKlachtRapport(id, knop){
    const {data:item, error} = await supabaseClient
        .from("aankoopklachten")
        .select("*")
        .eq("id", id)
        .single();

    if(error || !item){
        alert("Klachtgegevens konden niet worden geladen.");
        return;
    }

    const oorspronkelijk = knop.innerHTML;
    knop.disabled = true;
    knop.innerHTML = "⏳ Rapport maken...";

    try{
        const bonUrl = akUrl(item.leveranciersbon_url);
        const bonBytes = bonUrl ? await bonAlsBytes(bonUrl) : null;
        const {jsPDF} = await laadJsPdf();
        const doc = new jsPDF();
        const marge = 15;
        const paginaHoogte = doc.internal.pageSize.getHeight();
        const paginaBreedte = doc.internal.pageSize.getWidth();
        let y = marge;

        const nieuwePaginaIndienNodig = hoogte => {
            if(y + hoogte > paginaHoogte - marge){
                doc.addPage();
                y = marge;
            }
        };

        const logo = await fotoAlsDataUrl("images/logo-detremmerie.png");
        if(logo){
            const w = 40;
            doc.addImage(logo, "PNG", marge, y, w, w * (424 / 1494));
            y += w * (424 / 1494) + 10;
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
            ["Artikel", item.artikel],
            ["Leverancier", item.leverancier],
            ["Referentie", item.referentie || "-"],
            ["Datum klacht", akDatum(item.datum)],
            ["Aantal", item.aantal ?? "-"],
            ["Bestelnummer", item.bestelnummer || "-"],
            ["Toegevoegd door", item.toegevoegd_door || "-"]
        ];

        info.forEach(([label, waarde]) => {
            nieuwePaginaIndienNodig(7);
            doc.setFont(undefined, "bold");
            doc.text(`${label}:`, marge, y);
            doc.setFont(undefined, "normal");
            doc.text(String(waarde), marge + 45, y);
            y += 7;
        });

        y += 4;
        nieuwePaginaIndienNodig(10);
        doc.setFont(undefined, "bold");
        doc.text("Omschrijving klacht:", marge, y);
        y += 6;
        doc.setFont(undefined, "normal");
        doc.splitTextToSize(item.omschrijving || "-", paginaBreedte - marge * 2).forEach(regel => {
            nieuwePaginaIndienNodig(6);
            doc.text(regel, marge, y);
            y += 6;
        });

        if(item.gewenste_oplossing){
            y += 4;
            nieuwePaginaIndienNodig(10);
            doc.setFont(undefined, "bold");
            doc.text("Gewenste oplossing:", marge, y);
            y += 6;
            doc.setFont(undefined, "normal");
            doc.splitTextToSize(item.gewenste_oplossing, paginaBreedte - marge * 2).forEach(regel => {
                nieuwePaginaIndienNodig(6);
                doc.text(regel, marge, y);
                y += 6;
            });
        }

        const fotoUrls = (Array.isArray(item.fotos) ? item.fotos : []).map(akUrl).filter(Boolean);
        if(fotoUrls.length){
            y += 5;
            nieuwePaginaIndienNodig(75);
            doc.setFont(undefined, "bold");
            doc.text("Foto's:", marge, y);
            y += 8;
            const kolommen = 2;
            const tussenruimte = 8;
            const kolomBreedte = (paginaBreedte - marge * 2 - tussenruimte) / 2;
            const celHoogte = 65;
            let kolom = 0;

            for(const url of fotoUrls){
                if(kolom === 0) nieuwePaginaIndienNodig(celHoogte + tussenruimte);
                const x = marge + kolom * (kolomBreedte + tussenruimte);
                doc.rect(x, y, kolomBreedte, celHoogte);
                const dataUrl = await fotoAlsDataUrl(url);
                if(dataUrl){
                    try{
                        const afm = await laadAfbeeldingAfmetingen(dataUrl);
                        const schaal = Math.min(kolomBreedte / afm.breedte, celHoogte / afm.hoogte);
                        const w = afm.breedte * schaal;
                        const h = afm.hoogte * schaal;
                        doc.addImage(dataUrl, "JPEG", x + (kolomBreedte - w) / 2, y + (celHoogte - h) / 2, w, h);
                    }catch(e){
                        doc.textWithLink(url, x + 3, y + celHoogte / 2, {url});
                    }
                }
                kolom++;
                if(kolom === kolommen){
                    kolom = 0;
                    y += celHoogte + tussenruimte;
                }
            }
            if(kolom !== 0) y += celHoogte + tussenruimte;
        }

        if(bonUrl){
            nieuwePaginaIndienNodig(10);
            doc.setFont(undefined, "bold");
            doc.text("Leveranciersbon:", marge, y);
            doc.setFont(undefined, "normal");
            doc.text(bonBytes ? "zie bijlage" : "Bekijk de bon online", marge + 45, y);
            if(!bonBytes) doc.textWithLink("", marge + 45, y, {url: bonUrl});
            y += 10;
        }

        const bestandsnaam = `Rapport-aankoopklacht_${item.id}_${Date.now()}.pdf`;
        if(!bonBytes){
            doc.save(bestandsnaam);
        }else{
            const PDFLib = await laadPdfLib();
            const reportDoc = await PDFLib.PDFDocument.load(doc.output("arraybuffer"));
            const bonDoc = await PDFLib.PDFDocument.load(bonBytes);
            const samengevoegd = await PDFLib.PDFDocument.create();
            for(const pagina of await samengevoegd.copyPages(reportDoc, reportDoc.getPageIndices())) samengevoegd.addPage(pagina);
            for(const pagina of await samengevoegd.copyPages(bonDoc, bonDoc.getPageIndices())) samengevoegd.addPage(pagina);
            const blob = new Blob([await samengevoegd.save()], {type:"application/pdf"});
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = bestandsnaam;
            link.click();
            URL.revokeObjectURL(url);
        }
    }catch(fout){
        console.error(fout);
        alert("Rapport maken is mislukt.");
    }finally{
        knop.disabled = false;
        knop.innerHTML = oorspronkelijk;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("akDatum").value = new Date().toISOString().slice(0, 10);
    laadAankoopKlachten();
});
