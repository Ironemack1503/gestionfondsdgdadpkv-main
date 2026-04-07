-- Identifier les lignes à supprimer (N°BEO: 7165 B, 7165/B, 7165A x2 du 26/12/2025)
SELECT id, numero_bon, "NBEO", motif, montant, date_transaction, imp_code
FROM depenses
WHERE date_transaction = '2025-12-26'
  AND "NBEO" IN ('7165 B', '7165/B', '7165A', '7165B')
ORDER BY "NBEO";
