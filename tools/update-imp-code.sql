BEGIN;

-- Le mapping peut avoir plusieurs codes pour un même NBEO (peu probable mais possible)
-- On prend le code le plus fréquent pour chaque NBEO
UPDATE depenses d
SET imp_code = m.code
FROM (
    SELECT DISTINCT ON (nbeo) nbeo, code
    FROM _import_mvt_code
    WHERE code IS NOT NULL AND code != '' AND code != '-'
    GROUP BY nbeo, code
    ORDER BY nbeo, COUNT(*) DESC
) m
WHERE d."NBEO" = m.nbeo
  AND m.code IS NOT NULL;

SELECT 'Depenses avec imp_code:' as info, COUNT(*) as nb
FROM depenses WHERE imp_code IS NOT NULL AND imp_code != '';

SELECT 'Depenses sans imp_code:' as info, COUNT(*) as nb
FROM depenses WHERE imp_code IS NULL OR imp_code = '';

-- Exemples de résultats
SELECT "NBEO", imp_code, motif FROM depenses
WHERE imp_code IS NOT NULL AND imp_code != ''
ORDER BY "NBEO"::int NULLS LAST
LIMIT 10;

COMMIT;

DROP TABLE IF EXISTS _import_mvt_code;
