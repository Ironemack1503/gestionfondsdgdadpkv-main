-- Rendre les colonnes NOT NULL optionnelles pour permettre l'import des CSV (final)
ALTER TABLE recettes ALTER COLUMN montant DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN motif DROP NOT NULL;
