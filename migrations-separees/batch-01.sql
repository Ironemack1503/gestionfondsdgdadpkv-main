-- ========================================
-- BATCH 1 - 20251217101912_c7bda6ad-e248-4beb-bd7d-068e6f8aaac0.sql à 20251217160908_206a1fb7-4414-450c-9f63-6d59f3e44b40.sql
-- ========================================


-- ========================================
-- MIGRATION: 20251217101912_c7bda6ad-e248-4beb-bd7d-068e6f8aaac0.sql
-- ========================================

-- Minimal auth helper functions for early migrations
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT _user_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT _user_id IS NOT NULL
$$;

-- Base role enum used by policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'instructeur', 'observateur');
    END IF;
END $$;

-- Create rubriques (expense categories) table
CREATE TABLE public.rubriques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    libelle TEXT NOT NULL,
    categorie TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recettes (receipts) table
CREATE TABLE public.recettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    motif TEXT NOT NULL,
    provenance TEXT NOT NULL,
    montant NUMERIC(15, 2) NOT NULL CHECK (montant >= 0),
    montant_lettre TEXT,
    observation TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create depenses (expenses) table
CREATE TABLE public.depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_bon SERIAL,
    rubrique_id UUID NOT NULL REFERENCES public.rubriques(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    heure TIME NOT NULL DEFAULT CURRENT_TIME,
    beneficiaire TEXT NOT NULL,
    motif TEXT NOT NULL,
    montant NUMERIC(15, 2) NOT NULL CHECK (montant >= 0),
    montant_lettre TEXT,
    observation TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create programmations (monthly planning) table
CREATE TABLE public.programmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
    annee INTEGER NOT NULL CHECK (annee >= 2020),
    rubrique_id UUID NOT NULL REFERENCES public.rubriques(id),
    designation TEXT NOT NULL,
    montant_prevu NUMERIC(15, 2) NOT NULL CHECK (montant_prevu >= 0),
    montant_lettre TEXT,
    is_validated BOOLEAN DEFAULT false,
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(mois, annee, rubrique_id)
);

-- Create feuilles_caisse (cash sheets) table for daily summaries
CREATE TABLE public.feuilles_caisse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    solde_initial NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_recettes NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_depenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
    solde_final NUMERIC(15, 2) GENERATED ALWAYS AS (solde_initial + total_recettes - total_depenses) STORED,
    is_closed BOOLEAN DEFAULT false,
    closed_by UUID REFERENCES auth.users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feuilles_caisse ENABLE ROW LEVEL SECURITY;

-- RLS Policies for RUBRIQUES (admin can manage, all authenticated can view)
CREATE POLICY "Authenticated users can view rubriques" ON public.rubriques
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin can insert rubriques" ON public.rubriques
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update rubriques" ON public.rubriques
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete rubriques" ON public.rubriques
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for RECETTES (admin/instructeur can manage, all can view)
CREATE POLICY "Authenticated users can view recettes" ON public.recettes
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can create recettes" ON public.recettes
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Admin and Instructeur can update recettes" ON public.recettes
    FOR UPDATE USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Only admin can delete recettes" ON public.recettes
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for DEPENSES (admin/instructeur can manage, all can view)
CREATE POLICY "Authenticated users can view depenses" ON public.depenses
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can create depenses" ON public.depenses
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Admin and Instructeur can update depenses" ON public.depenses
    FOR UPDATE USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Only admin can delete depenses" ON public.depenses
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for PROGRAMMATIONS (admin can manage, all can view)
CREATE POLICY "Authenticated users can view programmations" ON public.programmations
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin can create programmations" ON public.programmations
    FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update programmations" ON public.programmations
    FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete programmations" ON public.programmations
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for FEUILLES_CAISSE (admin/instructeur can manage, all can view)
CREATE POLICY "Authenticated users can view feuilles_caisse" ON public.feuilles_caisse
    FOR SELECT USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and Instructeur can create feuilles_caisse" ON public.feuilles_caisse
    FOR INSERT WITH CHECK (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Admin and Instructeur can update feuilles_caisse" ON public.feuilles_caisse
    FOR UPDATE USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'instructeur')
    );

CREATE POLICY "Only admin can delete feuilles_caisse" ON public.feuilles_caisse
    FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_rubriques_updated_at
    BEFORE UPDATE ON public.rubriques
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recettes_updated_at
    BEFORE UPDATE ON public.recettes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_depenses_updated_at
    BEFORE UPDATE ON public.depenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programmations_updated_at
    BEFORE UPDATE ON public.programmations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feuilles_caisse_updated_at
    BEFORE UPDATE ON public.feuilles_caisse
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_recettes_date ON public.recettes(date);
CREATE INDEX idx_recettes_user_id ON public.recettes(user_id);
CREATE INDEX idx_depenses_date ON public.depenses(date);
CREATE INDEX idx_depenses_rubrique_id ON public.depenses(rubrique_id);
CREATE INDEX idx_depenses_user_id ON public.depenses(user_id);
CREATE INDEX idx_programmations_mois_annee ON public.programmations(mois, annee);
CREATE INDEX idx_feuilles_caisse_date ON public.feuilles_caisse(date);



-- ========================================
-- MIGRATION: 20251217104608_66a0236c-0a59-413c-9fdd-08d694df5e0d.sql
-- ========================================

-- Ensure app_role type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'instructeur', 'observateur');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT _user_id IS NOT NULL
$$;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users with roles can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (has_any_role(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);



-- ========================================
-- MIGRATION: 20251217105826_2acc1035-1d05-44fc-9ba5-53c465340c00.sql
-- ========================================

-- Table pour les paramètres d'alertes (configurés par l'admin)
CREATE TABLE public.alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les alertes générées
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'solde_bas', 'depassement_budget', 'depense_importante'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  related_record_id UUID,
  related_table TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies for alert_settings
CREATE POLICY "Authenticated users can view alert settings"
ON public.alert_settings FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Only admin can manage alert settings"
ON public.alert_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for alerts
CREATE POLICY "Authenticated users can view alerts"
ON public.alerts FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Admin and instructeur can manage alerts"
ON public.alerts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'instructeur'::app_role));

-- Insert default settings
INSERT INTO public.alert_settings (setting_key, setting_value, description) VALUES
  ('seuil_solde_bas', 100000, 'Seuil de solde bas en francs'),
  ('seuil_depense_importante', 500000, 'Seuil pour une dépense importante en francs'),
  ('pourcentage_depassement_budget', 80, 'Pourcentage de la programmation à partir duquel alerter');

-- Trigger for updated_at
CREATE TRIGGER update_alert_settings_updated_at
BEFORE UPDATE ON public.alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- ========================================
-- MIGRATION: 20251217133852_800e3957-6f2f-470f-87da-1212dae7844b.sql
-- ========================================

-- Promouvoir l'utilisateur "Administrateur" au rang d'admin
DO $$
BEGIN
	IF to_regclass('public.user_roles') IS NOT NULL THEN
		UPDATE public.user_roles 
		SET role = 'admin'::app_role 
		WHERE user_id = 'f7db4131-2d3f-4781-a528-aa6c1eafc79a';
	END IF;
END $$;



-- ========================================
-- MIGRATION: 20251217160908_206a1fb7-4414-450c-9f63-6d59f3e44b40.sql
-- ========================================

-- Create login_history table
CREATE TABLE public.login_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    user_email text,
    user_name text,
    login_at timestamp with time zone NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view login history
CREATE POLICY "Admins can view login history"
ON public.login_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert their own login record
CREATE POLICY "Users can insert their own login"
ON public.login_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at DESC);


