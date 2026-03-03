-- ========================================
-- BATCH 6 - 20260129193245_3ca2ab01-6617-44c0-ac8d-ee6e8a64b92c.sql à 20260202130000_add_categorie_to_rubriques.sql
-- ========================================


-- ========================================
-- MIGRATION: 20260129193245_3ca2ab01-6617-44c0-ac8d-ee6e8a64b92c.sql
-- ========================================

-- Add is_default column to report_templates
ALTER TABLE public.report_templates 
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Create function to ensure only one default template exists
CREATE OR REPLACE FUNCTION public.set_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If this template is being set as default, unset all other defaults
  IF NEW.is_default = true THEN
    UPDATE public.report_templates
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to enforce single default
CREATE TRIGGER ensure_single_default_template
BEFORE INSERT OR UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_single_default_template();

-- Create index for faster default template lookup
CREATE INDEX idx_report_templates_default ON public.report_templates (is_default) WHERE is_default = true;



-- ========================================
-- MIGRATION: 20260202120000_public_read_policies.sql
-- ========================================

-- Public read-only policies for anonymous access
-- This allows direct Supabase reads without Edge Functions (no token) for specific tables.
DO $$
BEGIN
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view rubriques" ON public.rubriques
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.recettes') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view recettes" ON public.recettes
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.depenses') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view depenses" ON public.depenses
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.programmations') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view programmations" ON public.programmations
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view feuilles_caisse" ON public.feuilles_caisse
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.services') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view services" ON public.services
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.categories') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view categories" ON public.categories
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.signataires') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Public can view signataires" ON public.signataires
        FOR SELECT TO anon USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;




-- ========================================
-- MIGRATION: 20260202121500_rls_write_policies.sql
-- ========================================

-- RLS write policies using app roles
-- Requires authenticated users with proper roles in user_roles table
DO $$
BEGIN
  -- Rubriques
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin can insert rubriques" ON public.rubriques
        FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can update rubriques" ON public.rubriques
        FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can delete rubriques" ON public.rubriques
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Services
  IF to_regclass('public.services') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin can insert services" ON public.services
        FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can update services" ON public.services
        FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can delete services" ON public.services
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Recettes
  IF to_regclass('public.recettes') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin and Instructeur can create recettes" ON public.recettes
        FOR INSERT TO authenticated WITH CHECK (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin and Instructeur can update recettes" ON public.recettes
        FOR UPDATE TO authenticated USING (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Only admin can delete recettes" ON public.recettes
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Depenses
  IF to_regclass('public.depenses') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin and Instructeur can create depenses" ON public.depenses
        FOR INSERT TO authenticated WITH CHECK (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin and Instructeur can update depenses" ON public.depenses
        FOR UPDATE TO authenticated USING (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Only admin can delete depenses" ON public.depenses
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Programmations
  IF to_regclass('public.programmations') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin can create programmations" ON public.programmations
        FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can update programmations" ON public.programmations
        FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin can delete programmations" ON public.programmations
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  -- Feuilles de caisse
  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    BEGIN
      CREATE POLICY "Admin and Instructeur can create feuilles_caisse" ON public.feuilles_caisse
        FOR INSERT TO authenticated WITH CHECK (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Admin and Instructeur can update feuilles_caisse" ON public.feuilles_caisse
        FOR UPDATE TO authenticated USING (
          has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'instructeur')
        );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      CREATE POLICY "Only admin can delete feuilles_caisse" ON public.feuilles_caisse
        FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;




-- ========================================
-- MIGRATION: 20260202124000_local_auth_rls.sql
-- ========================================

-- Local auth RLS: use session token from request header (x-session-token)

-- Helper: read token from request headers
CREATE OR REPLACE FUNCTION public.get_request_session_token()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    (COALESCE(current_setting('request.headers', true), '{}')::jsonb ->> 'x-session-token'),
    ''
  )
$$;

-- Helper: current local user id (from user_sessions)
CREATE OR REPLACE FUNCTION public.local_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_session_user_id(public.get_request_session_token())
$$;

-- Helper: current local user role (from local_users)
CREATE OR REPLACE FUNCTION public.local_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_session_user_role(public.get_request_session_token())
$$;

-- Helper: is local user authenticated
CREATE OR REPLACE FUNCTION public.is_local_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.local_user_id() IS NOT NULL
$$;

DO $$
BEGIN
  -- Drop public/legacy policies if they exist
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view rubriques" ON public.rubriques';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view rubriques" ON public.rubriques';
  END IF;
  IF to_regclass('public.recettes') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view recettes" ON public.recettes';
  END IF;
  IF to_regclass('public.depenses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view depenses" ON public.depenses';
  END IF;
  IF to_regclass('public.programmations') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view programmations" ON public.programmations';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view programmations" ON public.programmations';
  END IF;
  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view feuilles_caisse" ON public.feuilles_caisse';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view feuilles_caisse" ON public.feuilles_caisse';
  END IF;
  IF to_regclass('public.services') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view services" ON public.services';
  END IF;
  IF to_regclass('public.categories') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view categories" ON public.categories';
  END IF;
  IF to_regclass('public.signataires') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view signataires" ON public.signataires';
  END IF;
END $$;

DO $$
BEGIN
  -- SELECT policies for local auth
  IF to_regclass('public.rubriques') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view rubriques" ON public.rubriques FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert rubriques" ON public.rubriques FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update rubriques" ON public.rubriques FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete rubriques" ON public.rubriques FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.services') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view services" ON public.services FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert services" ON public.services FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update services" ON public.services FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete services" ON public.services FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.recettes') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view recettes" ON public.recettes FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can create recettes" ON public.recettes FOR INSERT WITH CHECK (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can update recettes" ON public.recettes FOR UPDATE USING (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin can delete recettes" ON public.recettes FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.depenses') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view depenses" ON public.depenses FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can create depenses" ON public.depenses FOR INSERT WITH CHECK (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can update depenses" ON public.depenses FOR UPDATE USING (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin can delete depenses" ON public.depenses FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.programmations') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view programmations" ON public.programmations FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can create programmations" ON public.programmations FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update programmations" ON public.programmations FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete programmations" ON public.programmations FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.feuilles_caisse') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view feuilles_caisse" ON public.feuilles_caisse FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can create feuilles_caisse" ON public.feuilles_caisse FOR INSERT WITH CHECK (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin/instructeur can update feuilles_caisse" ON public.feuilles_caisse FOR UPDATE USING (public.local_user_role() IN (''admin'',''instructeur''))';
    EXECUTE 'CREATE POLICY "Local admin can delete feuilles_caisse" ON public.feuilles_caisse FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.categories') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view categories" ON public.categories FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert categories" ON public.categories FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update categories" ON public.categories FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete categories" ON public.categories FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;

  IF to_regclass('public.signataires') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY "Local users can view signataires" ON public.signataires FOR SELECT USING (public.is_local_authenticated())';
    EXECUTE 'CREATE POLICY "Local admin can insert signataires" ON public.signataires FOR INSERT WITH CHECK (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can update signataires" ON public.signataires FOR UPDATE USING (public.local_user_role() = ''admin'')';
    EXECUTE 'CREATE POLICY "Local admin can delete signataires" ON public.signataires FOR DELETE USING (public.local_user_role() = ''admin'')';
  END IF;
END $$;




-- ========================================
-- MIGRATION: 20260202130000_add_categorie_to_rubriques.sql
-- ========================================

-- Add missing categorie column to rubriques
ALTER TABLE public.rubriques
ADD COLUMN IF NOT EXISTS categorie TEXT;



