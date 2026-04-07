-- Vérif DB vs PDF pour les premières dépenses de décembre 2025
SELECT "NBEO", imp_code, motif
FROM depenses
WHERE date_transaction BETWEEN '2025-12-01' AND '2025-12-31'
  AND "NBEO" IS NOT NULL AND "NBEO" != '0'
ORDER BY "NBEO"::int
LIMIT 30;
