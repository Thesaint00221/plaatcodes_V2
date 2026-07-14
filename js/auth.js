// ============================================
// auth.js
// ============================================


let loginBox;


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

    await supabaseClient
    .auth
    .signOut();


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

                🛠 Beheer

            </button>

            `;


        }



        loginBox.innerHTML = `


        <div class="gebruikersMenu">


            <button
            id="userButton"
            class="gebruikerNaam">


                👤 ${naam}

                <span class="gebruikersRol">
                    · ${rol}
                </span>

                ▼


            </button>



            <div
            id="userDropdown"
            class="dropdown verborgen">


                ${beheerKnop}


                <button
                id="logoutButton"
                class="logoutKlein">

                    🚪 Afmelden

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
                .toggle(
                    "verborgen"
                );

            }
        );



    }
    else{


        loginBox.innerHTML = `


        <div class="loginCompact">


            <input
            type="email"
            id="email"
            placeholder="E-mailadres">



            <input
            type="password"
            id="wachtwoord"
            placeholder="Wachtwoord">



            <button
            id="loginButton">

                🔐 Aanmelden

            </button>


        </div>


        `;



        document
        .getElementById("loginButton")
        ?.addEventListener(
            "click",
            login
        );


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
