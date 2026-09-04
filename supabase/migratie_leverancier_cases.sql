-- ============================================
-- migratie_leverancier_cases.sql
-- Voer dit uit in de Supabase SQL Editor.
-- ============================================
--
-- De kolom "type" in eigen_data bestond al, maar kreeg tot nu toe altijd
-- de vaste waarde "Case" mee vanuit upload.js. Vanaf deze migratie wordt
-- die kolom gebruikt om twee soorten cases te onderscheiden:
--
--   'productie'   -> bestaande gedrag: 1 detailfoto + 1 overzichtsfoto
--   'leverancier' -> nieuw: meerdere foto's (kolom "fotos") + optioneel
--                    een leveranciersbon (kolom "leveranciersbon_url")
--
-- Bestaande cases blijven gewoon werken: ze worden hieronder omgezet naar
-- 'productie' en tonen verder identiek zoals vandaag.

-- 1. Nieuwe kolommen voor leverancier-cases
alter table eigen_data
    add column if not exists fotos jsonb,
    add column if not exists leveranciersbon_url text;

-- 2. Bestaande rijen ("Case" of leeg) omzetten naar 'productie'
update eigen_data
set type = 'productie'
where type is null or type = 'Case';

-- 3. Enkel deze twee waarden nog toelaten (optioneel maar aangeraden)
alter table eigen_data
    drop constraint if exists eigen_data_type_check;

alter table eigen_data
    add constraint eigen_data_type_check
    check (type in ('productie','leverancier'));

-- ============================================
-- Storage: controleer ook het volgende in de Supabase dashboard
-- (Storage -> plaatfotos -> instellingen):
-- ============================================
-- Als de bucket "plaatfotos" een MIME-type restrictie heeft die enkel
-- afbeeldingen toelaat, moet "application/pdf" daaraan toegevoegd worden,
-- anders lukt de upload van leveranciersbonnen niet. De RLS-policies zelf
-- hoeven niet aangepast: die gelden per rij/bestand, niet per kolom of
-- bestandstype.
