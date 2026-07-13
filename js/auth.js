// ============================================
// auth.js
// ============================================


let loginBox =
    document.getElementById("loginBox");


// ============================================
// Login elementen ophalen
// ============================================

function laadLoginElementen(){

    return {

        email:
            document.getElementById("email"),

        wachtwoord:
            document.getElementById("wachtwoord"),

        loginButton:
            document.getElementById("loginButton"),

        logoutButton:
            document.getElementById("logoutButton")

    };

}



// ============================================
// Login
// ============================================

async function login(){

    const elementen =
        laadLoginElementen();


    const email =
        elementen.email?.value
        .trim();


    const wachtwoord =
        elementen.wachtwoord?.value;



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
// Login status tonen
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


        const user =
            data.session.user.email;



        let beheerKnop = "";



        const gebruiker =
            await laadGebruikersRol();



        if(
            gebruiker &&
            gebruiker.rol === "beheerder"
        ){

            beheerKnop = `

            <button
            onclick="
            window.location.href='beheer.html'
            ">

            🛠 Beheer

            </button>

            `;

        }



       loginBox.innerHTML = `

<div class="gebruikersMenu">


<button
class="gebruikerKnop"
id="gebruikerKnop">

👤 ${gebruiker?.naam || user}

</button>


<div
class="gebruikersDropdown"
id="gebruikersDropdown">


${beheerKnop}


<button
id="logoutButton">

🚪 Afmelden

</button>


</div>


</div>

`;


document
.getElementById(
"gebruikerKnop"
)
?.addEventListener(
"click",
()=>{

document
.getElementById(
"gebruikersDropdown"
)
.classList.toggle(
"toon"
);

});



    }
    else{


        loginBox.innerHTML = `


        <div class="loginTitel">

            🔐

            <h2>
            Plaatcatalogus
            </h2>

            <p>
            Meld je aan om foto's toe te voegen
            </p>


        </div>



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

        Aanmelden

        </button>


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




// ============================================
// Start
// ============================================


updateLoginStatus();
