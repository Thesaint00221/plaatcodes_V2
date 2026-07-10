// ============================================
// auth.js
// ============================================


const emailInput =
    document.getElementById("email");

const wachtwoordInput =
    document.getElementById("wachtwoord");


const loginButton =
    document.getElementById("loginButton");


const logoutButton =
    document.getElementById("logoutButton");


const loginBox =
    document.getElementById("loginBox");





// ============================================
// Login
// ============================================


loginButton?.addEventListener(
"click",
async()=>{


const email =
    emailInput.value.trim();


const wachtwoord =
    wachtwoordInput.value;



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
"Login mislukt: " +
error.message
);


return;


}



alert(
"Inloggen gelukt"
);



updateLoginStatus();



});







// ============================================
// Logout
// ============================================


logoutButton?.addEventListener(
"click",
async()=>{


await supabaseClient
.auth
.signOut();



updateLoginStatus();



});







// ============================================
// Login status
// ============================================


async function updateLoginStatus(){


const {data} =
await supabaseClient
.auth
.getSession();



const ingelogd =
!!data.session;




if(!loginBox){
return;
}




if(ingelogd){



const gebruiker =
    await laadGebruikersRol();

const naam =
    gebruiker?.naam || data.session.user.email;

const rol =
    gebruiker?.rol || "";



loginBox.innerHTML = `


<div class="loginIngelogd">


<div class="loginGebruiker">

    <div class="gebruikerNaam">
        👤 ${naam}
    </div>

    <div class="gebruikerRol">
        ${rol}
    </div>

</div>


<button id="logoutButton">

    Afmelden

</button>


</div>


`;



// nieuwe knop koppelen

document
.getElementById("logoutButton")
.addEventListener(
"click",
async()=>{


await supabaseClient
.auth
.signOut();



updateLoginStatus();



});



}
else {



loginBox.innerHTML = `


<div class="loginTitel">

    🔐

    <h2>
        Aanmelden
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



<button id="loginButton">

Aanmelden

</button>


`;



// opnieuw koppelen

document
.getElementById("loginButton")
.addEventListener(
"click",
async()=>{


const email =
document
.getElementById("email")
.value
.trim();



const wachtwoord =
document
.getElementById("wachtwoord")
.value;



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

alert(
"Login mislukt: "
+ error.message
);

return;

}



updateLoginStatus();



});



}


}







// ============================================
// starten
// ============================================


updateLoginStatus();






// ============================================
// gebruikersrol ophalen
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
