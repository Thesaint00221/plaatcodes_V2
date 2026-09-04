# RLS-checklist — Plaatcodes

De publishable/anon key in `js/supabase.js` mag publiek zichtbaar zijn (dat
is normaal voor een Supabase anon key), **op voorwaarde dat Row Level
Security (RLS) op elke tabel en de storage-bucket correct is ingesteld**.
Zonder RLS kan iedereen met die key rechtstreeks alle data lezen/schrijven,
buiten de website om.

Controleer dit in Supabase → **Authentication → Policies** en
**Database → Tables**:

## 1. Tabel `platen`
- [ ] RLS is **enabled** (niet enkel policies aangemaakt — de toggle zelf moet aan staan).
- [ ] `SELECT`: toegelaten voor iedereen (nodig voor de publieke catalogus) — eventueel beperkt tot `gearchiveerd = false` voor anonieme gebruikers.
- [ ] `INSERT` / `UPDATE`: enkel toegelaten voor ingelogde gebruikers met rol `beheerder` (check via een policy die de `gebruikers`-tabel raadpleegt, of via een custom claim/JWT).
- [ ] `DELETE`: idealiter uitgeschakeld of enkel beheerder (de app archiveert i.p.v. te verwijderen).

## 2. Tabel `eigen_data` (cases/foto's)
- [ ] RLS enabled.
- [ ] `SELECT`: publiek leesbaar (nodig voor detailpagina).
- [ ] `INSERT`: enkel ingelogde gebruikers.
- [ ] `DELETE`: enkel de eigenaar (`toegevoegd_door = auth.email()`) of een `beheerder` — dit moet **serverside** afgedwongen worden via een policy, niet enkel via de `magVerwijderen()`-check in `detail.js`. Die JS-check is puur UI-cosmetisch; zonder policy kan elke ingelogde gebruiker via de API alsnog andermans case verwijderen.

## 3. Tabel `gebruikers`
- [ ] RLS enabled.
- [ ] `SELECT`: bij voorkeur enkel het eigen record (`email = auth.email()`), niet de volledige tabel — anders kan elke ingelogde gebruiker zien wie er allemaal beheerder is.
- [ ] `INSERT`/`UPDATE`/`DELETE`: enkel via een beheer-proces (service role of Supabase dashboard), niet via de publieke client.

## 4. Storage bucket `plaatfotos`
- [ ] Policies staan op de bucket (Storage → Policies), niet enkel "public bucket" aangevinkt.
- [ ] `SELECT` (lezen/weergeven van foto's): publiek, want de site toont foto's zonder login.
- [ ] `INSERT` (uploaden): enkel ingelogde gebruikers.
- [ ] `DELETE`: enkel eigenaar van de case of beheerder — zelfde risico als bij `eigen_data`: `verwijderCase()` en het opschoon-script roepen storage-delete rechtstreeks aan vanuit de browser.
- [ ] **MIME-type restrictie**: als de bucket beperkt is tot afbeeldingen, voeg `application/pdf` toe — anders lukt de upload van leveranciersbonnen (map `bonnen/`) niet. Zie `supabase/migratie_leverancier_cases.sql`.

## 5. Snelle test
Open de browserconsole op de live site (uitgelogd) en probeer:
```js
await supabaseClient.from("gebruikers").select("*")
await supabaseClient.from("eigen_data").delete().eq("id", "een-bestaand-id")
```
Beide zouden een RLS-foutmelding moeten geven, niet effectief data
teruggeven of verwijderen.

---
*Dit bestand is enkel een controlelijst — ik heb geen toegang tot je
Supabase-project en kan de policies zelf niet inspecteren of aanpassen.*
