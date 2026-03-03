-- Migration: Ajout des colonnes imp et libelle aux tables recettes et depenses
-- Date: 2026-02-12

-- Ajouter les colonnes à la table recettes
ALTER TABLE public.recettes 
ADD COLUMN IF NOT EXISTS imp VARCHAR(20),
ADD COLUMN IF NOT EXISTS libelle TEXT;

-- Copier les données de motif vers libelle pour les recettes existantes
UPDATE public.recettes 
SET libelle = motif 
WHERE libelle IS NULL;

-- Ajouter les colonnes à la table depenses
ALTER TABLE public.depenses
ADD COLUMN IF NOT EXISTS imp VARCHAR(20),
ADD COLUMN IF NOT EXISTS libelle TEXT;

-- Copier les données de motif vers libelle pour les depenses existantes
UPDATE public.depenses 
SET libelle = motif 
WHERE libelle IS NULL;

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.recettes.imp IS 'Code imputation budgétaire';
COMMENT ON COLUMN public.recettes.libelle IS 'Libellé détaillé de la recette';
COMMENT ON COLUMN public.depenses.imp IS 'Code imputation budgétaire';
COMMENT ON COLUMN public.depenses.libelle IS 'Libellé détaillé de la dépense';
