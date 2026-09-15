document.addEventListener("DOMContentLoaded", async () => {

    // Hoofdtabbladen duidelijk onderscheiden van de keuze
    // productie/leverancier binnen "Nieuwe case".
    const caseTabStyling = document.createElement("style");
    caseTabStyling.textContent = `
        #uploadKaart > .caseTypeKeuze{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:24px;padding:4px;border:1px solid var(--border);border-radius:2px;background:#f0f0ed;}
        #uploadKaart > .caseTypeKeuze .caseTypeKnop{min-height:48px;border:1px solid transparent;border-radius:2px;background:transparent;font-weight:600;}
        #uploadKaart > .caseTypeKeuze .caseTypeKnop.actief{background:#1f1f1f;color:#fff;border-color:#1f1f1f;box-shadow:0 2px 6px rgba(0,0,0,.10);}
        #uploadKaart > .caseTypeKeuze .caseTypeKnop:not(.actief):hover{background:#fff;border-color:#c8c8c3;}
        #nieuweCaseInhoud > .caseTypeKeuze{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;}
        #nieuweCaseInhoud > .caseTypeKeuze .caseTypeKnop{min-height:40px;padding:9px 14px;border-radius:2px;background:#fff;border:1px solid #d5d5d0;color:#5f5f5a;font-size:13px;font-weight:500;}
        #nieuweCaseInhoud > .caseTypeKeuze .caseTypeKnop.actief{background:#f1f1ee;color:#222;border-color:#aaa9a3;box-shadow:none;}
        @media(max-width:600px){#uploadKaart > .caseTypeKeuze{grid-template-columns:1fr;}#nieuweCaseInhoud > .caseTypeKeuze .caseTypeKnop{flex:1;}}
    `;
    document.head.appendChild(caseTabStyling);

    // detail.js maakt #galerij dynamisch binnen #detailContent aan.
    // Verplaats die galerij naar de tab "Bestaande cases".
    const verplaatsGalerij = () => {
        const galerij = document.getElementById("galerij");
        const bestaandePane = document.getElementById("bestaandeCasesPane");

        if(!galerij || !bestaandePane){
            return;
        }

        // Bij een nieuwe plaat moet de cases-tab altijd terug naar
        // "Nieuwe case". Een deeplink naar een specifieke case klikt
        // daarna zelf opnieuw op "Bestaande cases".
        window.toonNieuweCaseTab?.();

        if(galerij.parentElement !== bestaandePane){
            bestaandePane.appendChild(galerij);
        }
    };

    verplaatsGalerij();

    const detailObserver = new MutationObserver(verplaatsGalerij);
    const detailContent = document.getElementById("detailContent");
    if(detailContent){
        detailObserver.observe(detailContent, {childList:true, subtree:true});
    }

    await initCatalogus();

    // Diepe link vanuit het cases-overzicht: index.html?plaat=CODE
    // opent die plaat automatisch, zonder dat er gezocht moet worden.
    const params = new URLSearchParams(window.location.search);
    const gevraagdeCode = params.get("plaat");
    const gevraagdeCase = params.get("case");

    if(gevraagdeCode){

        const {data, error} = await supabaseClient
            .from("platen")
            .select("naam, code, leverancier, photos, referentie, kleur, kleurnummer, gearchiveerd")
            .eq("code", gevraagdeCode)
            .maybeSingle();

        if(!error && data){
            toonDetail(normaliseerPlaat(data));

            if(gevraagdeCase){
                // Wacht tot de detailweergave en de cases geladen zijn.
                // Daarna openen we automatisch de bestaande cases en
                // scrollen we naar de aangeklikte case.
                const openGevraagdeCase = () => {
                    const bestaandeTab = document.getElementById("bestaandeCasesTab");
                    const caseKaart = document.querySelector(`.caseKaart[data-case-id="${CSS.escape(gevraagdeCase)}"]`);

                    if(!caseKaart){
                        return false;
                    }

                    bestaandeTab?.click();

                    setTimeout(() => {
                        caseKaart.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                    }, 50);

                    return true;
                };

                let pogingen = 0;
                const wachtOpCase = () => {
                    pogingen++;
                    if(openGevraagdeCase() || pogingen >= 100){
                        return;
                    }
                    setTimeout(wachtOpCase, 50);
                };

                setTimeout(wachtOpCase, 0);
            }
        }

    }

});
