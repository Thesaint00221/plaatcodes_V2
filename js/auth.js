// ============================================
// auth.js
// ============================================

const emailInput = document.getElementById("email");
const wachtwoordInput = document.getElementById("wachtwoord");

const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");


// Login

loginButton?.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const wachtwoord = wachtwoordInput.value;


    if (!email || !wachtwoord) {
        alert("Vul e-mail en wachtwoord in");
        return;
    }


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,
            password: wachtwoord

        });


    if (error) {

        console.error(error);
        alert("Login mislukt: " + error.message);
        return;

    }


    alert("Inloggen gelukt");

    updateLoginStatus();

});



// Logout

logoutButton?.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    updateLoginStatus();

});



// Status controleren

async function updateLoginStatus() {

    const { data } =
        await supabaseClient.auth.getSession();


    const ingelogd =
        !!data.session;


    if (loginButton) {
        loginButton.style.display =
            ingelogd ? "none" : "inline-block";
    }


    if (logoutButton) {
        logoutButton.style.display =
            ingelogd ? "inline-block" : "none";
    }


    if (emailInput) {
        emailInput.style.display =
            ingelogd ? "none" : "block";
    }


    if (wachtwoordInput) {
        wachtwoordInput.style.display =
            ingelogd ? "none" : "block";
    }

}



// starten

updateLoginStatus();
