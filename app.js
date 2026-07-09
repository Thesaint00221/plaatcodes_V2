let huidigePlaat = null;

async function uploadFoto() {

    if (!huidigePlaat) {
        alert("Geen plaat geselecteerd.");
        return;
    }

    const bestand = document.getElementById("fotoBestand").files[0];

    if (!bestand) {
        alert("Kies eerst een foto.");
        return;
    }

    const categorie = document.getElementById("categorie").value;
    const titel = document.getElementById("fotoTitel").value;
    const beschrijving = document.getElementById("fotoBeschrijving").value;

    const extensie = bestand.name.split(".").pop();

    const bestandsNaam =
        `${huidigePlaat.code}_${Date.now()}.${extensie}`;

    // Upload naar Storage
    const { error: uploadError } =
        await supabaseClient.storage
            .from("plaatfotos")
            .upload(bestandsNaam, bestand);

    if (uploadError) {
        alert(uploadError.message);
        console.error(uploadError);
        return;
    }

    // Gegevens opslaan in database
    const { error: dbError } =
        await supabaseClient
            .from("eigen_data")
            .insert({

    code: huidigePlaat.code,

    type: categorie,

    omschrijving: beschrijving,

    foto: bestandsNaam

});

    if (dbError) {
        alert(dbError.message);
        console.error(dbError);
        return;
    }

    alert("Foto opgeslagen!");
}

const detail = document.getElementById("detail");
const detailContent = document.getElementById("detailContent");
const terug = document.getElementById("terug");

terug.onclick = () => {

    detail.classList.add("hidden");
    resultaten.style.display = "grid";

};

let platen = [];

const resultaten = document.getElementById("resultaten");
const zoekveld = document.getElementById("search");

async function laadPlaten() {

    const response = await fetch("platen.json");
    platen = await response.json();

    toonPlaten(platen);
}

laadPlaten();

zoekveld.addEventListener("input", zoeken);

function zoeken() {

    const zoekterm = zoekveld.value.toLowerCase().trim();

    const gevonden = platen.filter(plaat => {

        return (
            plaat.naam.toLowerCase().includes(zoekterm) ||
            plaat.code.toLowerCase().includes(zoekterm) ||
            plaat.leverancier.toLowerCase().includes(zoekterm) ||
            plaat.info.Referentie.toLowerCase().includes(zoekterm) ||
            plaat.info.Kleur.toLowerCase().includes(zoekterm) ||
            String(plaat.info.Kleurnummer).includes(zoekterm)
        );

    });

    toonPlaten(gevonden);
}

function toonPlaten(lijst) {

    resultaten.innerHTML = "";

    if (lijst.length === 0) {

        resultaten.innerHTML =
            "<p class='geenResultaat'>Geen platen gevonden.</p>";

        return;
    }

    lijst.forEach(plaat => {

        const kaart = document.createElement("div");

        kaart.className = "kaart";

        kaart.onclick = () => toonDetail(plaat);

        kaart.innerHTML = `
            <img src="photos/${plaat.photos[0]}" alt="${plaat.naam}">

            <div class="inhoud">
                <h2>${plaat.naam}</h2>

                <p><strong>Code:</strong> ${plaat.code}</p>

                <p><strong>Leverancier:</strong> ${plaat.leverancier}</p>
            </div>
        `;

        resultaten.appendChild(kaart);

    });
const fotoFormulier =
    document.getElementById("fotoFormulier");

document
    .getElementById("fotoToevoegen")
    .onclick = () => {

        fotoFormulier.classList.toggle("verborgen");

    };

function toonDetail(plaat) {

    huidigePlaat = plaat;

    resultaten.style.display = "none";
    detail.classList.remove("hidden");

    let foto = `
        <div class="placeholder">
            <div>📷</div>
            <div>Geen foto</div>
            <div>${plaat.code}</div>
        </div>
    `;

    if (plaat.photos.length) {

        foto = `
            <img
                class="detailFoto"
                src="photos/${plaat.photos[0]}"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">

            <div class="placeholder" style="display:none;">
                <div>📷</div>
                <div>Geen foto</div>
                <div>${plaat.code}</div>
            </div>
        `;
    }

    let tabel = "";

    for (const [sleutel, waarde] of Object.entries(plaat.info)) {

        tabel += `
            <tr>
                <td>${sleutel}</td>
                <td>${waarde ?? "-"}</td>
            </tr>
        `;

    }

    detailContent.innerHTML = `

        <h1>${plaat.naam}</h1>

        ${foto}

        <table class="infoTable">

            <tr>
                <td>Code</td>
                <td>${plaat.code}</td>
            </tr>

            <tr>
                <td>Leverancier</td>
                <td>${plaat.leverancier}</td>
            </tr>

            ${tabel}

        </table>

    `;

    const knop = document.getElementById("opslaanFoto");

    if (knop) {
        knop.onclick = uploadFoto;
    }

}
const email = document.getElementById("email");
const wachtwoord = document.getElementById("wachtwoord");

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

loginButton.onclick = login;

logoutButton.onclick = logout;

controleerLogin();

async function login(){

    const { error } =
        await supabaseClient.auth.signInWithPassword({

            email: email.value,

            password: wachtwoord.value

        });

if (error) {
    console.error(error);
    alert(error.message);
    return;
}

    controleerLogin();

}

async function logout(){

    await supabaseClient.auth.signOut();

    controleerLogin();

}

async function controleerLogin(){

    const { data } =
        await supabaseClient.auth.getSession();

    const ingelogd =
        data.session !== null;

    loginButton.style.display =
        ingelogd ? "none" : "inline-block";

    logoutButton.style.display =
        ingelogd ? "inline-block" : "none";

    email.style.display =
        ingelogd ? "none" : "inline-block";

    wachtwoord.style.display =
        ingelogd ? "none" : "inline-block";

}
