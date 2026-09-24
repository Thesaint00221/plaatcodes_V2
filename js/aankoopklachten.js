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

async function akDownloadRapport(pad, id, knop){
    try{
        if(knop) knop.disabled = true;
        const response = await fetch(akUrl(pad));
        if(!response.ok) throw new Error("Rapport niet gevonden");
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Rapport-aankoopklacht_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }catch(error){
        console.error("Rapport downloaden mislukt:", error);
        alert("Het opgeslagen rapport kon niet worden gedownload.");
    }finally{
        if(knop) knop.disabled = false;
    }
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
                    ${item.laatst_aangepast_door ? `<p class="fotoInfo"><strong>Aangepast:</strong> ${akEsc(item.laatst_aangepast_door)} op ${akDatum(item.laatst_aangepast_op)}</p>` : ""}
                    <div class="plaatFormActies">
                        <button type="button" class="primary akBewerk" data-id="${item.id}"><span class="icoon" data-icon="tools"></span> Aanpassen</button>
                        <button type="button" class="secundaireKnop akRapport" data-id="${item.id}">
                            ${item.rapport_url ? '<span class="icoon" data-icon="download"></span> Rapport downloaden' : '<span class="icoon" data-icon="document"></span> Leveranciersrapport'}
                        </button>
                        <button type="button" class="secundaireKnop akVerwijder" data-id="${item.id}"><span class="icoon" data-icon="vuilbak"></span> Verwijderen</button>
                    </div>
                </div>
            </article>`;
    }).join("");

    document.querySelectorAll(".akBewerk").forEach(knop => {
        knop.addEventListener("click", () => {
            const item = data.find(rij => rij.id === knop.dataset.id);
            if(item) openAankoopKlachtBewerken(item);
        });
    });

    document.querySelectorAll(".akRapport").forEach(knop => {
        const item = data.find(rij => rij.id === knop.dataset.id);
        knop.addEventListener("click", () => {
            if(item?.rapport_url){
                akDownloadRapport(item.rapport_url, item.id, knop);
            }else{
                genereerAankoopKlachtRapport(item.id, knop);
            }
        });
    });

    document.querySelectorAll(".akVerwijder").forEach(knop => {
        knop.addEventListener("click", () => verwijderAankoopKlacht(knop.dataset.id));
    });
}

function sluitAkEditModal(){
    document.getElementById("akEditModal")?.remove();
}

function openAankoopKlachtBewerken(item){
    sluitAkEditModal();

    const bestaandeFotos = Array.isArray(item.fotos) ? item.fotos : [];
    const modal = document.createElement("section");
    modal.id = "akEditModal";
    modal.className = "plaatModal";
    modal.innerHTML = `
        <form class="plaatForm" id="akEditForm" style="max-width:850px;">
            <div class="plaatFormKop">
                <div>
                    <p class="beheerEyebrow">Aankoopklacht</p>
                    <h2>Klacht aanpassen</h2>
                    <p>Tekst, foto's en leveranciersbon kunnen worden aangepast. Wijzigingen worden automatisch geregistreerd.</p>
                </div>
                <button type="button" class="modalSluiten" id="akEditSluit" aria-label="Sluiten">×</button>
            </div>

            <div class="plaatFormGrid">
                <label>Artikel / omschrijving<input id="akeArtikel" type="text" maxlength="150" required value="${akEsc(item.artikel)}"></label>
                <label>Leverancier<input id="akeLeverancier" type="text" maxlength="150" required value="${akEsc(item.leverancier)}"></label>
                <label>Artikelnummer / referentie<input id="akeReferentie" type="text" maxlength="100" value="${akEsc(item.referentie || "")}"></label>
                <label>Datum klacht<input id="akeDatum" type="date" required value="${item.datum ? new Date(item.datum).toISOString().slice(0,10) : ""}"></label>
                <label>Aantal<input id="akeAantal" type="number" min="0" step="1" value="${item.aantal ?? ""}"></label>
                <label>Bestelnummer<input id="akeBestelnummer" type="text" maxlength="100" value="${akEsc(item.bestelnummer || "")}"></label>
            </div>

            <div class="uploadVeld"><label for="akeOmschrijving">Omschrijving klacht</label><textarea id="akeOmschrijving" rows="6" maxlength="3000" required>${akEsc(item.omschrijving || "")}</textarea></div>
            <div class="uploadVeld"><label for="akeOplossing">Gewenste oplossing</label><textarea id="akeOplossing" rows="4" maxlength="1000">${akEsc(item.gewenste_oplossing || "")}</textarea></div>

            <div class="uploadVeld">
                <label>Bestaande foto's</label>
                <div id="akeBestaandeFotos" style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${bestaandeFotos.map((pad,index)=>`
                        <div class="akEditFoto" data-pad="${akEsc(pad)}" style="position:relative;">
                            <img src="${akUrl(pad)}" style="width:120px;height:90px;object-fit:cover;border-radius:6px;">
                            <button type="button" class="secundaireKnop akFotoVerwijder" data-index="${index}" style="margin-top:5px;width:100%;">Foto verwijderen</button>
                        </div>`).join("") || "<p>Geen foto's.</p>"}
                </div>
                <label style="margin-top:10px;">Nieuwe foto's toevoegen<input id="akeFotos" type="file" accept="image/*" multiple></label>
                <small>Nieuwe foto's worden toegevoegd aan de bestaande foto's.</small>
            </div>

            <div class="uploadVeld">
                <label>Leveranciersbon</label>
                ${item.leveranciersbon_url ? `<p><a href="${akUrl(item.leveranciersbon_url)}" target="_blank" rel="noopener">Huidige leveranciersbon bekijken</a></p>` : "<p>Geen leveranciersbon opgeslagen.</p>"}
                <label>Nieuwe bon uploaden (optioneel)<input id="akeBon" type="file" accept="application/pdf"></label>
                ${item.leveranciersbon_url ? '<label><input id="akeBonVerwijder" type="checkbox"> Huidige bon verwijderen</label>' : ""}
            </div>

            <p id="akeMelding" class="plaatFormMelding" aria-live="polite"></p>
            <div class="plaatFormActies">
                <button type="button" class="secundaireKnop" id="akEditAnnuleer">Annuleren</button>
                <button class="primary" type="submit"><span class="icoon" data-icon="vink"></span> Wijzigingen opslaan</button>
            </div>
        </form>`;

    document.body.appendChild(modal);
    modal.classList.remove("hidden");

    const verwijderdeFotos = new Set();
    modal.querySelectorAll(".akFotoVerwijder").forEach(btn => {
        btn.addEventListener("click", () => {
            const kaart = btn.closest(".akEditFoto");
            verwijderdeFotos.add(kaart.dataset.pad);
            kaart.remove();
        });
    });

    modal.querySelector("#akEditSluit").addEventListener("click", sluitAkEditModal);
    modal.querySelector("#akEditAnnuleer").addEventListener("click", sluitAkEditModal);
    modal.addEventListener("click", e => { if(e.target === modal) sluitAkEditModal(); });

    modal.querySelector("#akEditForm").addEventListener("submit", async e => {
        e.preventDefault();

        const melding = modal.querySelector("#akeMelding");
        const knop = modal.querySelector('button[type="submit"]');
        knop.disabled = true;
        melding.textContent = "Bezig met opslaan...";

        try{
            let fotos = bestaandeFotos.filter(pad => !verwijderdeFotos.has(pad));
            const nieuweBestanden = Array.from(modal.querySelector("#akeFotos").files || []).slice(0, 5);

            for(let i=0; i<nieuweBestanden.length; i++){
                const foto = await verkleinFoto(nieuweBestanden[i]);
                const pad = akPadFoto(item.id, Date.now() + i, foto.name);
                const upload = await supabaseClient.storage.from("plaatfotos").upload(pad, foto);
                if(upload.error) throw upload.error;
                fotos.push(pad);
            }

            const bonInput = modal.querySelector("#akeBon");
            const nieuweBon = bonInput?.files?.[0] || null;
            if(nieuweBon && nieuweBon.type !== "application/pdf") throw new Error("De leveranciersbon moet een PDF zijn.");

            let bonPad = item.leveranciersbon_url;
            if(modal.querySelector("#akeBonVerwijder")?.checked){
                if(bonPad) await supabaseClient.storage.from("plaatfotos").remove([bonPad]);
                bonPad = null;
            }

            if(nieuweBon){
                if(bonPad) await supabaseClient.storage.from("plaatfotos").remove([bonPad]);
                bonPad = akPadBon(item.id, nieuweBon.name);
                const upload = await supabaseClient.storage.from("plaatfotos").upload(bonPad, nieuweBon);
                if(upload.error) throw upload.error;
            }

            const {error} = await supabaseClient
                .from("aankoopklachten")
                .update({
                    artikel: modal.querySelector("#akeArtikel").value.trim(),
                    leverancier: modal.querySelector("#akeLeverancier").value.trim(),
                    referentie: modal.querySelector("#akeReferentie").value.trim() || null,
                    datum: modal.querySelector("#akeDatum").value,
                    aantal: modal.querySelector("#akeAantal").value || null,
                    omschrijving: modal.querySelector("#akeOmschrijving").value.trim(),
                    bestelnummer: modal.querySelector("#akeBestelnummer").value.trim() || null,
                    gewenste_oplossing: modal.querySelector("#akeOplossing").value.trim() || null,
                    fotos,
                    leveranciersbon_url: bonPad,
                    rapport_url: null,
                    rapport_aangemaakt_door: null,
                    rapport_aangemaakt_op: null
                })
                .eq("id", item.id);

            if(error) throw error;

            if(verwijderdeFotos.size){
                await supabaseClient.storage.from("plaatfotos").remove([...verwijderdeFotos]);
            }

            if(item.rapport_url){
                await supabaseClient.storage.from("plaatfotos").remove([item.rapport_url]);
            }

            sluitAkEditModal();
            await laadAankoopKlachten();
        }catch(error){
            console.error(error);
            melding.textContent = error.message || "Wijzigingen opslaan mislukt.";
            knop.disabled = false;
        }
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
        .select("fotos, leveranciersbon_url, rapport_url")
        .eq("id", id)
        .single();

    if(leesError){
        console.error(leesError);
        return;
    }

    const paden = [...(Array.isArray(item.fotos) ? item.fotos : [])];
    if(item.leveranciersbon_url) paden.push(item.leveranciersbon_url);
    if(item.rapport_url) paden.push(item.rapport_url);
    if(paden.length) await supabaseClient.storage.from("plaatfotos").remove(paden);

    const {error} = await supabaseClient.from("aankoopklachten").delete().eq("id", id);
    if(error) console.error(error);
    await laadAankoopKlachten();
}

async function slaAankoopRapportOp(id, bytes, bestandsnaam){
    const pad = `rapporten/aankoopklachten/${id}.pdf`;
    const blob = new Blob([bytes], {type:"application/pdf"});
    const upload = await supabaseClient.storage.from("plaatfotos").upload(pad, blob, {
        upsert:true,
        contentType:"application/pdf"
    });
    if(upload.error) throw upload.error;

    const {data:userData} = await supabaseClient.auth.getUser();
    const gebruiker = userData.user?.email || "onbekend";

    const {error} = await supabaseClient
        .from("aankoopklachten")
        .update({
            rapport_url: pad,
            rapport_aangemaakt_door: gebruiker,
            rapport_aangemaakt_op: new Date().toISOString()
        })
        .eq("id", id);

    if(error) throw error;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = bestandsnaam;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
            nieuwePaginaIndienNodig(10);
            doc.setFont(undefined, "bold");
            doc.text("Foto's:", marge, y);
            y += 8;

            const tussenruimte = 8;
            const fotoBreedte = paginaBreedte - marge * 2;
            const fotoHoogte = 85;

            for(const url of fotoUrls){
                nieuwePaginaIndienNodig(fotoHoogte + tussenruimte);
                const x = marge;
                doc.rect(x, y, fotoBreedte, fotoHoogte);
                const dataUrl = await fotoAlsDataUrl(url);
                if(dataUrl){
                    try{
                        const afm = await laadAfbeeldingAfmetingen(dataUrl);
                        const schaal = Math.min(fotoBreedte / afm.breedte, fotoHoogte / afm.hoogte);
                        const w = afm.breedte * schaal;
                        const h = afm.hoogte * schaal;
                        doc.addImage(dataUrl, "JPEG", x + (fotoBreedte - w) / 2, y + (fotoHoogte - h) / 2, w, h);
                    }catch(e){
                        doc.textWithLink(url, x + 3, y + fotoHoogte / 2, {url});
                    }
                }
                y += fotoHoogte + tussenruimte;
            }
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

        const bestandsnaam = `Rapport-aankoopklacht_${item.id}.pdf`;
        let eindBytes = doc.output("arraybuffer");

        if(bonBytes){
            const PDFLib = await laadPdfLib();
            const reportDoc = await PDFLib.PDFDocument.load(eindBytes);
            const bonDoc = await PDFLib.PDFDocument.load(bonBytes);
            const samengevoegd = await PDFLib.PDFDocument.create();
            for(const pagina of await samengevoegd.copyPages(reportDoc, reportDoc.getPageIndices())) samengevoegd.addPage(pagina);
            for(const pagina of await samengevoegd.copyPages(bonDoc, bonDoc.getPageIndices())) samengevoegd.addPage(pagina);
            eindBytes = await samengevoegd.save();
        }

        knop.innerHTML = "⏳ Rapport opslaan...";
        await slaAankoopRapportOp(item.id, eindBytes, bestandsnaam);
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
