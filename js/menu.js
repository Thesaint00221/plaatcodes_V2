// ============================================
// menu.js
// Toggle-logica voor het acties-dropdownmenu in de header
// (zelfde patroon als het gebruikersmenu in auth.js)
// ============================================

document.getElementById("actiesKnop")?.addEventListener("click", () => {

    const dropdown = document.getElementById("actiesDropdown");
    const knop = document.getElementById("actiesKnop");

    dropdown.classList.toggle("hidden");

    const isOpen = !dropdown.classList.contains("hidden");
    knop.setAttribute("aria-expanded", isOpen);

});

// Dropdown sluiten na een keuze (elk item binnenin sluit het menu,
// de eigen click-handler van dat item blijft daarnaast gewoon werken)
document.getElementById("actiesDropdown")?.addEventListener("click", event => {
    if(event.target.closest("button, a")){
        document.getElementById("actiesDropdown").classList.add("hidden");
        document.getElementById("actiesKnop")?.setAttribute("aria-expanded", "false");
    }
});
