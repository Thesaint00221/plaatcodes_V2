// ============================================
// wachtwoord-toggle.js
// Herbruikbare "oog"-knop om een wachtwoordveld tijdelijk zichtbaar
// te maken. Wrapt het veld dynamisch in JS (geen HTML-aanpassing
// nodig per formulier) - gewoon voegWachtwoordToggleToe("veldId")
// aanroepen nadat het veld in de DOM staat.
// ============================================

function voegWachtwoordToggleToe(inputId){

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
