// ============================================
// beheer.js
// Dashboard beheerpagina
// ============================================


// ============================================
// Controle toegang
// ============================================

async function controleerToegang() {

    const gebruiker = await laadGebruikersRol();

    const status = document.getElementById("beheerStatus");

    if (!status) {
        console.error("Element 'beheerStatus' niet gevonden.");
        return false;
    }

    if (!gebruiker) {

        status.innerHTML = "❌ Geen toegang";
        return false;

    }

    if (gebruiker.rol !== "beheerder") {

        status.innerHTML = "❌ Alleen beheerders hebben toegang";
        return false;

    }

    status.innerHTML =
        `Welkom ${gebruiker.naam || gebruiker.email}`;

    return true;

}


// ============================================
// Alle bestanden uit Supabase ophalen
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

        const pad =
            map
                ? `${map}/${item.name}`
                : item.name;

        // Map
        if (!item.metadata) {

            const subBestanden =
                await haalAlleBestanden(pad);

            bestanden.push(...subBestanden);

        }

        // Bestand
        else {

            bestanden.push(pad);

        }

    }

    return bestanden;

}


// ============================================
// Statistieken laden
// ============================================

async function laadStatistieken() {

    const toegang =
        await controleerToegang();

    if (!toegang) {
        return;
    }

    // aantal cases

    const { count: cases } =
        await supabaseClient
            .from("eigen_data")
            .select("id", {
                count: "exact",
                head: true
            });

    const aantalCases =
        document.getElementById("aantalCases");

    if (aantalCases) {
        aantalCases.innerHTML = cases || 0;
    }

    // aantal foto's

    const fotos =
        await haalAlleBestanden();

    const aantalFotos =
        document.getElementById("aantalFotos");

    if (aantalFotos) {
        aantalFotos.innerHTML = fotos.length;
    }

    // aantal platen uit data.json

    try {

        const antwoord =
            await fetch("data.json");

        if (!antwoord.ok) {
            throw new Error("data.json niet gevonden");
        }

        const platen =
            await antwoord.json();

        const aantalPlaten =
            document.getElementById("aantalPlaten");

        if (aantalPlaten) {
            aantalPlaten.innerHTML = platen.length;
        }

    }
        catch (error) {

        console.error(
            "Platen laden mislukt:",
            error
        );

        const aantalPlaten =
            document.getElementById("aantalPlaten");

        if (aantalPlaten) {
            aantalPlaten.innerHTML = "Fout";
        }

    }

}


// ============================================
// Statistieken laden bij openen pagina
// ============================================

laadStatistieken();


// ============================================
// Opslagcontrole knop
// ============================================

const controleKnop =
    document.getElementById("controleerOpslag");

if (controleKnop) {

    controleKnop.addEventListener(
        "click",
        async () => {

            const veld =
                document.getElementById("opslagControle");

            if (!veld) {
                console.error("Element 'opslagControle' niet gevonden.");
                return;
            }

            veld.innerHTML =
                "⏳ Bezig met controleren...";

            // Alle bestanden ophalen

            const bestanden =
                await haalAlleBestanden();

            // Alle foto's uit database ophalen

            const {
                data: cases,
                error
            } =
                await supabaseClient
                    .from("eigen_data")
                    .select("foto, overzicht_foto");

            if (error) {

                console.error(error);

                veld.innerHTML =
                    "❌ Fout bij ophalen cases";

                return;

            }

            let gebruikt = [];

            cases.forEach(item => {

                if (item.foto) {
                    gebruikt.push(item.foto);
                }

                if (item.overzicht_foto) {
                    gebruikt.push(item.overzicht_foto);
                }

            });

            const ongebruikt =
                bestanden.filter(bestand =>

                    !gebruikt.includes(bestand) &&
                    !bestand.includes(".emptyFolderPlaceholder")

                );

            veld.innerHTML = `

<p>
📸 Bestanden in bucket:
<b>${bestanden.length}</b>
</p>

<p>
📄 Foto's gekoppeld aan cases:
<b>${gebruikt.length}</b>
</p>

<p>
⚠️ Ongebruikte foto's:
<b>${ongebruikt.length}</b>
</p>

`;

            console.log(
                "Alle bestanden:",
                bestanden
            );

            console.log(
                "Gebruikte foto's:",
                gebruikt
            );

            console.log(
                "Ongebruikte foto's:",
                ongebruikt
            );

            if (ongebruikt.length > 0) {

                console.table(ongebruikt);

            }

        }
    );

}
