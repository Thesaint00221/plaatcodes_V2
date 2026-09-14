(() => {
    const lijst = document.getElementById("aankoopKlachtenLijst");
    if(!lijst) return;

    const style = document.createElement("style");
    style.textContent = `
        .akFotoGalerij{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 20px;}
        .akFotoLink{display:block;width:110px;height:85px;border:1px solid #ddd;border-radius:3px;overflow:hidden;background:#f7f7f4;}
        .akFotoLink:hover{border-color:#999;transform:none;}
        .akFotoLink img{width:100%;height:100%;object-fit:cover;display:block;}
        @media(max-width:600px){.akFotoLink{width:82px;height:68px;}}
    `;
    document.head.appendChild(style);

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
