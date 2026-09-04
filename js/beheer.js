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
// haalAlleBestanden() staat nu in js/opslag.js (gedeeld met opschonen.js)


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

    // aantal platen (rechtstreeks uit Supabase, niet uit het
    // verouderde data.json dat enkel nog als migratiebron dient)

    const aantalPlaten =
        document.getElementById("aantalPlaten");

    const { count: platenCount, error: platenError } =
        await supabaseClient
            .from("platen")
            .select("code", {
                count: "exact",
                head: true
            });

    if (aantalPlaten) {
        aantalPlaten.innerHTML =
            platenError ? "Fout" : (platenCount || 0);
    }

    if (platenError) {
        console.error("Platen tellen mislukt:", platenError);
    }

}


// ============================================
// Statistieken laden bij openen pagina
// ============================================

document.addEventListener(
"DOMContentLoaded",
()=>{
    laadStatistieken();
});

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

            controleKnop.disabled = true;

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
                    .select("foto, overzicht_foto, fotos, leveranciersbon_url");

            if (error) {

                console.error(error);

                veld.innerHTML =
                    "❌ Fout bij ophalen cases";

                controleKnop.disabled = false;

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

                // Leverancier-cases: meerdere foto's + optionele bon
                (item.fotos || []).forEach(pad => {
                    if (pad) {
                        gebruikt.push(pad);
                    }
                });

                if (item.leveranciersbon_url) {
                    gebruikt.push(item.leveranciersbon_url);
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

            controleKnop.disabled = false;

        }
    );

}
