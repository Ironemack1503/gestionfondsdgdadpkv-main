-- ========================================
-- MIGRATION RAPIDE - Ajout colonnes imp et libelle
-- ========================================

-- Ajouter les colonnes à recettes
ALTER TABLE public.recettes 
ADD COLUMN IF NOT EXISTS imp VARCHAR(20),
ADD COLUMN IF NOT EXISTS libelle TEXT;

-- Copier motif vers libelle pour recettes existantes
UPDATE public.recettes 
SET libelle = motif 
WHERE libelle IS NULL;

-- Ajouter les colonnes à depenses
ALTER TABLE public.depenses
ADD COLUMN IF NOT EXISTS imp VARCHAR(20),
ADD COLUMN IF NOT EXISTS libelle TEXT;

-- Copier motif vers libelle pour depenses existantes
UPDATE public.depenses 
SET libelle = motif 
WHERE libelle IS NULL;

-- Vérification
SELECT 'Migration terminée avec succès !' as message;
