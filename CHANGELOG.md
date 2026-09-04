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
