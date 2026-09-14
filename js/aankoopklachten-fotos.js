(() => {
    const lijst = document.getElementById("aankoopKlachtenLijst");
    if(!lijst) return;

    let bezig = false;

    async function toonFotos(){
        if(bezig) return;
        const kaarten = [...lijst.querySelectorAll("article.plaatCard")];
        if(!kaarten.length) return;

        bezig = true;
        const {data, error} = await supabaseClient
            .from("aankoopklachten")
            .select("id, artikel, fotos")
            .order("datum", {ascending:false})
            .order("created_at", {ascending:false});

        if(error || !data?.length){
            bezig = false;
            return;
        }

        kaarten.forEach((kaart, index) => {
            const item = data[index];
            if(!item || kaart.querySelector(".akFotoGalerij")) return;

            const fotos = Array.isArray(item.fotos) ? item.fotos : [];
            if(!fotos.length) return;

            const galerij = document.createElement("div");
            galerij.className = "akFotoGalerij";

            fotos.forEach((pad, fotoIndex) => {
                const url = akUrl(pad);
                if(!url) return;

                const link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener";
                link.className = "akFotoLink";
                link.title = `Foto ${fotoIndex + 1} openen`;

                const img = document.createElement("img");
                img.src = url;
                img.alt = `${item.artikel || "Klacht"} - foto ${fotoIndex + 1}`;
                img.loading = "lazy";
                link.appendChild(img);
                galerij.appendChild(link);
            });

            const info = kaart.querySelector(".plaatInfo");
            const acties = kaart.querySelector(".plaatFormActies");
            if(info) info.insertBefore(galerij, acties || null);
        });

        bezig = false;
    }

    const observer = new MutationObserver(toonFotos);
    observer.observe(lijst, {childList:true, subtree:true});
    toonFotos();
})();
