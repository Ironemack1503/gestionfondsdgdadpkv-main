BEGIN;

UPDATE depenses d
SET "NBEO" = t.nbeo
FROM _import_depensesf_nbeo t
WHERE d.numero_bon::text = t.num_bs_caisse
  AND t.nbeo IS NOT NULL AND t.nbeo != '';

SELECT 'Depenses avec NBEO:' as info, COUNT(*) as nb
FROM depenses WHERE "NBEO" IS NOT NULL AND "NBEO" != '';

SELECT 'Depenses sans NBEO:' as info, COUNT(*) as nb  
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

-- Exemples de résultats
SELECT numero_bon, "NBEO", motif FROM depenses
WHERE "NBEO" IS NOT NULL AND "NBEO" != ''
ORDER BY numero_bon
LIMIT 10;

COMMIT;

DROP TABLE IF EXISTS _import_depensesf_nbeo;
