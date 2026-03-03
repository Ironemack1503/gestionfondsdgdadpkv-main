-- ========================================
-- BATCH 3 - 20251219113139_94273874-1de6-4732-9ba4-1fd0d8e3b9b3.sql à 20260113081150_3f7a3d30-fdee-4676-9062-b5453b681fde.sql
-- ========================================


-- ========================================
-- MIGRATION: 20251219113139_94273874-1de6-4732-9ba4-1fd0d8e3b9b3.sql
-- ========================================

-- Create table for report formatting settings
CREATE TABLE public.parametres_mise_en_forme (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url TEXT,
  titre_entete TEXT DEFAULT 'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
  sous_titre TEXT DEFAULT 'Rapport Financier',
  contenu_pied_page TEXT DEFAULT 'DGDA - Document officiel',
  afficher_numero_page BOOLEAN DEFAULT true,
  afficher_date BOOLEAN DEFAULT true,
  afficher_nom_institution BOOLEAN DEFAULT true,
  police TEXT DEFAULT 'helvetica',
  taille_police INTEGER DEFAULT 10,
  couleur_principale TEXT DEFAULT '#1e40af',
  marges_haut NUMERIC DEFAULT 15,
  marges_bas NUMERIC DEFAULT 15,
  marges_gauche NUMERIC DEFAULT 10,
  marges_droite NUMERIC DEFAULT 10,
  orientation TEXT DEFAULT 'portrait',
  position_logo TEXT DEFAULT 'gauche',
  filigrane_actif BOOLEAN DEFAULT true,
  filigrane_texte TEXT DEFAULT 'DGDA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.parametres_mise_en_forme ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view report settings" 
ON public.parametres_mise_en_forme 
FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can update report settings" 
ON public.parametres_mise_en_forme 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

CREATE POLICY "Admin can insert report settings" 
ON public.parametres_mise_en_forme 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete report settings" 
ON public.parametres_mise_en_forme 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parametres_mise_en_forme_updated_at
BEFORE UPDATE ON public.parametres_mise_en_forme
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.parametres_mise_en_forme (
  titre_entete,
  sous_titre,
  contenu_pied_page,
  afficher_numero_page,
  afficher_date,
  afficher_nom_institution,
  police,
  taille_police,
  couleur_principale,
  marges_haut,
  marges_bas,
  marges_gauche,
  marges_droite,
  orientation,
  position_logo,
  filigrane_actif,
  filigrane_texte
) VALUES (
  'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES',
  'Rapport Financier',
  'DGDA - Document officiel',
  true,
  true,
  true,
  'helvetica',
  10,
  '#1e40af',
  15,
  15,
  10,
  10,
  'portrait',
  'gauche',
  true,
  'DGDA'
);



-- ========================================
-- MIGRATION: 20251219135753_62e59d95-a710-4037-98e2-bcfcd2416471.sql
-- ========================================

-- Add new columns for detailed header and footer customization
ALTER TABLE public.parametres_mise_en_forme 
ADD COLUMN IF NOT EXISTS ligne_entete_1 TEXT DEFAULT 'République Démocratique du Congo',
ADD COLUMN IF NOT EXISTS ligne_entete_2 TEXT DEFAULT 'Ministère des Finances',
ADD COLUMN IF NOT EXISTS ligne_entete_3 TEXT DEFAULT 'Direction Générale des Douanes et Accises',
ADD COLUMN IF NOT EXISTS ligne_entete_4 TEXT DEFAULT 'Direction Provinciale de Kinshasa-Ville',
ADD COLUMN IF NOT EXISTS ligne_pied_1 TEXT DEFAULT 'Tous mobilisés pour une douane d''action et d''excellence !',
ADD COLUMN IF NOT EXISTS ligne_pied_2 TEXT DEFAULT 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe',
ADD COLUMN IF NOT EXISTS ligne_pied_3 TEXT DEFAULT 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215',
ADD COLUMN IF NOT EXISTS ligne_pied_4 TEXT DEFAULT 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd',
ADD COLUMN IF NOT EXISTS position_tableau TEXT DEFAULT 'gauche',
ADD COLUMN IF NOT EXISTS alignement_contenu TEXT DEFAULT 'gauche',
ADD COLUMN IF NOT EXISTS espacement_tableau INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS couleur_entete_tableau TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS couleur_texte_entete TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS couleur_lignes_alternees TEXT DEFAULT '#f5f7fa';

-- Update existing row with default values
UPDATE public.parametres_mise_en_forme
SET 
  ligne_entete_1 = COALESCE(ligne_entete_1, 'République Démocratique du Congo'),
  ligne_entete_2 = COALESCE(ligne_entete_2, 'Ministère des Finances'),
  ligne_entete_3 = COALESCE(ligne_entete_3, 'Direction Générale des Douanes et Accises'),
  ligne_entete_4 = COALESCE(ligne_entete_4, 'Direction Provinciale de Kinshasa-Ville'),
  ligne_pied_1 = COALESCE(ligne_pied_1, 'Tous mobilisés pour une douane d''action et d''excellence !'),
  ligne_pied_2 = COALESCE(ligne_pied_2, 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe'),
  ligne_pied_3 = COALESCE(ligne_pied_3, 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215'),
  ligne_pied_4 = COALESCE(ligne_pied_4, 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd'),
  position_tableau = COALESCE(position_tableau, 'gauche'),
  alignement_contenu = COALESCE(alignement_contenu, 'gauche'),
  espacement_tableau = COALESCE(espacement_tableau, 10),
  couleur_entete_tableau = COALESCE(couleur_entete_tableau, '#3b82f6'),
  couleur_texte_entete = COALESCE(couleur_texte_entete, '#ffffff'),
  couleur_lignes_alternees = COALESCE(couleur_lignes_alternees, '#f5f7fa');



-- ========================================
-- MIGRATION: 20260111233230_22291fb3-1ef6-4ece-8dee-37f1ca4ae990.sql
-- ========================================

-- Remove the policy that allows admins to view all profiles
-- This is being replaced by secure edge function access
DO $$
BEGIN
	IF to_regclass('public.profiles') IS NOT NULL THEN
		DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

		-- Add a comment explaining the security model
		COMMENT ON TABLE public.profiles IS 'User profiles table. Email access for admins is handled through the manage-users edge function for security. Direct table access only allows users to see their own profile.';
	END IF;
END $$;



-- ========================================
-- MIGRATION: 20260113065726_3468a324-8b67-4882-a423-095b2594aaad.sql
-- ========================================

-- Create table for report templates
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates and public templates
CREATE POLICY "Users can view own and public templates"
ON public.report_templates
FOR SELECT
USING (auth.uid() = created_by OR is_public = true);

-- Users can create their own templates
CREATE POLICY "Users can create own templates"
ON public.report_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by AND has_any_role(auth.uid()));

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
ON public.report_templates
FOR UPDATE
USING (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
ON public.report_templates
FOR DELETE
USING (auth.uid() = created_by);

-- Admin can manage all templates
CREATE POLICY "Admin can manage all templates"
ON public.report_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- ========================================
-- MIGRATION: 20260113081150_3f7a3d30-fdee-4676-9062-b5453b681fde.sql
-- ========================================

-- Create enum for user roles (keep existing app_role enum but extend for new system)
-- Note: We already have app_role enum with 'admin', 'instructeur', 'observateur'
-- We'll map: administrateur -> admin, instructeur -> instructeur, consultation -> observateur

-- Create the custom users table for local authentication
CREATE TABLE public.local_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'observateur',
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_protected BOOLEAN DEFAULT false, -- Prevents deletion of predefined accounts
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create session tokens table for managing user sessions
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.local_users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create login attempts log for security auditing
CREATE TABLE public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50),
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.local_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create function to check if current session user has a specific role
CREATE OR REPLACE FUNCTION public.get_session_user_id(session_token TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT user_id 
    FROM public.user_sessions 
    WHERE token = session_token 
      AND expires_at > now()
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_session_user_role(session_token TEXT)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT lu.role 
    FROM public.local_users lu
    INNER JOIN public.user_sessions us ON lu.id = us.user_id
    WHERE us.token = session_token 
      AND us.expires_at > now()
      AND lu.is_active = true
    LIMIT 1
$$;

-- RLS Policies for local_users
-- Allow edge functions (service role) to manage all users
CREATE POLICY "Service role can manage all users"
ON public.local_users
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for user_sessions
CREATE POLICY "Service role can manage sessions"
ON public.user_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for login_attempts (read-only for auditing, insert allowed)
CREATE POLICY "Service role can manage login attempts"
ON public.login_attempts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_local_users_username ON public.local_users(username);
CREATE INDEX idx_local_users_is_active ON public.local_users(is_active);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX idx_login_attempts_username ON public.login_attempts(username);
CREATE INDEX idx_login_attempts_created ON public.login_attempts(created_at);

-- Create trigger for updating updated_at
CREATE TRIGGER update_local_users_updated_at
BEFORE UPDATE ON public.local_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


