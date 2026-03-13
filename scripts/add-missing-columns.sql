-- Ajoute toutes les colonnes manquantes dans recettes et depenses pour compatibilité avec l'import CSV
-- Table recettes
ALTER TABLE recettes
  ADD COLUMN IF NOT EXISTS "libelle" TEXT,
  ADD COLUMN IF NOT EXISTS "montant" TEXT,
  ADD COLUMN IF NOT EXISTS "user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "numero_bon" TEXT,
  ADD COLUMN IF NOT EXISTS "date" TEXT,
  ADD COLUMN IF NOT EXISTS "created_at" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TEXT;

-- Table depenses
ALTER TABLE depenses
  ADD COLUMN IF NOT EXISTS "libelle" TEXT,
  ADD COLUMN IF NOT EXISTS "montant" TEXT,
  ADD COLUMN IF NOT EXISTS "user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "numero_bon" TEXT,
  ADD COLUMN IF NOT EXISTS "date" TEXT,
  ADD COLUMN IF NOT EXISTS "created_at" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TEXT;
