-- Rendre toutes les colonnes NOT NULL optionnelles dans recettes et depenses pour permettre l'import des CSV
-- Table recettes
ALTER TABLE recettes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE recettes ALTER COLUMN montant DROP NOT NULL;
ALTER TABLE recettes ALTER COLUMN numero_bon DROP NOT NULL;
ALTER TABLE recettes ALTER COLUMN date DROP NOT NULL;
ALTER TABLE recettes ALTER COLUMN libelle DROP NOT NULL;
ALTER TABLE recettes ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE recettes ALTER COLUMN updated_at DROP NOT NULL;

-- Table depenses
ALTER TABLE depenses ALTER COLUMN montant DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN numero_bon DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN date DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE depenses ALTER COLUMN updated_at DROP NOT NULL;
