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
        status.innerHTML = `${icoon("fout")} Geen toegang`;
        return false;
    }

    if (gebruiker.rol !== "beheerder") {
        status.innerHTML = `${icoon("fout")} Alleen beheerders hebben toegang`;
        return false;
    }

    status.innerHTML = `Welkom ${gebruiker.naam || gebruiker.email}`;
    return true;
}

// ============================================
// Statistieken laden
// ============================================

async function laadStatistieken() {

    const toegang = await controleerToegang();

    if (!toegang) {
        return;
    }

    const { count: cases } =
        await supabaseClient
            .from("eigen_data")
            .select("id", { count: "exact", head: true });

    const aantalCases = document.getElementById("aantalCases");
    if (aantalCases) {
        aantalCases.innerHTML = cases || 0;
    }

    const fotos = await haalAlleBestanden();
    const aantalFotos = document.getElementById("aantalFotos");

    if (aantalFotos) {
        aantalFotos.innerHTML = fotos.length;
    }

    const aantalPlaten = document.getElementById("aantalPlaten");
    const { count: platenCount, error: platenError } =
        await supabaseClient
            .from("platen")
            .select("code", { count: "exact", head: true });

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

document.addEventListener("DOMContentLoaded", () => {
    laadStatistieken();
});
