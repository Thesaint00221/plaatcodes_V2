// ============================================
// dropdown-sluiten.js
// Sluit elk open dropdownmenu (elementen met class "dropdown") bij
// een klik buiten dat menu én buiten de knop die het opent. Werkt
// generiek voor alle dropdowns op de pagina (actiesMenu, gebruikers-
// menu, ...), via het bestaande aria-controls patroon - geen
// aanpassing nodig in menu.js of auth.js zelf.
// ============================================

document.addEventListener("click", (event) => {

    document.querySelectorAll(".dropdown:not(.hidden)").forEach(dropdown => {

        const knop = document.querySelector(`[aria-controls="${dropdown.id}"]`);

        const klikInDropdown = dropdown.contains(event.target);
        const klikOpKnop = knop && knop.contains(event.target);

        if(klikInDropdown || klikOpKnop){
            return;
        }

        dropdown.classList.add("hidden");
        knop?.setAttribute("aria-expanded", "false");

    });

});
