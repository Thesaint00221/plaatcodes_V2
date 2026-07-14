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



    if(
        !email ||
        !wachtwoord
    ){

        alert(
            "Vul e-mail en wachtwoord in"
        );

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
            "Login mislukt: "
            + error.message
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


        if(
            gebruiker &&
            gebruiker.naam
        ){

            naam =
                gebruiker.naam;

        }




        let beheerKnop = "";



        if(
            gebruiker &&
            gebruiker.rol === "beheerder"
        ){

            beheerKnop = `

            <button
            class="beheerKnop"
            onclick="
            window.location.href='beheer.html'
            ">

            🛠 Beheer

            </button>

            `;

        }



        loginBox.innerHTML = `


        <div class="gebruikersMenu">


            <div class="gebruikerNaam">

                👤 ${naam}

            </div>



            ${beheerKnop}



            <button
            id="logoutButton"
            class="logoutKlein">

            🚪 Afmelden

            </button>


        </div>


        `;



        document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            logout
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
        .getElementById(
            "loginButton"
        )
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



    if(
        !userData.user
    ){

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
const userButton =
document.getElementById("userButton");

const dropdown =
document.getElementById("userDropdown");


userButton?.addEventListener(
"click",
()=>{

dropdown.classList.toggle(
"verborgen"
);

});



// ============================================
// Start
// ============================================


updateLoginStatus();
