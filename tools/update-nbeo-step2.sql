BEGIN;

-- Statistiques avant
SELECT 'Avant:' as etape, COUNT(*) as sans_nbeo
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

-- Mise à jour NBEO
UPDATE depenses d
SET "NBEO" = t.nbeo
FROM _import_depensesf_nbeo t
WHERE d."Num_BS_Caisse" = t.num_bs_caisse
  AND t.nbeo IS NOT NULL
  AND t.nbeo != '';

-- Statistiques après
SELECT 'Après - avec NBEO:' as etape, COUNT(*) as nb
FROM depenses WHERE "NBEO" IS NOT NULL AND "NBEO" != '';

SELECT 'Après - sans NBEO:' as etape, COUNT(*) as nb
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

-- Exemples
SELECT "Num_BS_Caisse", "NBEO", motif FROM depenses
WHERE "NBEO" IS NOT NULL AND "NBEO" != ''
ORDER BY "Num_BS_Caisse"::int NULLS LAST
LIMIT 5;

COMMIT;

DROP TABLE IF EXISTS _import_depensesf_nbeo;
