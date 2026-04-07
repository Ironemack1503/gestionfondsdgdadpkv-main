BEGIN;

-- Table temporaire pour les données DepensesF
DROP TABLE IF EXISTS _tmp_depensesf_nbeo;
CREATE TEMP TABLE _tmp_depensesf_nbeo (
    num_bs_caisse text,
    nbeo text
);

-- Import CSV
COPY _tmp_depensesf_nbeo FROM '/tmp/depensesf_nbeo.csv' WITH (FORMAT csv, HEADER true);

-- Statistiques avant
SELECT 'Avant mise à jour:' as etape, COUNT(*) as sans_nbeo
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

-- Mise à jour NBEO dans depenses via Num_BS_Caisse
UPDATE depenses d
SET "NBEO" = t.nbeo
FROM _tmp_depensesf_nbeo t
WHERE d."Num_BS_Caisse" = t.num_bs_caisse
  AND t.nbeo IS NOT NULL
  AND t.nbeo != '';

-- Statistiques après
SELECT 'Après mise à jour:' as etape, COUNT(*) as avec_nbeo
FROM depenses WHERE "NBEO" IS NOT NULL AND "NBEO" != '';

SELECT 'Encore sans NBEO:' as etape, COUNT(*) as sans_nbeo
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

COMMIT;
