-- Rendre les colonnes NOT NULL optionnelles pour permettre l'import des CSV
ALTER TABLE recettes ALTER COLUMN motif DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN rubrique_id DROP NOT NULL;
ALTER TABLE rubriques ALTER COLUMN code DROP NOT NULL;
