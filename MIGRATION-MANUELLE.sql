-- ========================================
-- MIGRATION MANUELLE - À exécuter dans Supabase Studio
-- ========================================
-- 1. Ouvrez http://127.0.0.1:54323 (Supabase Studio)
-- 2. Allez dans "SQL Editor"
-- 3. Copiez-collez ce script complet
-- 4. Cliquez "Run" pour exécuter
-- ========================================

-- Étape 1: Ajouter les colonnes manquantes dans recettes
ALTER TABLE public.recettes 
  ADD COLUMN IF NOT EXISTS numero_beo VARCHAR(4),
  ADD COLUMN IF NOT EXISTS libelle TEXT,
  ADD COLUMN IF NOT EXISTS imp VARCHAR(20);

-- Étape 2: Copier motif vers libelle pour les données existantes
UPDATE public.recettes 
SET libelle = motif 
WHERE libelle IS NULL AND motif IS NOT NULL;

-- Étape 3: Ajouter les colonnes manquantes dans depenses
ALTER TABLE public.depenses
  ADD COLUMN IF NOT EXISTS numero_beo VARCHAR(4),
  ADD COLUMN IF NOT EXISTS imp VARCHAR(20),
  ADD COLUMN IF NOT EXISTS libelle TEXT;

-- Étape 4: Copier motif vers libelle pour les dépenses existantes
UPDATE public.depenses 
SET libelle = motif 
WHERE libelle IS NULL AND motif IS NOT NULL;

-- Vérification: Afficher la structure des tables
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
