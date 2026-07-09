let platen = [];

const cards = document.getElementById("cards");
const detail = document.getElementById("detail");
const gallery = document.getElementById("gallery");
const detailTitle = document.getElementById("detailTitle");
const detailCode = document.getElementById("detailCode");
const detailTable = document.getElementById("detailTable");

const viewer = document.getElementById("viewer");
const viewerImage = document.getElementById("viewerImage");

document
    .getElementById("backButton")
    .onclick = () => detail.classList.add("hidden");

document
    .getElementById("closeViewer")
    .onclick = () => viewer.classList.add("hidden");

async function start(){

    const response = await fetch("data.json");

    platen = await response.json();

    render(platen);

}

function render(lijst){

    cards.innerHTML = "";

    lijst.forEach(plaat=>{

        const card=document.createElement("div");

        card.className="card";

        const eersteFoto =
            plaat.photos && plaat.photos.length
            ? "photos/"+plaat.photos[0]
            : "photos/no-image.jpg";

        card.innerHTML=`

            <img src="${eersteFoto}" loading="lazy">

            <div class="cardBody">

                <h2>${plaat.naam}</h2>

                <div class="code">${plaat.code}</div>

                <div class="leverancier">
                    ${plaat.leverancier}
                </div>

            </div>

        `;

        card.onclick=()=>openDetail(plaat);

        cards.appendChild(card);

    });

}

function openDetail(plaat){

    detail.classList.remove("hidden");

    detailTitle.textContent=plaat.naam;

    detailCode.textContent="Code "+plaat.code;

    gallery.innerHTML="";

    if(plaat.photos){

        plaat.photos.forEach(foto=>{

            const img=document.createElement("img");

            img.src="photos/"+foto;

            img.loading="lazy";

            img.onclick=()=>{

                viewer.classList.remove("hidden");

                viewerImage.src=img.src;

            };

            gallery.appendChild(img);

        });

    }

    detailTable.innerHTML="";

    for(const sleutel in plaat.info){

        detailTable.innerHTML+=`

            <tr>

                <td>${sleutel}</td>

                <td>${plaat.info[sleutel]}</td>

            </tr>

        `;

    }

}

document
.getElementById("search")
.addEventListener("input",function(){

    const zoek=this.value.toLowerCase();

    const resultaat=platen.filter(plaat=>{

        return (

            plaat.naam.toLowerCase().includes(zoek)

            ||

            plaat.code.toString().includes(zoek)

            ||

            plaat.leverancier.toLowerCase().includes(zoek)

        );

    });

    render(resultaat);

});

start();
