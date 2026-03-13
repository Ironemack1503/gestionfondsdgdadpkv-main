-- Rendre les colonnes NOT NULL optionnelles pour permettre l'import des CSV (suite)
ALTER TABLE recettes ALTER COLUMN provenance DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN beneficiaire DROP NOT NULL;
ALTER TABLE rubriques ALTER COLUMN libelle DROP NOT NULL;
