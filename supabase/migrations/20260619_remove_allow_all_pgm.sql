-- Remove legacy permissive policy for programmation_depenses
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'allow_all_pgm' AND polrelid = 'public.programmation_depenses'::regclass
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_all_pgm" ON public.programmation_depenses';
  END IF;
END $$;
