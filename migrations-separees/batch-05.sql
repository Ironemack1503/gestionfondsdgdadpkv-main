-- ========================================
-- BATCH 5 - 20260128075333_537e68ac-e9c6-4ba5-b58b-e06b7b5e6525.sql à 20260129191830_9d208fe1-8b29-43c3-b20b-cc66db6e78ac.sql
-- ========================================


-- ========================================
-- MIGRATION: 20260128075333_537e68ac-e9c6-4ba5-b58b-e06b7b5e6525.sql
-- ========================================

-- Créer les types ENUM pour l'application
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'instructeur', 'observateur');
    END IF;
END $$;
CREATE TYPE public.transaction_type AS ENUM ('recette', 'depense');
CREATE TYPE public.transaction_status AS ENUM ('brouillon', 'valide', 'archive');

-- Table des rôles utilisateurs (sécurité)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'observateur',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    libelle VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des rubriques (catégories de dépenses)
CREATE TABLE IF NOT EXISTS public.rubriques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    libelle VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des recettes (entrées de caisse)
CREATE TABLE IF NOT EXISTS public.recettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL NOT NULL,
    numero_beo VARCHAR(50),
    date_transaction DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    motif TEXT NOT NULL,
    provenance VARCHAR(200) NOT NULL,
    montant DECIMAL(15, 2) NOT NULL CHECK (montant > 0),
    montant_lettre TEXT,
    observation TEXT,
    solde_avant DECIMAL(15, 2),
    solde_apres DECIMAL(15, 2),
    service_id UUID REFERENCES public.services(id),
    user_id UUID NOT NULL,
    statut transaction_status NOT NULL DEFAULT 'brouillon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des dépenses (sorties de caisse)
CREATE TABLE IF NOT EXISTS public.depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL NOT NULL,
    numero_beo VARCHAR(50),
    date_transaction DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    beneficiaire VARCHAR(200) NOT NULL,
    motif TEXT NOT NULL,
    montant DECIMAL(15, 2) NOT NULL CHECK (montant > 0),
    montant_lettre TEXT,
    observation TEXT,
    solde_avant DECIMAL(15, 2),
    solde_apres DECIMAL(15, 2),
    rubrique_id UUID REFERENCES public.rubriques(id),
    service_id UUID REFERENCES public.services(id),
    user_id UUID NOT NULL,
    statut transaction_status NOT NULL DEFAULT 'brouillon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des feuilles de caisse journalières
CREATE TABLE IF NOT EXISTS public.feuilles_caisse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_feuille DATE NOT NULL UNIQUE,
    solde_initial DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_recettes DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_depenses DECIMAL(15, 2) NOT NULL DEFAULT 0,
    solde_final DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_cloturee BOOLEAN NOT NULL DEFAULT false,
    cloturee_par UUID,
    cloturee_at TIMESTAMPTZ,
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des signatures (triple signature)
CREATE TABLE IF NOT EXISTS public.signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type transaction_type NOT NULL,
    transaction_id UUID NOT NULL,
    type_signature VARCHAR(20) NOT NULL CHECK (type_signature IN ('COMPT', 'DAF', 'DP')),
    user_id UUID NOT NULL,
    signature_hash TEXT,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (transaction_id, type_signature)
);

-- Table d'audit/historique
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des paramètres système
CREATE TABLE IF NOT EXISTS public.parametres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cle VARCHAR(50) NOT NULL UNIQUE,
    valeur TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feuilles_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;

-- Fonction pour vérifier les rôles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fonction pour vérifier si l'utilisateur peut éditer
CREATE OR REPLACE FUNCTION public.can_edit(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'instructeur')
  )
$$;

-- Nettoyage des politiques existantes (idempotence)
DO $$
BEGIN
    -- user_roles
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles';

    -- profiles
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles';

    -- services
    EXECUTE 'DROP POLICY IF EXISTS "Everyone can view services" ON public.services';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage services" ON public.services';

    -- rubriques
    EXECUTE 'DROP POLICY IF EXISTS "Everyone can view rubriques" ON public.rubriques';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage rubriques" ON public.rubriques';

    -- recettes
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can create recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can update recettes" ON public.recettes';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete recettes" ON public.recettes';

    -- depenses
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can create depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can update depenses" ON public.depenses';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete depenses" ON public.depenses';

    -- feuilles_caisse
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view feuilles" ON public.feuilles_caisse';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can manage feuilles" ON public.feuilles_caisse';

    -- signatures
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view signatures" ON public.signatures';
    EXECUTE 'DROP POLICY IF EXISTS "Editors can create signatures" ON public.signatures';

    -- audit_logs
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs';
END $$;

-- Politiques RLS pour user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour services
CREATE POLICY "Everyone can view services"
ON public.services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour rubriques
CREATE POLICY "Everyone can view rubriques"
ON public.rubriques FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage rubriques"
ON public.rubriques FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour recettes
CREATE POLICY "Authenticated users can view recettes"
ON public.recettes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can create recettes"
ON public.recettes FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update recettes"
ON public.recettes FOR UPDATE
TO authenticated
USING (public.can_edit(auth.uid()));

CREATE POLICY "Admins can delete recettes"
ON public.recettes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour depenses
CREATE POLICY "Authenticated users can view depenses"
ON public.depenses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can create depenses"
ON public.depenses FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update depenses"
ON public.depenses FOR UPDATE
TO authenticated
USING (public.can_edit(auth.uid()));

CREATE POLICY "Admins can delete depenses"
ON public.depenses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Politiques RLS pour feuilles_caisse
CREATE POLICY "Authenticated users can view feuilles"
ON public.feuilles_caisse FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can manage feuilles"
ON public.feuilles_caisse FOR ALL
TO authenticated
USING (public.can_edit(auth.uid()));

-- Politiques RLS pour signatures
CREATE POLICY "Authenticated users can view signatures"
ON public.signatures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Editors can create signatures"
ON public.signatures FOR INSERT
TO authenticated
WITH CHECK (public.can_edit(auth.uid()));

-- Politiques RLS pour audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politiques RLS pour parametres
CREATE POLICY "Everyone can view parametres"
ON public.parametres FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage parametres"
ON public.parametres FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DO $$
BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles';
    EXECUTE 'DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles';
    EXECUTE 'DROP TRIGGER IF EXISTS update_services_updated_at ON public.services';
    EXECUTE 'DROP TRIGGER IF EXISTS update_rubriques_updated_at ON public.rubriques';
    EXECUTE 'DROP TRIGGER IF EXISTS update_recettes_updated_at ON public.recettes';
    EXECUTE 'DROP TRIGGER IF EXISTS update_depenses_updated_at ON public.depenses';
    EXECUTE 'DROP TRIGGER IF EXISTS update_feuilles_caisse_updated_at ON public.feuilles_caisse';
    EXECUTE 'DROP TRIGGER IF EXISTS update_parametres_updated_at ON public.parametres';
END $$;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rubriques_updated_at
    BEFORE UPDATE ON public.rubriques
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recettes_updated_at
    BEFORE UPDATE ON public.recettes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_depenses_updated_at
    BEFORE UPDATE ON public.depenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feuilles_caisse_updated_at
    BEFORE UPDATE ON public.feuilles_caisse
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parametres_updated_at
    BEFORE UPDATE ON public.parametres
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les services par défaut
INSERT INTO public.services (code, libelle) VALUES
('DGDA-KIN', 'Direction Provinciale Kinshasa-Ville'),
('CONTENTIEUX', 'Service Contentieux'),
('RECETTES', 'Service des Recettes'),
('ADMIN', 'Administration Générale')
ON CONFLICT (code) DO NOTHING;

-- Insérer les rubriques par défaut
INSERT INTO public.rubriques (code, libelle) VALUES
('RUB-001', 'Fournitures de bureau'),
('RUB-002', 'Carburant et lubrifiant'),
('RUB-003', 'Entretien et réparation'),
('RUB-004', 'Communication'),
('RUB-005', 'Déplacements et missions'),
('RUB-006', 'Frais divers');

-- Insérer les paramètres par défaut
INSERT INTO public.parametres (cle, valeur, description) VALUES
('nom_institution', 'Direction Générale des Douanes et Accises', 'Nom complet de l''institution'),
('direction_provinciale', 'Direction Provinciale Kinshasa-Ville', 'Nom de la direction provinciale'),
('devise', 'FC', 'Symbole de la devise'),
('devise_nom', 'Francs Congolais', 'Nom complet de la devise'),
('solde_initial', '0', 'Solde initial de la caisse');



-- ========================================
-- MIGRATION: 20260128075412_cb919712-5e0c-4001-b4ef-4807fa459516.sql
-- ========================================

-- Corriger la fonction update_updated_at_column avec search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Supprimer la politique trop permissive pour audit_logs INSERT
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;

-- Créer une politique plus restrictive - seuls les utilisateurs authentifiés peuvent créer des logs
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));



-- ========================================
-- MIGRATION: 20260128080650_d3b0b64b-fae4-484e-a39e-3aeafd422ec8.sql
-- ========================================

-- Table pour les utilisateurs locaux (authentification sans Supabase Auth)
CREATE TABLE IF NOT EXISTS public.local_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'observateur' CHECK (role IN ('admin', 'instructeur', 'observateur')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_protected BOOLEAN NOT NULL DEFAULT false,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les sessions utilisateur
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.local_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les tentatives de connexion
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address VARCHAR(50),
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_local_users_username ON public.local_users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON public.login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON public.login_attempts(created_at DESC);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_local_users_updated_at ON public.local_users;
CREATE TRIGGER update_local_users_updated_at
  BEFORE UPDATE ON public.local_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS pour local_users (service role uniquement via edge function)
ALTER TABLE public.local_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies: seulement service role peut accéder (via edge function)
DROP POLICY IF EXISTS "Service role full access on local_users" ON public.local_users;
DROP POLICY IF EXISTS "Service role full access on user_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Service role full access on login_attempts" ON public.login_attempts;

CREATE POLICY "Service role full access on local_users" ON public.local_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on user_sessions" ON public.user_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on login_attempts" ON public.login_attempts
  FOR ALL USING (true) WITH CHECK (true);



-- ========================================
-- MIGRATION: 20260128090145_690633de-c4f6-4fc3-97fd-e0dc7777564f.sql
-- ========================================

-- Create programmations table for monthly budget planning
CREATE TABLE IF NOT EXISTS public.programmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ordre INTEGER,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  rubrique_id UUID REFERENCES public.rubriques(id),
  designation TEXT NOT NULL,
  montant_prevu NUMERIC NOT NULL DEFAULT 0,
  montant_lettre TEXT,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Service role full access on programmations" ON public.programmations;
CREATE POLICY "Service role full access on programmations"
  ON public.programmations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_programmations_mois_annee ON public.programmations(annee DESC, mois DESC);
CREATE INDEX IF NOT EXISTS idx_programmations_rubrique ON public.programmations(rubrique_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_programmations_updated_at ON public.programmations;
CREATE TRIGGER update_programmations_updated_at
  BEFORE UPDATE ON public.programmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



-- ========================================
-- MIGRATION: 20260129191830_9d208fe1-8b29-43c3-b20b-cc66db6e78ac.sql
-- ========================================

-- Create report_templates table for saving customized report configurations
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    created_by UUID NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own templates and public templates
DROP POLICY IF EXISTS "Users can view own and public templates" ON public.report_templates;
CREATE POLICY "Users can view own and public templates"
ON public.report_templates
FOR SELECT
USING (created_by = auth.uid() OR is_public = true);

-- Policy: Users can create their own templates
DROP POLICY IF EXISTS "Users can create own templates" ON public.report_templates;
CREATE POLICY "Users can create own templates"
ON public.report_templates
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own templates
DROP POLICY IF EXISTS "Users can update own templates" ON public.report_templates;
CREATE POLICY "Users can update own templates"
ON public.report_templates
FOR UPDATE
USING (created_by = auth.uid());

-- Policy: Users can delete their own templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.report_templates;
CREATE POLICY "Users can delete own templates"
ON public.report_templates
FOR DELETE
USING (created_by = auth.uid());

-- Service role full access for edge functions
DROP POLICY IF EXISTS "Service role full access on report_templates" ON public.report_templates;
CREATE POLICY "Service role full access on report_templates"
ON public.report_templates
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


