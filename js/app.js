document.addEventListener("DOMContentLoaded", async () => {

    await initCatalogus();

    // Diepe link vanuit het cases-overzicht: index.html?plaat=CODE
    // opent die plaat automatisch, zonder dat er gezocht moet worden.
    const params = new URLSearchParams(window.location.search);
    const gevraagdeCode = params.get("plaat");

    if(gevraagdeCode){

        const {data, error} = await supabaseClient
            .from("platen")
            .select("naam, code, leverancier, photos, referentie, kleur, kleurnummer, gearchiveerd")
            .eq("code", gevraagdeCode)
            .maybeSingle();

        if(!error && data){
            toonDetail(normaliseerPlaat(data));
        }

    }

});
