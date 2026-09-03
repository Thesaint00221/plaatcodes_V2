// ============================================
// opslag.js
// Gedeelde helper voor Supabase Storage
// Gebruikt door: opschonen.js (index.html) en beheer.js (beheer.html)
// ============================================

async function haalAlleBestanden(map = "") {

    const { data, error } =
        await supabaseClient
            .storage
            .from("plaatfotos")
            .list(map, {
                limit: 1000
            });

    if (error) {

        console.error("Fout bij ophalen bestanden:", error);
        return [];

    }

    let bestanden = [];

    for (const item of data) {

        const pad =
            map
                ? `${map}/${item.name}`
                : item.name;

        // Map
        if (!item.metadata) {

            const subBestanden =
                await haalAlleBestanden(pad);

            bestanden.push(...subBestanden);

        }
        // Bestand
        else {

            bestanden.push(pad);

        }

    }

    return bestanden;

}
