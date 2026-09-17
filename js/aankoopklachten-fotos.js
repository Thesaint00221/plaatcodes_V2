(() => {
    const lijst = document.getElementById("aankoopKlachtenLijst");
    if(!lijst) return;

    const style = document.createElement("style");
    style.textContent = `
        .akFotoGalerij{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 20px;}
        .akFotoLink{display:block;width:110px;height:85px;border:1px solid #ddd;border-radius:3px;overflow:hidden;background:#f7f7f4;cursor:zoom-in;}
        .akFotoLink:hover{border-color:#999;transform:none;}
        .akFotoLink img{width:100%;height:100%;object-fit:cover;display:block;}
        .akFotoLightbox{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.82);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .15s ease,visibility .15s ease;}
        .akFotoLightbox.actief{opacity:1;visibility:visible;pointer-events:auto;}
        .akFotoLightbox img{max-width:92vw;max-height:90vh;width:auto;height:auto;object-fit:contain;border-radius:4px;box-shadow:0 8px 30px rgba(0,0,0,.35);}
        .akFotoLightboxSluiten{position:absolute;top:14px;right:18px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.9);color:#222;font-size:28px;line-height:1;cursor:pointer;}
        .akFotoLightboxSluiten:hover{background:#fff;}
        body.akFotoLightboxOpen{overflow:hidden;}
        @media(max-width:600px){.akFotoLink{width:82px;height:68px;}.akFotoLightbox{padding:14px;}.akFotoLightbox img{max-width:96vw;max-height:88vh;}}
    `;
    document.head.appendChild(style);

    const lightbox = document.createElement("div");
    lightbox.className = "akFotoLightbox";
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.innerHTML = `
        <button type="button" class="akFotoLightboxSluiten" aria-label="Foto sluiten">&times;</button>
        <img alt="Vergrote klachtfoto">
    `;
    document.body.appendChild(lightbox);

    const lightboxAfbeelding = lightbox.querySelector("img");
    const sluitKnop = lightbox.querySelector(".akFotoLightboxSluiten");

    function sluitLightbox(){
        lightbox.classList.remove("actief");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("akFotoLightboxOpen");
        lightboxAfbeelding.src = "";
    }

    function openLightbox(url, alt){
        lightboxAfbeelding.src = url;
        lightboxAfbeelding.alt = alt || "Vergrote klachtfoto";
        lightbox.classList.add("actief");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("akFotoLightboxOpen");
    }

    sluitKnop.addEventListener("click", sluitLightbox);
    lightbox.addEventListener("click", event => {
        if(event.target === lightbox){
            sluitLightbox();
        }
    });
    document.addEventListener("keydown", event => {
        if(event.key === "Escape" && lightbox.classList.contains("actief")){
            sluitLightbox();
        }
    });

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
                link.href = "#";
                link.className = "akFotoLink";
                link.title = `Foto ${fotoIndex + 1} vergroten`;

                const img = document.createElement("img");
                img.src = url;
                img.alt = `${item.artikel || "Klacht"} - foto ${fotoIndex + 1}`;
                img.loading = "lazy";
                link.appendChild(img);

                link.addEventListener("click", event => {
                    event.preventDefault();
                    openLightbox(url, img.alt);
                });

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
