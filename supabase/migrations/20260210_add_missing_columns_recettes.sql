-- Migration pour ajouter les colonnes manquantes dans recettes et depenses
-- Date: 2026-02-10

-- Ajouter les colonnes manquantes dans la table recettes
ALTER TABLE public.recettes 
  ADD COLUMN IF NOT EXISTS numero_beo VARCHAR(4),
  ADD COLUMN IF NOT EXISTS libelle TEXT,
  ADD COLUMN IF NOT EXISTS imp VARCHAR(20);

-- Ajouter les colonnes manquantes dans la table depenses
ALTER TABLE public.depenses
  ADD COLUMN IF NOT EXISTS numero_beo VARCHAR(4),
  ADD COLUMN IF NOT EXISTS imp VARCHAR(20);

-- Mettre à jour les données existantes : copier motif vers libelle si libelle est null
UPDATE public.recettes SET libelle = motif WHERE libelle IS NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN public.recettes.numero_beo IS 'Numéro BÉO (Budget Économique d''Ordre) - 4 chiffres';
COMMENT ON COLUMN public.recettes.libelle IS 'Libellé descriptif de la recette';
COMMENT ON COLUMN public.recettes.imp IS 'Code IMP (Imputation budgétaire)';
COMMENT ON COLUMN public.depenses.numero_beo IS 'Numéro BÉO (Budget Économique d''Ordre) - 4 chiffres';
COMMENT ON COLUMN public.depenses.imp IS 'Code IMP (Imputation budgétaire)';
