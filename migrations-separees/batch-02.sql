-- ========================================
-- BATCH 2 - 20251218032337_88ceb655-0ec6-4632-8c0e-35314001d49b.sql à 20251218135034_eea12df7-1ae3-4485-832d-a4f2063bf92a.sql
-- ========================================


-- ========================================
-- MIGRATION: 20251218032337_88ceb655-0ec6-4632-8c0e-35314001d49b.sql
-- ========================================

-- Make rubrique_id optional in programmations table
ALTER TABLE public.programmations 
ALTER COLUMN rubrique_id DROP NOT NULL;

-- Add numero_ordre column for display ordering within month/year
ALTER TABLE public.programmations
ADD COLUMN numero_ordre integer;

-- Create function to auto-generate numero_ordre
CREATE OR REPLACE FUNCTION public.generate_programmation_numero_ordre()
RETURNS TRIGGER AS $$
DECLARE
  next_numero integer;
BEGIN
  -- Get the next order number for this month/year
  SELECT COALESCE(MAX(numero_ordre), 0) + 1
  INTO next_numero
  FROM public.programmations
  WHERE mois = NEW.mois AND annee = NEW.annee;
  
  NEW.numero_ordre := next_numero;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating numero_ordre
CREATE TRIGGER set_programmation_numero_ordre
BEFORE INSERT ON public.programmations
FOR EACH ROW
WHEN (NEW.numero_ordre IS NULL)
EXECUTE FUNCTION public.generate_programmation_numero_ordre();



-- ========================================
-- MIGRATION: 20251218042159_ee8d9ba3-466a-45e6-b29e-8b55c0f8001d.sql
-- ========================================

-- Enable realtime for recettes table
ALTER TABLE public.recettes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recettes;

-- Enable realtime for depenses table
ALTER TABLE public.depenses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.depenses;



-- ========================================
-- MIGRATION: 20251218042353_8b6388f5-5460-47bc-b553-b072acdffd1a.sql
-- ========================================

-- Enable realtime for programmations table
ALTER TABLE public.programmations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.programmations;



-- ========================================
-- MIGRATION: 20251218042452_4343f4a5-32a4-4b58-8098-65e3e2476c67.sql
-- ========================================

-- Enable realtime for rubriques table
ALTER TABLE public.rubriques REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rubriques;

-- Enable realtime for feuilles_caisse table
ALTER TABLE public.feuilles_caisse REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feuilles_caisse;



-- ========================================
-- MIGRATION: 20251218135034_eea12df7-1ae3-4485-832d-a4f2063bf92a.sql
-- ========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can create programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin can update programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin can delete programmations" ON public.programmations;

-- Create new policies allowing both admin and instructeur
CREATE POLICY "Admin and Instructeur can create programmations" 
ON public.programmations 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin and Instructeur can update programmations" 
ON public.programmations 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin and Instructeur can delete programmations" 
ON public.programmations 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));


