// ============================================
// opslag.js
// Gedeelde helper voor Supabase Storage
// ============================================

async function haalAlleBestanden(map = "") {

    const { data, error } =
        await supabaseClient
            .storage
            .from("plaatfotos")
            .list(map, {
                limit: 1000
            });

    if (error) {
        console.error("Fout bij ophalen bestanden:", error);
        return [];
    }

    let bestanden = [];

    for (const item of data) {

        const pad = map ? `${map}/${item.name}` : item.name;

        if (!item.metadata) {
            const subBestanden = await haalAlleBestanden(pad);
            bestanden.push(...subBestanden);
        } else {
            bestanden.push(pad);
        }
    }

    return bestanden;
}

function opslagBestandIsAfbeelding(pad) {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(pad);
}

function opslagBestandIsPdf(pad) {
    return /\.pdf$/i.test(pad);
}

function opslagEsc(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

function maakOpschoonKnop() {

    if (document.getElementById("opschonenButton")) {
        return document.getElementById("opschonenButton");
    }

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

        const { data: cases, error } = await supabaseClient
            .from("eigen_data")
            .select("foto, overzicht_foto, fotos, leveranciersbon_url");

        if (error) throw error;

        const gebruikt = new Set();

        (cases || []).forEach(item => {
            if (item.foto) gebruikt.add(item.foto);
            if (item.overzicht_foto) gebruikt.add(item.overzicht_foto);
            (item.fotos || []).forEach(pad => {
                if (pad) gebruikt.add(pad);
            });
            if (item.leveranciersbon_url) gebruikt.add(item.leveranciersbon_url);
        });

        const ongebruikt = bestanden.filter(pad =>
            !gebruikt.has(pad) &&
            !pad.endsWith(".emptyFolderPlaceholder")
        );

        resultaat.innerHTML = "";

        const samenvatting = document.createElement("p");
        samenvatting.textContent = ongebruikt.length
            ? `${ongebruikt.length} ongebruikte bestanden gevonden.`
            : "Geen ongebruikte bestanden gevonden.";
        resultaat.appendChild(samenvatting);

        if (!ongebruikt.length) return;

        const lijst = document.createElement("div");
        lijst.id = "opschoonLijst";
        lijst.style.display = "grid";
        lijst.style.gridTemplateColumns = "repeat(auto-fill,minmax(220px,1fr))";
        lijst.style.gap = "10px";
        lijst.style.marginTop = "16px";

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

            const { data: urlData } = supabaseClient
                .storage
                .from("plaatfotos")
                .getPublicUrl(pad);

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
                const img = document.createElement("img");
                img.src = urlData.publicUrl;
                img.alt = "Voorbeeld van ongebruikt bestand";
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

            const naam = document.createElement("span");
            naam.textContent = pad;
            naam.title = pad;
            naam.style.minWidth = "0";
            naam.style.overflow = "hidden";
            naam.style.textOverflow = "ellipsis";
            naam.style.whiteSpace = "nowrap";
            naam.style.fontSize = "12px";
            naam.style.color = "var(--text)";

            item.append(checkbox, voorbeeld, naam);
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

            const geselecteerd = [...lijst.querySelectorAll(".wisFoto:checked")]
                .map(input => input.value);

            if (!geselecteerd.length) {
                alert("Selecteer minstens één bestand.");
                return;
            }

            if (!confirm(`${geselecteerd.length} bestanden verwijderen?`)) return;

            verwijderen.disabled = true;
            verwijderen.textContent = "Bezig met verwijderen...";

            const { error: removeError } = await supabaseClient
                .storage
                .from("plaatfotos")
                .remove(geselecteerd);

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

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseerOpslagbeheer);
} else {
    initialiseerOpslagbeheer();
}
