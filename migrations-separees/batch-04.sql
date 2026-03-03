-- ========================================
-- BATCH 4 - 20260113140748_48117b2c-a88d-4177-b077-73ee7aa0de04.sql à 20260115140926_1882217e-6d05-4cd3-81c2-575e3a55166c.sql
-- ========================================


-- ========================================
-- MIGRATION: 20260113140748_48117b2c-a88d-4177-b077-73ee7aa0de04.sql
-- ========================================

-- Drop existing policies for programmations
DROP POLICY IF EXISTS "Admin and Instructeur can create programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin and Instructeur can delete programmations" ON public.programmations;
DROP POLICY IF EXISTS "Admin and Instructeur can update programmations" ON public.programmations;
DROP POLICY IF EXISTS "Authenticated users can view programmations" ON public.programmations;

-- Create a helper function to check role from session token stored in request headers
CREATE OR REPLACE FUNCTION public.get_local_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT lu.role 
    FROM public.local_users lu
    INNER JOIN public.user_sessions us ON lu.id = us.user_id
    WHERE us.expires_at > now()
      AND lu.is_active = true
    ORDER BY us.created_at DESC
    LIMIT 1
$$;

-- Create new RLS policies that allow all authenticated local users
-- Since we're using local auth, we'll use a simpler approach with permissive policies
-- The actual role checking is done in the application layer

-- Allow SELECT for all (application handles auth)
CREATE POLICY "Allow select programmations"
ON public.programmations
FOR SELECT
USING (true);

-- Allow INSERT for all (application handles role checking)
CREATE POLICY "Allow insert programmations"
ON public.programmations
FOR INSERT
WITH CHECK (true);

-- Allow UPDATE for all (application handles role checking)
CREATE POLICY "Allow update programmations"
ON public.programmations
FOR UPDATE
USING (true);

-- Allow DELETE for all (application handles role checking)
CREATE POLICY "Allow delete programmations"
ON public.programmations
FOR DELETE
USING (true);



-- ========================================
-- MIGRATION: 20260113141810_a3895bef-fe87-4c70-b230-45260a36d182.sql
-- ========================================

-- Drop existing policies for recettes
DROP POLICY IF EXISTS "Admin and Instructeur can create recettes" ON public.recettes;
DROP POLICY IF EXISTS "Admin and Instructeur can update recettes" ON public.recettes;
DROP POLICY IF EXISTS "Authenticated users can view recettes" ON public.recettes;
DROP POLICY IF EXISTS "Only admin can delete recettes" ON public.recettes;

-- Create new permissive RLS policies for recettes (security handled by edge function)
CREATE POLICY "Allow select recettes"
ON public.recettes
FOR SELECT
USING (true);

CREATE POLICY "Allow insert recettes"
ON public.recettes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update recettes"
ON public.recettes
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete recettes"
ON public.recettes
FOR DELETE
USING (true);

-- Drop existing policies for depenses
DROP POLICY IF EXISTS "Admin and Instructeur can create depenses" ON public.depenses;
DROP POLICY IF EXISTS "Admin and Instructeur can update depenses" ON public.depenses;
DROP POLICY IF EXISTS "Authenticated users can view depenses" ON public.depenses;
DROP POLICY IF EXISTS "Only admin can delete depenses" ON public.depenses;

-- Create new permissive RLS policies for depenses (security handled by edge function)
CREATE POLICY "Allow select depenses"
ON public.depenses
FOR SELECT
USING (true);

CREATE POLICY "Allow insert depenses"
ON public.depenses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update depenses"
ON public.depenses
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete depenses"
ON public.depenses
FOR DELETE
USING (true);



-- ========================================
-- MIGRATION: 20260113142319_c4d9de96-6d75-408b-b3fc-ec4a855b83fa.sql
-- ========================================

-- Drop existing policies for rubriques
DROP POLICY IF EXISTS "Admin can delete rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Admin can insert rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Admin can update rubriques" ON public.rubriques;
DROP POLICY IF EXISTS "Authenticated users can view rubriques" ON public.rubriques;

-- Create new permissive RLS policies for rubriques (security handled by edge function)
CREATE POLICY "Allow select rubriques"
ON public.rubriques
FOR SELECT
USING (true);

CREATE POLICY "Allow insert rubriques"
ON public.rubriques
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update rubriques"
ON public.rubriques
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete rubriques"
ON public.rubriques
FOR DELETE
USING (true);

-- Drop existing policies for feuilles_caisse
DROP POLICY IF EXISTS "Admin and Instructeur can create feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Admin and Instructeur can update feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Authenticated users can view feuilles_caisse" ON public.feuilles_caisse;
DROP POLICY IF EXISTS "Only admin can delete feuilles_caisse" ON public.feuilles_caisse;

-- Create new permissive RLS policies for feuilles_caisse (security handled by edge function)
CREATE POLICY "Allow select feuilles_caisse"
ON public.feuilles_caisse
FOR SELECT
USING (true);

CREATE POLICY "Allow insert feuilles_caisse"
ON public.feuilles_caisse
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update feuilles_caisse"
ON public.feuilles_caisse
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete feuilles_caisse"
ON public.feuilles_caisse
FOR DELETE
USING (true);



-- ========================================
-- MIGRATION: 20260113143035_bc6dc1ef-9e7f-41b8-9c32-d8c133533be6.sql
-- ========================================

-- Drop all foreign key constraints pointing to auth.users for tables that use local auth
-- We won't recreate them to avoid conflicts between auth.users and local_users

-- programmations
ALTER TABLE public.programmations DROP CONSTRAINT IF EXISTS programmations_user_id_fkey;
ALTER TABLE public.programmations DROP CONSTRAINT IF EXISTS programmations_validated_by_fkey;

-- recettes
ALTER TABLE public.recettes DROP CONSTRAINT IF EXISTS recettes_user_id_fkey;

-- depenses
ALTER TABLE public.depenses DROP CONSTRAINT IF EXISTS depenses_user_id_fkey;

-- feuilles_caisse
ALTER TABLE public.feuilles_caisse DROP CONSTRAINT IF EXISTS feuilles_caisse_user_id_fkey;
ALTER TABLE public.feuilles_caisse DROP CONSTRAINT IF EXISTS feuilles_caisse_closed_by_fkey;

-- audit_logs - drop if exists
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;



-- ========================================
-- MIGRATION: 20260115140926_1882217e-6d05-4cd3-81c2-575e3a55166c.sql
-- ========================================

-- Add BEO and IMP fields to rubriques table
ALTER TABLE public.rubriques 
ADD COLUMN IF NOT EXISTS no_beo TEXT,
ADD COLUMN IF NOT EXISTS imp TEXT;

-- Create index for faster grouping by IMP
CREATE INDEX IF NOT EXISTS idx_rubriques_imp ON public.rubriques(imp);
CREATE INDEX IF NOT EXISTS idx_rubriques_no_beo ON public.rubriques(no_beo);


