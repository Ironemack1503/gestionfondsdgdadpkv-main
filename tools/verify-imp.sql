-- Forcer rechargement du schema PostgREST
NOTIFY pgrst, 'reload schema';

-- Verifier que imp_code est bien present
SELECT numero_bon, "NBEO", imp_code, motif
FROM depenses
WHERE date_transaction BETWEEN '2025-12-01' AND '2025-12-31'
ORDER BY "NBEO"::int
LIMIT 10;
