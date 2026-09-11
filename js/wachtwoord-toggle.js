// ============================================
// wachtwoord-toggle.js
// Herbruikbare "oog"-knop om een wachtwoordveld tijdelijk zichtbaar
// te maken. Wrapt het veld dynamisch in JS (geen HTML-aanpassing
// nodig per formulier) - gewoon voegWachtwoordToggleToe("veldId")
// aanroepen nadat het veld in de DOM staat.
// ============================================

function voegLoginStijlToe(){

    if(document.getElementById("loginVisueleStijl")){
        return;
    }

    const stijl = document.createElement("style");
    stijl.id = "loginVisueleStijl";
    stijl.textContent = `
        .loginCompact button{
            background:white !important;
            color:var(--primary) !important;
            border:1px solid var(--border) !important;
            box-shadow:none !important;
        }

        .loginCompact button:hover{
            background:var(--surface-2) !important;
            border-color:var(--primary) !important;
        }

        .wachtwoordVeld{
            position:relative;
            width:100%;
        }

        .wachtwoordVeld input{
            padding-right:34px !important;
            margin-bottom:0 !important;
        }

        .wachtwoordToggleKnop{
            position:absolute;
            right:4px;
            top:50%;
            transform:translateY(-50%);
            width:26px !important;
            min-width:26px !important;
            max-width:26px !important;
            height:26px !important;
            min-height:26px !important;
            max-height:26px !important;
            flex:0 0 26px !important;
            padding:0 !important;
            border:0 !important;
            border-radius:6px !important;
            background:transparent !important;
            color:var(--text-light) !important;
            box-shadow:none !important;
        }

        .wachtwoordToggleKnop:hover{
            background:var(--surface-2) !important;
            color:var(--primary) !important;
        }
    `;

    document.head.appendChild(stijl);
}

function voegWachtwoordToggleToe(inputId){

    voegLoginStijlToe();

    const input = document.getElementById(inputId);

    if(!input || input.dataset.toggleToegevoegd){
        return;
    }

    input.dataset.toggleToegevoegd = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "wachtwoordVeld";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const knop = document.createElement("button");
    knop.type = "button";
    knop.className = "wachtwoordToggleKnop";
    knop.setAttribute("aria-label", "Wachtwoord tonen");
    knop.innerHTML = icoon("oog");

    wrapper.appendChild(knop);

    knop.addEventListener("click", () => {

        const nuZichtbaar = input.type === "text";

        input.type = nuZichtbaar ? "password" : "text";
        knop.innerHTML = icoon(nuZichtbaar ? "oog" : "oog-dicht");
        knop.setAttribute("aria-label", nuZichtbaar ? "Wachtwoord tonen" : "Wachtwoord verbergen");

    });

}
