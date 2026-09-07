# Wijzigingen — Functionaliteitsronde

Deze update bouwt verder op de opgeschoonde versie. Niets aan het datamodel
in Supabase is gewijzigd — enkel de front-end.

## 1. Foto-optimalisatie bij nieuwe platen
- **Bestand:** `js/foto.js` (nieuw, gedeeld) + `js/platen-beheer.js`
- Foto's van nieuwe platen worden nu net als case-foto's verkleind naar
  max. 2000px / JPEG 80% vóór upload.
- **Test:** voeg een plaat toe met een grote foto (>2000px) en controleer
  in Supabase Storage dat het geüploade bestand kleiner is dan het origineel.

## 2. Server-side zoeken + paginatie (infinite scroll)
- **Bestand:** `js/catalogus.js` (herschreven), `index.html`
- De catalogus laadt niet langer alles in één keer: eerste 24 platen,
  daarna automatisch meer bij het scrollen (via `#laadMeer`-sentinel).
- Zoeken gebeurt nu via een Supabase-query (met 350ms debounce), niet meer
  door te filteren op reeds geladen data.
- **Test:** scroll door de catalogus tot voorbij 24 platen, en zoek op een
  term die niet in de eerste pagina zit.

## 3. Leverancier-filter
- **Bestand:** `js/catalogus.js`, `index.html`, `style.css`
- Dropdown naast de zoekbalk, gevuld met alle leveranciers uit de
  actieve (niet-gearchiveerde) platen. Combineert met de zoekterm.
- **Test:** kies een leverancier, controleer dat enkel diens platen tonen;
  combineer met een zoekterm.

## 4. Gebundelde gebruikersnaam-query
- **Bestand:** `js/detail.js`
- Detailpagina haalt nu alle gebruikersnamen voor de zichtbare cases in
  één query op i.p.v. één losse query per case.
- **Test:** open een plaat met meerdere cases van verschillende gebruikers,
  controleer dat alle namen correct tonen.

## 5. Consistente loading states
- **Bestanden:** `js/detail.js`, `js/archief.js`, `js/opschonen.js`, `js/beheer.js`
- Archiveren, terugzetten, case verwijderen, opslag scannen/opschonen en
  opslagcontrole tonen nu allemaal "⏳ Bezig..." en zijn tijdens het
  verzoek gedeactiveerd.
- Bonus: het opschoon-resultaat op de detailpagina stapelt niet meer op
  bij herhaald klikken.

## 6. Plaatcode-validatie en duplicaatcheck vooraf
- **Bestand:** `js/platen-beheer.js`
- Vóór er iets geüpload wordt: check op toegelaten tekens (letters,
  cijfers, spaties, `. - _ /`, max. 50 tekens) én een controle of de code
  al bestaat — met duidelijke melding, i.p.v. pas achteraf een
  databasefout.
- **Test:** probeer een bestaande code opnieuw toe te voegen, en probeer
  een code met een ongeldig teken (bv. `@`).

## 7. PWA-ondersteuning
- **Bestanden (nieuw):** `manifest.json`, `service-worker.js`, `js/pwa.js`, `icons/*`
- De site is nu installeerbaar (icoon op startscherm) en de app-shell
  (HTML/CSS/JS/iconen) laadt via een service worker, ook bij een wisselende
  verbinding op de werkvloer.
- **Belangrijk:** enkel de *schil* van de app wordt gecachet. Catalogus-
  en case-data komt altijd rechtstreeks van Supabase — dit is bewust géén
  volledige offline-modus, want de data moet steeds actueel zijn.
- **Test:** open de site in Chrome op een Android-toestel → menu →
  "App installeren" (of het installatie-icoontje in de adresbalk op
  desktop Chrome). Test ook: pagina eerst online openen, dan vliegtuigmodus
  aan, pagina herladen — de schil zou nog moeten tonen.

## Bonus (buiten de gevraagde lijst)
- `js/beheer.js`: het aantal platen op het dashboard komt nu rechtstreeks
  uit de Supabase-tabel `platen` i.p.v. het verouderde `data.json`
  (zie de eerdere opruimronde — dat bestand kan afwijken van de live data).

---

# Ronde 3 — Productie- vs leverancierscases

## Wat is er nodig in Supabase (éénmalig, door jou uit te voeren)
- **Voer `supabase/migratie_leverancier_cases.sql` uit** in de SQL Editor.
  Dit voegt de kolommen `fotos` (jsonb) en `leveranciersbon_url` (text) toe
  aan `eigen_data`, en hergebruikt de bestaande (voorheen ongebruikte)
  kolom `type` om `productie` en `leverancier` te onderscheiden.
- **Controleer de MIME-restrictie** op de bucket `plaatfotos` (zie
  RLS-CHECKLIST.md, punt 4) — PDF's moeten toegelaten zijn.

## Nieuw bij het toevoegen van een case
- Keuzeknoppen bovenaan: "🏭 Fout in productie" (ongewijzigd gedrag) of
  "🚚 Fout van leverancier" (nieuw).
- Bij "Leverancier": tot 10 foto's tegelijk selecteren (elk automatisch
  verkleind zoals de rest) + optioneel een PDF van de leveranciersbon.
  Minstens 1 foto is verplicht, de bon niet.
- **Test:** voeg een leverancierscase toe met 3 foto's + een PDF, en
  controleer in Supabase Storage dat alles onder `plaatfotos/{code}/` en
  `plaatfotos/bonnen/{code}/` terechtkomt.

## Detailpagina
- Elke case toont een badge ("🏭 Fout in productie" / "🚚 Fout van
  leverancier").
- Leverancierscases tonen een fotogalerij (i.p.v. de vaste detail-/
  overzichtsfoto) en, indien aanwezig, een "📄 Bon bekijken"-knop die de
  PDF in een nieuw tabblad opent.

## Klachtenrapport (PDF, client-side)
- Nieuwe knop "📑 Klachtenrapport genereren" op elke leverancierscase.
- Genereert lokaal in de browser een PDF met de plaat- en case-gegevens,
  de foto's (indien ze zonder CORS-probleem opgehaald kunnen worden —
  anders wordt gewoon een link naar de foto in het rapport gezet) en een
  link naar de bon.
- De PDF-bibliotheek (jsPDF) wordt pas geladen bij de eerste klik op deze
  knop, niet standaard bij elk paginabezoek.
- **Test:** genereer een rapport en controleer of de foto's mee in de PDF
  staan. Als je een `CORS`-foutmelding in de browserconsole ziet bij het
  ophalen van de foto's, moet je in Supabase Storage → `plaatfotos` →
  instellingen de CORS-origins van je site toevoegen; het rapport blijft
  ondertussen wel werken (met links i.p.v. ingebedde foto's).

## Opschoon-tool bijgewerkt
- `js/opschonen.js` en `js/beheer.js` hielden enkel rekening met `foto`
  en `overzicht_foto` bij het opsporen van "ongebruikte" bestanden in de
  storage-bucket. Zonder aanpassing zouden alle leverancier-foto's en
  -bonnen daar foutief als "ongebruikt" getoond zijn. Dit is gecorrigeerd.

## Nog manueel te doen
- De SQL-migratie uitvoeren (zie boven) — zonder die stap blijven nieuwe
  leverancierscases mislukken met een databasefout, want de kolommen
  bestaan dan nog niet.

---

# Ronde 4 — Iconen, cases bewerken, 5 foto-kaders, bon in rapport

## 1. Consistente iconenset
- **Bestand (nieuw):** `js/icons.js`
- Alle losse emoji's (📦 🗑 🚚 🏭 ✔ ✅ ← → 📷 📄 👤 📅 🛠 🔍 🧹 ⚠️ ❌ 📸 📋 🗂 ♻️ 🚪 🔐 ▼ ...) zijn vervangen door
  één consistente set inline SVG-lijniconen (24 stuks), overal met dezelfde
  stijl (stroke, geen fill, currentColor — dus ze volgen automatisch de
  tekstkleur van de knop/context).
- Twee gebruikswijzen: `<span data-icon="naam">` in statische HTML
  (automatisch gevuld bij het laden) en `${icoon("naam")}` in
  JS-gegenereerde HTML.
- `⏳` (bezig-status) is bewust **niet** aangepast: dat werd al overal
  consistent gebruikt.
- **Test:** loop de site door (catalogus, detail, archief, beheer,
  login-menu) en kijk of alle iconen er verzorgd/gelijkaardig uitzien.

## 2. Cases bewerken (nieuw)
- **Bestand (nieuw):** `js/bewerken.js`
- Knop "Bewerken" naast "Verwijderen" bij elke case (zelfde rechten:
  eigenaar of beheerder). Opent een inline formulier (titel + opmerking),
  met Opslaan/Annuleren.
- **Beperking:** enkel titel/opmerking zijn aanpasbaar, geen foto's of
  van case-type wisselen — dat leek me voor nu voldoende en beperkt het
  risico op databestanden die niet meer kloppen. Laat het weten als
  foto's vervangen ook nodig is.
- **Test:** bewerk een case, herlaad de pagina, controleer dat de
  wijziging bewaard is gebleven.

## 3. Vijf losse foto-kaders i.p.v. multi-select (leverancierscase)
- **Bestand:** `index.html`, `js/upload.js`
- "Foto's toevoegen (max. 10)" met multi-select is vervangen door 5 losse
  kaders "Foto 1" t.e.m. "Foto 5", elk met een eigen bestandskeuze — net
  als Detailfoto/Overzichtsfoto. Dit werkt betrouwbaar met OneDrive en
  andere cloud-bronnen, waar multi-select niet overal ondersteund wordt.
  Enkel ingevulde kaders worden opgeslagen; leeg is toegestaan zolang er
  minstens 1 foto is.
- Het maximum is dus nu **5** foto's per leverancierscase (was 10) —
  gewijzigd omdat 10 losse kaders te veel scrollen zou vragen. Zeg het
  als je liever bij 10 blijft, dat kan ook met dit patroon.

## 4. `capture="environment"` weggehaald
- **Bestand:** `index.html`
- Dit attribuut dwong op sommige toestellen de bestandenkiezer naar
  **camera-only**, waardoor cloud-bronnen zoals OneDrive niet meer als
  optie verschenen. Weggehaald bij Detailfoto, Overzichtsfoto én de 5
  nieuwe foto-kaders — nu opent overal gewoon de normale "kies
  bestand"-picker met alles wat je toestel aanbiedt.
- **Test:** dit was de kern van je meldingen over OneDrive — graag
  specifiek controleren of dit nu overal lukt.

## 5. Leveranciersbon écht samengevoegd in het klachtenrapport
- **Bestand:** `js/rapport.js`
- Nieuwe bibliotheek **pdf-lib** (lui geladen, enkel bij gebruik) voegt de
  bon-PDF nu als extra pagina's toe achteraan het gegenereerde rapport,
  i.p.v. enkel een klikbare link.
- Als de bon om een of andere reden niet opgehaald/samengevoegd kan
  worden (CORS, verwijderd bestand, geen geldige PDF, ...), valt het
  rapport automatisch terug op de vorige aanpak (klikbare link) — je
  krijgt hoe dan ook een bruikbaar rapport.
- **Test:** genereer een rapport bij een case mét bon, en controleer dat
  de bon-pagina('s) effectief achteraan het PDF-bestand staan.


