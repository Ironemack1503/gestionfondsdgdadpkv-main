-- Recréer table import
DROP TABLE IF EXISTS _import_depensesf_nbeo;
CREATE TABLE _import_depensesf_nbeo (
    num_bs_caisse text,
    nbeo text
);

-- Import via metacommande \copy (client-side, lit depuis /tmp/)
\copy _import_depensesf_nbeo FROM '/tmp/depensesf_nbeo.csv' WITH (FORMAT csv, HEADER true)

-- Vérification import
SELECT COUNT(*) as lignes_importees FROM _import_depensesf_nbeo;
SELECT * FROM _import_depensesf_nbeo LIMIT 5;

BEGIN;

UPDATE depenses d
SET "NBEO" = t.nbeo
FROM _import_depensesf_nbeo t
WHERE d."Num_BS_Caisse" = t.num_bs_caisse
  AND t.nbeo IS NOT NULL AND t.nbeo != '';

SELECT 'Dépenses avec NBEO:' as info, COUNT(*) as nb
FROM depenses WHERE "NBEO" IS NOT NULL AND "NBEO" != '';

COMMIT;

DROP TABLE IF EXISTS _import_depensesf_nbeo;
