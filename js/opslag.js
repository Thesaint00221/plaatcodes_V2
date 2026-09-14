// ============================================
// opslag.js
// Gedeelde helper voor Supabase Storage
// ============================================

async function haalAlleBestanden(map = "") {
    const { data, error } = await supabaseClient.storage.from("plaatfotos").list(map, { limit: 1000 });
    if (error) {
        console.error("Fout bij ophalen bestanden:", error);
        return [];
    }
    let bestanden = [];
    for (const item of data) {
        const pad = map ? `${map}/${item.name}` : item.name;
        if (!item.metadata) bestanden.push(...await haalAlleBestanden(pad));
        else bestanden.push(pad);
    }
    return bestanden;
}

function opslagBestandIsAfbeelding(pad) { return /\.(jpg|jpeg|png|webp|gif)$/i.test(pad); }
function opslagBestandIsPdf(pad) { return /\.pdf$/i.test(pad); }

function maakOpschoonKnop() {
    if (document.getElementById("opschonenButton")) return document.getElementById("opschonenButton");
    const controleerKnop = document.getElementById("controleerOpslag");
    if (!controleerKnop) return null;
    const knop = document.createElement("button");
    knop.id = "opschonenButton";
    knop.type = "button";
    knop.className = "beheerPrimaireKnop";
    knop.style.marginLeft = "8px";
    knop.textContent = "Opschonen";
    controleerKnop.insertAdjacentElement("afterend", knop);
    return knop;
}

function maakOpslagVoorbeeld(pad, extraTekst = "") {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "10px";
    item.style.padding = "8px";
    item.style.border = "1px solid var(--border)";
    item.style.borderRadius = "2px";
    item.style.background = "#fff";
    item.style.minWidth = "0";

    const voorbeeld = document.createElement("div");
    voorbeeld.style.width = "72px";
    voorbeeld.style.height = "58px";
    voorbeeld.style.flex = "0 0 72px";
    voorbeeld.style.display = "flex";
    voorbeeld.style.alignItems = "center";
    voorbeeld.style.justifyContent = "center";
    voorbeeld.style.overflow = "hidden";
    voorbeeld.style.background = "#f1f1ee";
    voorbeeld.style.border = "1px solid var(--border)";

    if (opslagBestandIsAfbeelding(pad)) {
        const { data } = supabaseClient.storage.from("plaatfotos").getPublicUrl(pad);
        const img = document.createElement("img");
        img.src = data.publicUrl;
        img.alt = "Foto";
        img.loading = "lazy";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        voorbeeld.appendChild(img);
    } else {
        const type = document.createElement("span");
        type.textContent = opslagBestandIsPdf(pad) ? "PDF" : "BESTAND";
        type.style.fontSize = "11px";
        type.style.fontWeight = "600";
        type.style.color = "#6f6f6b";
        voorbeeld.appendChild(type);
    }

    const tekst = document.createElement("div");
    tekst.style.minWidth = "0";
    tekst.style.flex = "1";
    const naam = document.createElement("div");
    naam.textContent = pad;
    naam.title = pad;
    naam.style.overflow = "hidden";
    naam.style.textOverflow = "ellipsis";
    naam.style.whiteSpace = "nowrap";
    naam.style.fontSize = "12px";
    naam.style.color = "var(--text)";
    tekst.appendChild(naam);
    if (extraTekst) {
        const sub = document.createElement("div");
        sub.textContent = extraTekst;
        sub.style.marginTop = "3px";
        sub.style.fontSize = "11px";
        sub.style.color = "#858580";
        tekst.appendChild(sub);
    }
    item.append(voorbeeld, tekst);
    return item;
}

async function controleerOpslagEnToonOngebruikte() {
    const resultaat = document.getElementById("opslagControle");
    const scanKnop = document.getElementById("controleerOpslag");
    const opschoonKnop = maakOpschoonKnop();
    if (!resultaat || !scanKnop || !opschoonKnop) return;

    scanKnop.disabled = true;
    opschoonKnop.disabled = true;
    scanKnop.textContent = "Bezig met controleren...";

    try {
        const bestanden = await haalAlleBestanden();

        const { data: cases, error: casesError } = await supabaseClient
            .from("eigen_data")
            .select("foto, overzicht_foto, fotos, leveranciersbon_url");
        if (casesError) throw casesError;

        const { data: klachten, error: klachtenError } = await supabaseClient
            .from("aankoopklachten")
            .select("id, artikel, leverancier, datum, fotos, leveranciersbon_url")
            .order("datum", { ascending: false });
        if (klachtenError) throw klachtenError;

        const gebruikt = new Set();
        const aankoopFotoInfo = [];

        (cases || []).forEach(item => {
            if (item.foto) gebruikt.add(item.foto);
            if (item.overzicht_foto) gebruikt.add(item.overzicht_foto);
            (item.fotos || []).forEach(pad => { if (pad) gebruikt.add(pad); });
            if (item.leveranciersbon_url) gebruikt.add(item.leveranciersbon_url);
        });

        (klachten || []).forEach(item => {
            const fotos = Array.isArray(item.fotos) ? item.fotos : [];
            fotos.forEach(pad => {
                if (!pad) return;
                gebruikt.add(pad);
                aankoopFotoInfo.push({
                    pad,
                    label: `${item.artikel || "Onbekend artikel"} · ${item.leverancier || "Onbekende leverancier"} · ${item.datum || "geen datum"}`
                });
            });
            if (item.leveranciersbon_url) gebruikt.add(item.leveranciersbon_url);
        });

        const ongebruikt = bestanden.filter(pad => !gebruikt.has(pad) && !pad.endsWith(".emptyFolderPlaceholder"));

        resultaat.innerHTML = "";

        const samenvatting = document.createElement("p");
        samenvatting.textContent = ongebruikt.length ? `${ongebruikt.length} ongebruikte bestanden gevonden.` : "Geen ongebruikte bestanden gevonden.";
        resultaat.appendChild(samenvatting);

        if (aankoopFotoInfo.length) {
            const kop = document.createElement("h4");
            kop.textContent = `Aankoopklachten · ${aankoopFotoInfo.length} foto's`;
            kop.style.margin = "22px 0 10px";
            resultaat.appendChild(kop);

            const lijst = document.createElement("div");
            lijst.style.display = "grid";
            lijst.style.gridTemplateColumns = "repeat(auto-fill,minmax(260px,1fr))";
            lijst.style.gap = "10px";
            aankoopFotoInfo.forEach(foto => lijst.appendChild(maakOpslagVoorbeeld(foto.pad, foto.label)));
            resultaat.appendChild(lijst);
        }

        if (!ongebruikt.length) return;

        const kop = document.createElement("h4");
        kop.textContent = "Mogelijk ongebruikt";
        kop.style.margin = "22px 0 10px";
        resultaat.appendChild(kop);

        const lijst = document.createElement("div");
        lijst.id = "opschoonLijst";
        lijst.style.display = "grid";
        lijst.style.gridTemplateColumns = "repeat(auto-fill,minmax(260px,1fr))";
        lijst.style.gap = "10px";

        ongebruikt.forEach(pad => {
            const item = document.createElement("label");
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.gap = "10px";
            item.style.padding = "8px";
            item.style.border = "1px solid var(--border)";
            item.style.borderRadius = "2px";
            item.style.background = "#fff";
            item.style.cursor = "pointer";
            item.style.minWidth = "0";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "wisFoto";
            checkbox.value = pad;
            checkbox.checked = true;
            checkbox.style.flex = "0 0 auto";
            item.append(checkbox, maakOpslagVoorbeeld(pad));
            lijst.appendChild(item);
        });

        resultaat.appendChild(lijst);
        const verwijderen = document.createElement("button");
        verwijderen.id = "verwijderOngebruikte";
        verwijderen.type = "button";
        verwijderen.className = "gbVerwijderGebruikerKnop";
        verwijderen.style.marginTop = "16px";
        verwijderen.textContent = "Verwijder geselecteerde";
        resultaat.appendChild(verwijderen);

        verwijderen.addEventListener("click", async () => {
            const geselecteerd = [...lijst.querySelectorAll(".wisFoto:checked")].map(input => input.value);
            if (!geselecteerd.length) { alert("Selecteer minstens één bestand."); return; }
            if (!confirm(`${geselecteerd.length} bestanden verwijderen?`)) return;
            verwijderen.disabled = true;
            verwijderen.textContent = "Bezig met verwijderen...";
            const { error: removeError } = await supabaseClient.storage.from("plaatfotos").remove(geselecteerd);
            if (removeError) {
                console.error("Verwijderen mislukt:", removeError);
                alert("Verwijderen mislukt: " + removeError.message);
                verwijderen.disabled = false;
                verwijderen.textContent = "Verwijder geselecteerde";
                return;
            }
            await controleerOpslagEnToonOngebruikte();
        });
    } catch (error) {
        console.error("Opslagcontrole mislukt:", error);
        resultaat.textContent = "Opslagcontrole mislukt. Controleer de console voor details.";
    } finally {
        scanKnop.disabled = false;
        opschoonKnop.disabled = false;
        scanKnop.innerHTML = '<span class="icoon" data-icon="zoek"></span> Controleer opslag';
    }
}

function initialiseerOpslagbeheer() {
    const scanKnop = document.getElementById("controleerOpslag");
    const opschoonKnop = maakOpschoonKnop();
    if (!scanKnop || !opschoonKnop) return;
    scanKnop.addEventListener("click", controleerOpslagEnToonOngebruikte);
    opschoonKnop.addEventListener("click", controleerOpslagEnToonOngebruikte);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialiseerOpslagbeheer);
else initialiseerOpslagbeheer();
