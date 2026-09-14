async function haalAlleBestanden(map = "") {
    const { data, error } = await supabaseClient.storage.from("plaatfotos").list(map, {
        limit: 1000,
        offset: 0
    });
    if(error) throw error;

    const bestanden = [];
    for(const item of data || []) {
        const pad = map ? `${map}/${item.name}` : item.name;
        if(item.id === null) {
            bestanden.push(...await haalAlleBestanden(pad));
        } else {
            bestanden.push(pad);
        }
    }
    return bestanden;
}

function opslagBestandIsAfbeelding(pad) {
    return /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(pad);
}

function opslagBestandIsPdf(pad) {
    return /\.pdf$/i.test(pad);
}

function maakOpschoonKnop() {
    if(document.getElementById("opschonenOpslag")) return;

    const controleer = document.getElementById("controleerOpslag");
    if(!controleer) return;

    const knop = document.createElement("button");
    knop.id = "opschonenOpslag";
    knop.type = "button";
    knop.className = "secundaireKnop";
    knop.innerHTML = '<span class="icoon" data-icon="vuilbak"></span> Opschonen';
    knop.addEventListener("click", controleerOpslagEnToonOngebruikte);
    controleer.insertAdjacentElement("afterend", knop);

    if(typeof renderIcons === "function") renderIcons(knop);
}

function maakOpslagVoorbeeld(pad, extraTekst = "") {
    const url = supabaseClient.storage.from("plaatfotos").getPublicUrl(pad).data.publicUrl;
    const wrapper = document.createElement("div");
    wrapper.className = "opslagBestand";

    if(opslagBestandIsAfbeelding(pad)) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = pad;
        img.loading = "lazy";
        wrapper.appendChild(img);
    } else {
        const label = document.createElement("span");
        label.textContent = opslagBestandIsPdf(pad) ? "PDF" : "BESTAND";
        label.className = "opslagBestandType";
        wrapper.appendChild(label);
    }

    const info = document.createElement("div");
    info.className = "opslagBestandInfo";
    info.innerHTML = `<strong>${pad.split("/").pop()}</strong><small>${pad}${extraTekst ? ` · ${extraTekst}` : ""}</small>`;
    wrapper.appendChild(info);
    return wrapper;
}

async function controleerOpslagEnToonOngebruikte() {
    const resultaat = document.getElementById("opslagControle");
    if(!resultaat) return;

    resultaat.textContent = "Opslag controleren...";

    try {
        const bestanden = await haalAlleBestanden();

        const { data: cases, error: casesError } = await supabaseClient
            .from("eigen_data")
            .select("foto, overzicht_foto, fotos, leveranciersbon_url");
        if(casesError) throw casesError;

        const { data: klachten, error: klachtenError } = await supabaseClient
            .from("aankoopklachten")
            .select("id, artikel, leverancier, datum, fotos, leveranciersbon_url")
            .order("datum", { ascending: false });
        if(klachtenError) throw klachtenError;

        const gebruikt = new Set();

        for(const item of cases || []) {
            [item.foto, item.overzicht_foto, item.leveranciersbon_url].forEach(pad => {
                if(pad) gebruikt.add(pad);
            });
            if(Array.isArray(item.fotos)) {
                item.fotos.forEach(pad => {
                    if(pad) gebruikt.add(pad);
                });
            }
        }

        // Aankoopklachten tellen mee als gebruikt, maar worden niet apart getoond.
        for(const item of klachten || []) {
            if(Array.isArray(item.fotos)) {
                item.fotos.forEach(pad => {
                    if(pad) gebruikt.add(pad);
                });
            }
            if(item.leveranciersbon_url) gebruikt.add(item.leveranciersbon_url);
        }

        const ongebruikt = bestanden.filter(
            pad => !gebruikt.has(pad) && !pad.endsWith(".emptyFolderPlaceholder")
        );

        resultaat.innerHTML = "";
        const samenvatting = document.createElement("p");
        samenvatting.innerHTML = `<strong>${bestanden.length}</strong> bestanden gevonden · <strong>${gebruikt.size}</strong> gekoppelde bestanden · <strong>${ongebruikt.length}</strong> mogelijk ongebruikt`;
        resultaat.appendChild(samenvatting);

        if(!ongebruikt.length) {
            const ok = document.createElement("p");
            ok.textContent = "Er zijn geen mogelijk ongebruikte bestanden gevonden.";
            resultaat.appendChild(ok);
            return;
        }

        const titel = document.createElement("h3");
        titel.textContent = "Mogelijk ongebruikt";
        resultaat.appendChild(titel);

        const lijst = document.createElement("div");
        lijst.className = "opslagOngebruiktLijst";

        ongebruikt.forEach(pad => {
            const rij = document.createElement("label");
            rij.className = "opslagOngebruiktItem";
            rij.innerHTML = `<input type="checkbox" checked value="${pad.replace(/"/g, "&quot;")}">`;
            rij.appendChild(maakOpslagVoorbeeld(pad));
            lijst.appendChild(rij);
        });

        resultaat.appendChild(lijst);

        const verwijder = document.createElement("button");
        verwijder.type = "button";
        verwijder.className = "secundaireKnop";
        verwijder.textContent = "Verwijder geselecteerde";
        verwijder.addEventListener("click", async () => {
            const paden = [...lijst.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
            if(!paden.length) return;
            if(!confirm(`${paden.length} geselecteerde bestanden verwijderen?`)) return;

            const { error } = await supabaseClient.storage.from("plaatfotos").remove(paden);
            if(error) {
                console.error(error);
                alert("Verwijderen mislukt.");
                return;
            }
            await controleerOpslagEnToonOngebruikte();
        });
        resultaat.appendChild(verwijder);
    } catch(error) {
        console.error(error);
        resultaat.textContent = "Opslagcontrole mislukt.";
    }
}

function initialiseerOpslagbeheer() {
    maakOpschoonKnop();

    const controleer = document.getElementById("controleerOpslag");
    controleer?.addEventListener("click", controleerOpslagEnToonOngebruikte);
}

document.addEventListener("DOMContentLoaded", initialiseerOpslagbeheer);
