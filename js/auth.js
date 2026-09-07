// ============================================
// auth.js
// ============================================


let loginBox;

function toonBeheerKnoppen(isBeheerder){

    const nieuwePlaatKnop =
        document.getElementById("nieuwePlaatKnop");

    const archiefKnop =
        document.getElementById("archiefKnop");

    if(nieuwePlaatKnop){
        nieuwePlaatKnop.style.display =
            isBeheerder ? "" : "none";
    }

    if(archiefKnop){
        archiefKnop.style.display =
            isBeheerder ? "" : "none";
    }

}


// ============================================
// Login
// ============================================

async function login(){

    const email =
        document
        .getElementById("email")
        ?.value
        .trim();


    const wachtwoord =
        document
        .getElementById("wachtwoord")
        ?.value;


    if(!email || !wachtwoord){

        alert("Vul e-mail en wachtwoord in");

        return;

    }


    const {error} =
        await supabaseClient
        .auth
        .signInWithPassword({

            email,

            password:wachtwoord

        });


    if(error){

        console.error(error);

        alert(
            "Login mislukt: " + error.message
        );

        return;

    }


    updateLoginStatus();

}





// ============================================
// Logout
// ============================================

async function logout(){

    // scope:'local' -> enkel dit toestel/tabblad wordt afgemeld.
    // Zonder deze optie logt Supabase je standaard OVERAL tegelijk uit
    // (alle toestellen), wat verrassend en ongewenst gedrag was.
    await supabaseClient
    .auth
    .signOut({ scope: "local" });


    updateLoginStatus();

}





// ============================================
// Login status
// ============================================

async function updateLoginStatus(){


    loginBox =
        document.getElementById(
            "loginBox"
        );


    if(!loginBox){

        return;

    }



    const {data} =
        await supabaseClient
        .auth
        .getSession();



    const ingelogd =
        !!data.session;



    if(ingelogd){


        const email =
            data.session
            .user
            .email;



        const gebruiker =
            await laadGebruikersRol();



        let naam =
            email;



        let rol =
            "gebruiker";



        if(gebruiker){


            if(gebruiker.naam){

                naam =
                    gebruiker.naam;

            }


            if(gebruiker.rol){

                rol =
                    gebruiker.rol;

            }

        }



        let beheerKnop = "";



        if(rol === "beheerder"){


            beheerKnop = `

            <button
            class="beheerKnop"
            id="beheerButton">

                ${icoon("tools")} Beheer

            </button>

            `;


        }

        toonBeheerKnoppen(rol === "beheerder");



        loginBox.innerHTML = `


        <div class="gebruikersMenu">


            <button
            id="userButton"
            class="gebruikerNaam"
            type="button"
            aria-expanded="false"
            aria-controls="userDropdown">


                ${icoon("gebruiker")} ${naam}

                <span class="gebruikersRol">
                    · ${rol}
                </span>

                ${icoon("chevron")}


            </button>



            <div
            id="userDropdown"
            class="dropdown hidden">


                ${beheerKnop}


                <button
                id="logoutButton"
                class="logoutKlein">

                    ${icoon("uitloggen")} Afmelden

                </button>


            </div>


        </div>


        `;



        document
        .getElementById("logoutButton")
        ?.addEventListener(
            "click",
            logout
        );



        document
        .getElementById("beheerButton")
        ?.addEventListener(
            "click",
            ()=>{

                window.location.href =
                    "beheer.html";

            }
        );



        document
        .getElementById("userButton")
        ?.addEventListener(
            "click",
            ()=>{

                document
                .getElementById(
                    "userDropdown"
                )
                .classList
                .toggle("hidden");

                const isOpen = !document
                    .getElementById("userDropdown")
                    .classList
                    .contains("hidden");

                document
                    .getElementById("userButton")
                    .setAttribute("aria-expanded", isOpen);

            }
        );



    }
    else{

        toonBeheerKnoppen(false);


        loginBox.innerHTML = `


        <form id="loginForm" class="loginCompact">


            <input
            type="email"
            id="email"
            placeholder="E-mailadres"
            autocomplete="email"
            required>



            <input
            type="password"
            id="wachtwoord"
            placeholder="Wachtwoord"
            autocomplete="current-password"
            required>



            <button
            id="loginButton"
            type="submit">

                ${icoon("slot")} Aanmelden

            </button>


        </form>


        `;



        document
        .getElementById("loginForm")
        ?.addEventListener("submit", event => {
            event.preventDefault();
            login();
        });


    }


}





// ============================================
// Gebruikersrol ophalen
// ============================================


window.huidigeGebruiker = null;



async function laadGebruikersRol(){


    const {data:userData} =
        await supabaseClient
        .auth
        .getUser();



    if(!userData.user){

        return null;

    }



    const email =
        userData.user.email;



    const {data,error} =
        await supabaseClient
        .from("gebruikers")
        .select("*")
        .eq(
            "email",
            email
        )
        .single();



    if(error){

        console.error(
            "Rol ophalen mislukt:",
            error
        );

        return null;

    }



    window.huidigeGebruiker =
        data;



    return data;


}





// ============================================
// Start
// ============================================


updateLoginStatus();
