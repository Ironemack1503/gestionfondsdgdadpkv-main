


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'instructeur',
    'observateur'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'brouillon',
    'valide',
    'archive'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'recette',
    'depense'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'instructeur')
  )
$$;


ALTER FUNCTION "public"."can_edit"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_programmation_numero_ordre"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_programmation_numero_ordre"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_local_user_role"() RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT lu.role 
    FROM public.local_users lu
    INNER JOIN public.user_sessions us ON lu.id = us.user_id
    WHERE us.expires_at > now()
      AND lu.is_active = true
    ORDER BY us.created_at DESC
    LIMIT 1
$$;


ALTER FUNCTION "public"."get_local_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_numero_ordre"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN nextval('transactions_numero_ordre_seq');
END;
$$;


ALTER FUNCTION "public"."get_next_numero_ordre"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_next_numero_ordre"() IS 'Retourne le prochain num??ro d''ordre s??quentiel pour les transactions';



CREATE OR REPLACE FUNCTION "public"."get_request_session_token"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT NULLIF(
    (COALESCE(current_setting('request.headers', true), '{}')::jsonb ->> 'x-session-token'),
    ''
  )
$$;


ALTER FUNCTION "public"."get_request_session_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_session_user_id"("session_token" "text") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT user_id 
    FROM public.user_sessions 
    WHERE token = session_token 
      AND expires_at > now()
    LIMIT 1
$$;


ALTER FUNCTION "public"."get_session_user_id"("session_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_session_user_role"("session_token" "text") RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT lu.role 
    FROM public.local_users lu
    INNER JOIN public.user_sessions us ON lu.id = us.user_id
    WHERE us.token = session_token 
      AND us.expires_at > now()
      AND lu.is_active = true
    LIMIT 1
$$;


ALTER FUNCTION "public"."get_session_user_role"("session_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_any_role"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
    SELECT _user_id IS NOT NULL
$$;


ALTER FUNCTION "public"."has_any_role"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
    SELECT _user_id IS NOT NULL
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_local_authenticated"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public.local_user_id() IS NOT NULL
$$;


ALTER FUNCTION "public"."is_local_authenticated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."local_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public.get_session_user_id(public.get_request_session_token())
$$;


ALTER FUNCTION "public"."local_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."local_user_role"() RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public.get_session_user_role(public.get_request_session_token())
$$;


ALTER FUNCTION "public"."local_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_depense_numero_ordre"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.numero_bon IS NULL THEN
    NEW.numero_bon := get_next_numero_ordre();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_depense_numero_ordre"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_recette_numero_ordre"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.numero_bon IS NULL THEN
    NEW.numero_bon := get_next_numero_ordre();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_recette_numero_ordre"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_single_default_template"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- If this template is being set as default, unset all other defaults
  IF NEW.is_default = true THEN
    UPDATE public.report_templates
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_single_default_template"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alert_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" numeric NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."alert_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "severity" "text" DEFAULT 'warning'::"text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "is_dismissed" boolean DEFAULT false,
    "related_record_id" "uuid",
    "related_table" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changed_fields" "text"[],
    "user_id" "uuid" NOT NULL,
    "user_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_logs_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "libelle" "text" NOT NULL,
    "type" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contentieux" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "libelle" "text" NOT NULL,
    "montant" numeric(15,2) DEFAULT 0,
    "rubrique_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contentieux" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."depenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "numero_bon" integer DEFAULT "public"."get_next_numero_ordre"(),
    "rubrique_id" "uuid",
    "date_transaction" "date" DEFAULT CURRENT_DATE,
    "heure" time without time zone DEFAULT CURRENT_TIME NOT NULL,
    "beneficiaire" "text",
    "motif" "text",
    "montant" numeric(15,2),
    "montant_lettre" "text",
    "observation" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "Code_Service" "text",
    "Motif_Bs" "text",
    "Num_Auto_Bc" "text",
    "NBEO" "text",
    "MT_Chiffre_BS" "text",
    "Date_Sortie1" "text",
    "Num_BS_Caisse" "text",
    "Benef" "text",
    "Heure_s" "text",
    "Date_Sortie" "text",
    "MT_Lttre_BS" "text",
    "SUPPRIM" "text",
    "Code_Rubrique" "text",
    "COD" "text",
    "libelle" "text",
    "imp_code" "text",
    CONSTRAINT "depenses_montant_check" CHECK (("montant" >= (0)::numeric))
);

ALTER TABLE ONLY "public"."depenses" REPLICA IDENTITY FULL;


ALTER TABLE "public"."depenses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."depenses_numero_bon_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."depenses_numero_bon_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."depenses_numero_bon_seq" OWNED BY "public"."depenses"."numero_bon";



CREATE TABLE IF NOT EXISTS "public"."feuilles_caisse" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "solde_initial" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_recettes" numeric(15,2) DEFAULT 0 NOT NULL,
    "total_depenses" numeric(15,2) DEFAULT 0 NOT NULL,
    "solde_final" numeric(15,2) GENERATED ALWAYS AS ((("solde_initial" + "total_recettes") - "total_depenses")) STORED,
    "is_closed" boolean DEFAULT false,
    "closed_by" "uuid",
    "closed_at" timestamp with time zone,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."feuilles_caisse" REPLICA IDENTITY FULL;


ALTER TABLE "public"."feuilles_caisse" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" character varying(50) NOT NULL,
    "password_hash" "text" NOT NULL,
    "role" "public"."app_role" DEFAULT 'observateur'::"public"."app_role" NOT NULL,
    "full_name" character varying(255),
    "is_active" boolean DEFAULT true,
    "is_protected" boolean DEFAULT false,
    "failed_attempts" integer DEFAULT 0,
    "locked_until" timestamp with time zone,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."local_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" character varying(50),
    "success" boolean NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."login_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_email" "text",
    "user_name" "text",
    "login_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "text",
    "user_agent" "text"
);


ALTER TABLE "public"."login_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parametres" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cle" character varying(50) NOT NULL,
    "valeur" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."parametres" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parametres_mise_en_forme" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "logo_url" "text",
    "titre_entete" "text" DEFAULT 'DIRECTION GÉNÉRALE DES DOUANES ET ACCISES'::"text",
    "sous_titre" "text" DEFAULT 'Rapport Financier'::"text",
    "contenu_pied_page" "text" DEFAULT 'DGDA - Document officiel'::"text",
    "afficher_numero_page" boolean DEFAULT true,
    "afficher_date" boolean DEFAULT true,
    "afficher_nom_institution" boolean DEFAULT true,
    "police" "text" DEFAULT 'helvetica'::"text",
    "taille_police" integer DEFAULT 10,
    "couleur_principale" "text" DEFAULT '#1e40af'::"text",
    "marges_haut" numeric DEFAULT 15,
    "marges_bas" numeric DEFAULT 15,
    "marges_gauche" numeric DEFAULT 10,
    "marges_droite" numeric DEFAULT 10,
    "orientation" "text" DEFAULT 'portrait'::"text",
    "position_logo" "text" DEFAULT 'gauche'::"text",
    "filigrane_actif" boolean DEFAULT true,
    "filigrane_texte" "text" DEFAULT 'DGDA'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "ligne_entete_1" "text" DEFAULT 'République Démocratique du Congo'::"text",
    "ligne_entete_2" "text" DEFAULT 'Ministère des Finances'::"text",
    "ligne_entete_3" "text" DEFAULT 'Direction Générale des Douanes et Accises'::"text",
    "ligne_entete_4" "text" DEFAULT 'Direction Provinciale de Kinshasa-Ville'::"text",
    "ligne_pied_1" "text" DEFAULT 'Tous mobilisés pour une douane d''action et d''excellence !'::"text",
    "ligne_pied_2" "text" DEFAULT 'Immeuble DGDA, Place LE ROYAL, Bld du 30 Juin, Kinshasa/Gombe'::"text",
    "ligne_pied_3" "text" DEFAULT 'B.P.8248 KIN I / Tél. : +243(0) 818 968 481 - +243 (0) 821 920 215'::"text",
    "ligne_pied_4" "text" DEFAULT 'Email : info@douane.gouv.cd ; contact@douane.gouv.cd - Web : https://www.douanes.gouv.cd'::"text",
    "position_tableau" "text" DEFAULT 'gauche'::"text",
    "alignement_contenu" "text" DEFAULT 'gauche'::"text",
    "espacement_tableau" integer DEFAULT 10,
    "couleur_entete_tableau" "text" DEFAULT '#3b82f6'::"text",
    "couleur_texte_entete" "text" DEFAULT '#ffffff'::"text",
    "couleur_lignes_alternees" "text" DEFAULT '#f5f7fa'::"text"
);


ALTER TABLE "public"."parametres_mise_en_forme" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "username" character varying(50) NOT NULL,
    "full_name" character varying(100),
    "is_active" boolean DEFAULT true NOT NULL,
    "is_locked" boolean DEFAULT false NOT NULL,
    "failed_login_attempts" integer DEFAULT 0 NOT NULL,
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programmation_depenses" (
    "id" integer NOT NULL,
    "numero" integer NOT NULL,
    "libelle" "text" NOT NULL,
    "montant" numeric(18,2) DEFAULT 0 NOT NULL,
    "mois" "text" NOT NULL,
    "annee" "text" NOT NULL,
    "code" "text",
    "comptable" "text",
    "daf" "text",
    "dp" "text",
    "date_programmation" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."programmation_depenses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."programmation_depenses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."programmation_depenses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."programmation_depenses_id_seq" OWNED BY "public"."programmation_depenses"."id";



CREATE TABLE IF NOT EXISTS "public"."programmations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mois" integer NOT NULL,
    "annee" integer NOT NULL,
    "rubrique_id" "uuid",
    "designation" "text" NOT NULL,
    "montant_prevu" numeric(15,2) NOT NULL,
    "montant_lettre" "text",
    "is_validated" boolean DEFAULT false,
    "validated_by" "uuid",
    "validated_at" timestamp with time zone,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "numero_ordre" integer,
    CONSTRAINT "programmations_annee_check" CHECK (("annee" >= 2020)),
    CONSTRAINT "programmations_mois_check" CHECK ((("mois" >= 1) AND ("mois" <= 12))),
    CONSTRAINT "programmations_montant_prevu_check" CHECK (("montant_prevu" >= (0)::numeric))
);

ALTER TABLE ONLY "public"."programmations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."programmations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recettes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "numero_bon" integer DEFAULT "public"."get_next_numero_ordre"(),
    "date_transaction" "date" DEFAULT CURRENT_DATE,
    "heure" time without time zone DEFAULT CURRENT_TIME NOT NULL,
    "motif" "text",
    "provenance" "text",
    "montant" numeric(15,2),
    "montant_lettre" "text",
    "observation" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "Num_BE_Caisse" "text",
    "Code_Rubrique" "text",
    "Motif_BE" "text",
    "Heure_e" "text",
    "Code_Service" "text",
    "Date_Entree1" "text",
    "MT_Chiffre_BE" "text",
    "Num_Auto_BE" "text",
    "SUPPRIM" "text",
    "Date_Entree" "text",
    "Recu_De" "text",
    "MT_Lttre_BE" "text",
    "libelle" "text",
    CONSTRAINT "recettes_montant_check" CHECK (("montant" >= (0)::numeric))
);

ALTER TABLE ONLY "public"."recettes" REPLICA IDENTITY FULL;


ALTER TABLE "public"."recettes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."recettes_numero_bon_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."recettes_numero_bon_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."recettes_numero_bon_seq" OWNED BY "public"."recettes"."numero_bon";



CREATE TABLE IF NOT EXISTS "public"."report_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "config" "jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_public" boolean DEFAULT false,
    "is_default" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."report_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resultats" (
    "id" integer NOT NULL,
    "numero" integer,
    "code" "text",
    "libelle" "text",
    "montant_recette" numeric(18,2) DEFAULT 0,
    "montant_depense" numeric(18,2) DEFAULT 0,
    "mois_annee" "text",
    "annee" integer,
    "num" integer DEFAULT 0,
    "categorie" "text",
    "categorie_depense" "text",
    "montant_lettres" "text",
    "comptable" "text",
    "daf" "text",
    "directeur_provincial" "text",
    "date_feuille" "text",
    "titre" "text",
    "cod" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resultats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."resultats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."resultats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."resultats_id_seq" OWNED BY "public"."resultats"."id";



CREATE TABLE IF NOT EXISTS "public"."rubriques" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text",
    "libelle" "text",
    "categorie" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "no_beo" "text",
    "imp" "text",
    "type" "text",
    "imputation" "text",
    "categorie_id" "uuid",
    "Code_Rubrique" "text",
    "Rubrique" "text",
    "Imputation" "text",
    "Type" "text"
);

ALTER TABLE ONLY "public"."rubriques" REPLICA IDENTITY FULL;


ALTER TABLE "public"."rubriques" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(20) NOT NULL,
    "libelle" character varying(200) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."signataires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "matricule" "text",
    "nom" "text" NOT NULL,
    "fonction" "text",
    "grade" "text",
    "type_signature" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."signataires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_type" "public"."transaction_type" NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "type_signature" character varying(20) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "signature_hash" "text",
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "signatures_type_signature_check" CHECK ((("type_signature")::"text" = ANY ((ARRAY['COMPT'::character varying, 'DAF'::character varying, 'DP'::character varying])::"text"[])))
);


ALTER TABLE "public"."signatures" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."transactions_numero_ordre_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."transactions_numero_ordre_seq" OWNER TO "postgres";


COMMENT ON SEQUENCE "public"."transactions_numero_ordre_seq" IS 'S??quence unifi??e pour le num??ro d''ordre (N??d''ord) des recettes et d??penses dans la Feuille de Caisse';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'observateur'::"public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."programmation_depenses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."programmation_depenses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."resultats" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."resultats_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."alert_settings"
    ADD CONSTRAINT "alert_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alert_settings"
    ADD CONSTRAINT "alert_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contentieux"
    ADD CONSTRAINT "contentieux_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."depenses"
    ADD CONSTRAINT "depenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feuilles_caisse"
    ADD CONSTRAINT "feuilles_caisse_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."feuilles_caisse"
    ADD CONSTRAINT "feuilles_caisse_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."local_users"
    ADD CONSTRAINT "local_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."local_users"
    ADD CONSTRAINT "local_users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_history"
    ADD CONSTRAINT "login_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parametres"
    ADD CONSTRAINT "parametres_cle_key" UNIQUE ("cle");



ALTER TABLE ONLY "public"."parametres_mise_en_forme"
    ADD CONSTRAINT "parametres_mise_en_forme_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parametres"
    ADD CONSTRAINT "parametres_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."programmation_depenses"
    ADD CONSTRAINT "programmation_depenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programmations"
    ADD CONSTRAINT "programmations_mois_annee_rubrique_id_key" UNIQUE ("mois", "annee", "rubrique_id");



ALTER TABLE ONLY "public"."programmations"
    ADD CONSTRAINT "programmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recettes"
    ADD CONSTRAINT "recettes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_templates"
    ADD CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resultats"
    ADD CONSTRAINT "resultats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rubriques"
    ADD CONSTRAINT "rubriques_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."rubriques"
    ADD CONSTRAINT "rubriques_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."signataires"
    ADD CONSTRAINT "signataires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."signatures"
    ADD CONSTRAINT "signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."signatures"
    ADD CONSTRAINT "signatures_transaction_id_type_signature_key" UNIQUE ("transaction_id", "type_signature");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_token_key" UNIQUE ("token");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_table_record" ON "public"."audit_logs" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_depenses_date" ON "public"."depenses" USING "btree" ("date_transaction");



CREATE INDEX "idx_depenses_rubrique_id" ON "public"."depenses" USING "btree" ("rubrique_id");



CREATE INDEX "idx_depenses_user_id" ON "public"."depenses" USING "btree" ("user_id");



CREATE INDEX "idx_feuilles_caisse_date" ON "public"."feuilles_caisse" USING "btree" ("date");



CREATE INDEX "idx_local_users_is_active" ON "public"."local_users" USING "btree" ("is_active");



CREATE INDEX "idx_local_users_username" ON "public"."local_users" USING "btree" ("username");



CREATE INDEX "idx_login_attempts_created" ON "public"."login_attempts" USING "btree" ("created_at");



CREATE INDEX "idx_login_attempts_username" ON "public"."login_attempts" USING "btree" ("username");



CREATE INDEX "idx_login_history_login_at" ON "public"."login_history" USING "btree" ("login_at" DESC);



CREATE INDEX "idx_login_history_user_id" ON "public"."login_history" USING "btree" ("user_id");



CREATE INDEX "idx_programmations_mois_annee" ON "public"."programmations" USING "btree" ("mois", "annee");



CREATE INDEX "idx_programmations_rubrique" ON "public"."programmations" USING "btree" ("rubrique_id");



CREATE INDEX "idx_recettes_date" ON "public"."recettes" USING "btree" ("date_transaction");



CREATE INDEX "idx_recettes_user_id" ON "public"."recettes" USING "btree" ("user_id");



CREATE INDEX "idx_report_templates_default" ON "public"."report_templates" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_rubriques_imp" ON "public"."rubriques" USING "btree" ("imp");



CREATE INDEX "idx_rubriques_no_beo" ON "public"."rubriques" USING "btree" ("no_beo");



CREATE INDEX "idx_user_sessions_expires" ON "public"."user_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_user_sessions_token" ON "public"."user_sessions" USING "btree" ("token");



CREATE OR REPLACE TRIGGER "depenses_set_numero_ordre" BEFORE INSERT ON "public"."depenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_depense_numero_ordre"();



CREATE OR REPLACE TRIGGER "ensure_single_default_template" BEFORE INSERT OR UPDATE ON "public"."report_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_single_default_template"();



CREATE OR REPLACE TRIGGER "recettes_set_numero_ordre" BEFORE INSERT ON "public"."recettes" FOR EACH ROW EXECUTE FUNCTION "public"."set_recette_numero_ordre"();



CREATE OR REPLACE TRIGGER "set_programmation_numero_ordre" BEFORE INSERT ON "public"."programmations" FOR EACH ROW WHEN (("new"."numero_ordre" IS NULL)) EXECUTE FUNCTION "public"."generate_programmation_numero_ordre"();



CREATE OR REPLACE TRIGGER "update_alert_settings_updated_at" BEFORE UPDATE ON "public"."alert_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_depenses_updated_at" BEFORE UPDATE ON "public"."depenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_feuilles_caisse_updated_at" BEFORE UPDATE ON "public"."feuilles_caisse" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_local_users_updated_at" BEFORE UPDATE ON "public"."local_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parametres_mise_en_forme_updated_at" BEFORE UPDATE ON "public"."parametres_mise_en_forme" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_parametres_updated_at" BEFORE UPDATE ON "public"."parametres" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_programmations_updated_at" BEFORE UPDATE ON "public"."programmations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_recettes_updated_at" BEFORE UPDATE ON "public"."recettes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_report_templates_updated_at" BEFORE UPDATE ON "public"."report_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rubriques_updated_at" BEFORE UPDATE ON "public"."rubriques" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."depenses"
    ADD CONSTRAINT "depenses_rubrique_id_fkey" FOREIGN KEY ("rubrique_id") REFERENCES "public"."rubriques"("id");



ALTER TABLE ONLY "public"."programmations"
    ADD CONSTRAINT "programmations_rubrique_id_fkey" FOREIGN KEY ("rubrique_id") REFERENCES "public"."rubriques"("id");



ALTER TABLE ONLY "public"."rubriques"
    ADD CONSTRAINT "rubriques_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."local_users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin and Instructeur can create depenses" ON "public"."depenses" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"text") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"text")));



CREATE POLICY "Admin and Instructeur can create feuilles_caisse" ON "public"."feuilles_caisse" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"text") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"text")));



CREATE POLICY "Admin and Instructeur can create recettes" ON "public"."recettes" FOR INSERT TO "authenticated" WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"text") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"text")));



CREATE POLICY "Admin and Instructeur can update depenses" ON "public"."depenses" FOR UPDATE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"text") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"text")));



CREATE POLICY "Admin and Instructeur can update feuilles_caisse" ON "public"."feuilles_caisse" FOR UPDATE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"text") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"text")));



CREATE POLICY "Admin and Instructeur can update recettes" ON "public"."recettes" FOR UPDATE TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"text") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"text")));



CREATE POLICY "Admin and Instructeur can update report settings" ON "public"."parametres_mise_en_forme" FOR UPDATE USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"public"."app_role")));



CREATE POLICY "Admin and instructeur can manage alerts" ON "public"."alerts" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR "public"."has_role"("auth"."uid"(), 'instructeur'::"public"."app_role")));



CREATE POLICY "Admin can create programmations" ON "public"."programmations" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can delete programmations" ON "public"."programmations" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can delete report settings" ON "public"."parametres_mise_en_forme" FOR DELETE USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admin can delete rubriques" ON "public"."rubriques" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can delete services" ON "public"."services" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can insert report settings" ON "public"."parametres_mise_en_forme" FOR INSERT WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admin can insert rubriques" ON "public"."rubriques" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can insert services" ON "public"."services" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can manage all templates" ON "public"."report_templates" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admin can update programmations" ON "public"."programmations" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can update rubriques" ON "public"."rubriques" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admin can update services" ON "public"."services" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can delete depenses" ON "public"."depenses" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can delete recettes" ON "public"."recettes" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can manage parametres" ON "public"."parametres" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can manage profiles" ON "public"."profiles" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can manage rubriques" ON "public"."rubriques" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can manage services" ON "public"."services" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can view audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can view login history" ON "public"."login_history" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Allow anon delete user_sessions" ON "public"."user_sessions" FOR DELETE TO "anon" USING (true);



CREATE POLICY "Allow anon insert login_attempts" ON "public"."login_attempts" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon insert user_sessions" ON "public"."user_sessions" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow anon read local_users" ON "public"."local_users" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon select user_sessions" ON "public"."user_sessions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow anon update local_users" ON "public"."local_users" FOR UPDATE TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Allow auth read local_users" ON "public"."local_users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow delete depenses" ON "public"."depenses" FOR DELETE USING (true);



CREATE POLICY "Allow delete feuilles_caisse" ON "public"."feuilles_caisse" FOR DELETE USING (true);



CREATE POLICY "Allow delete programmations" ON "public"."programmations" FOR DELETE USING (true);



CREATE POLICY "Allow delete recettes" ON "public"."recettes" FOR DELETE USING (true);



CREATE POLICY "Allow delete rubriques" ON "public"."rubriques" FOR DELETE USING (true);



CREATE POLICY "Allow insert depenses" ON "public"."depenses" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert feuilles_caisse" ON "public"."feuilles_caisse" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert programmations" ON "public"."programmations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert recettes" ON "public"."recettes" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert rubriques" ON "public"."rubriques" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow select depenses" ON "public"."depenses" FOR SELECT USING (true);



CREATE POLICY "Allow select feuilles_caisse" ON "public"."feuilles_caisse" FOR SELECT USING (true);



CREATE POLICY "Allow select programmations" ON "public"."programmations" FOR SELECT USING (true);



CREATE POLICY "Allow select recettes" ON "public"."recettes" FOR SELECT USING (true);



CREATE POLICY "Allow select rubriques" ON "public"."rubriques" FOR SELECT USING (true);



CREATE POLICY "Allow update depenses" ON "public"."depenses" FOR UPDATE USING (true);



CREATE POLICY "Allow update feuilles_caisse" ON "public"."feuilles_caisse" FOR UPDATE USING (true);



CREATE POLICY "Allow update programmations" ON "public"."programmations" FOR UPDATE USING (true);



CREATE POLICY "Allow update recettes" ON "public"."recettes" FOR UPDATE USING (true);



CREATE POLICY "Allow update rubriques" ON "public"."rubriques" FOR UPDATE USING (true);



CREATE POLICY "Authenticated users can create audit logs" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"text")));



CREATE POLICY "Authenticated users can view alert settings" ON "public"."alert_settings" FOR SELECT USING ("public"."has_any_role"("auth"."uid"()));



CREATE POLICY "Authenticated users can view alerts" ON "public"."alerts" FOR SELECT USING ("public"."has_any_role"("auth"."uid"()));



CREATE POLICY "Authenticated users can view feuilles" ON "public"."feuilles_caisse" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view report settings" ON "public"."parametres_mise_en_forme" FOR SELECT USING ("public"."has_any_role"("auth"."uid"()));



CREATE POLICY "Authenticated users can view signatures" ON "public"."signatures" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Editors can create depenses" ON "public"."depenses" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_edit"("auth"."uid"()));



CREATE POLICY "Editors can create recettes" ON "public"."recettes" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_edit"("auth"."uid"()));



CREATE POLICY "Editors can create signatures" ON "public"."signatures" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_edit"("auth"."uid"()));



CREATE POLICY "Editors can manage feuilles" ON "public"."feuilles_caisse" TO "authenticated" USING ("public"."can_edit"("auth"."uid"()));



CREATE POLICY "Editors can update depenses" ON "public"."depenses" FOR UPDATE TO "authenticated" USING ("public"."can_edit"("auth"."uid"()));



CREATE POLICY "Editors can update recettes" ON "public"."recettes" FOR UPDATE TO "authenticated" USING ("public"."can_edit"("auth"."uid"()));



CREATE POLICY "Everyone can view parametres" ON "public"."parametres" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Everyone can view rubriques" ON "public"."rubriques" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Everyone can view services" ON "public"."services" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Local admin can create programmations" ON "public"."programmations" FOR INSERT WITH CHECK (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can delete depenses" ON "public"."depenses" FOR DELETE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can delete feuilles_caisse" ON "public"."feuilles_caisse" FOR DELETE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can delete programmations" ON "public"."programmations" FOR DELETE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can delete recettes" ON "public"."recettes" FOR DELETE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can delete rubriques" ON "public"."rubriques" FOR DELETE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can delete services" ON "public"."services" FOR DELETE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can insert rubriques" ON "public"."rubriques" FOR INSERT WITH CHECK (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can insert services" ON "public"."services" FOR INSERT WITH CHECK (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can update programmations" ON "public"."programmations" FOR UPDATE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can update rubriques" ON "public"."rubriques" FOR UPDATE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin can update services" ON "public"."services" FOR UPDATE USING (("public"."local_user_role"() = 'admin'::"public"."app_role"));



CREATE POLICY "Local admin/instructeur can create depenses" ON "public"."depenses" FOR INSERT WITH CHECK (("public"."local_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'instructeur'::"public"."app_role"])));



CREATE POLICY "Local admin/instructeur can create feuilles_caisse" ON "public"."feuilles_caisse" FOR INSERT WITH CHECK (("public"."local_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'instructeur'::"public"."app_role"])));



CREATE POLICY "Local admin/instructeur can create recettes" ON "public"."recettes" FOR INSERT WITH CHECK (("public"."local_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'instructeur'::"public"."app_role"])));



CREATE POLICY "Local admin/instructeur can update depenses" ON "public"."depenses" FOR UPDATE USING (("public"."local_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'instructeur'::"public"."app_role"])));



CREATE POLICY "Local admin/instructeur can update feuilles_caisse" ON "public"."feuilles_caisse" FOR UPDATE USING (("public"."local_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'instructeur'::"public"."app_role"])));



CREATE POLICY "Local admin/instructeur can update recettes" ON "public"."recettes" FOR UPDATE USING (("public"."local_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'instructeur'::"public"."app_role"])));



CREATE POLICY "Local users can view depenses" ON "public"."depenses" FOR SELECT USING ("public"."is_local_authenticated"());



CREATE POLICY "Local users can view feuilles_caisse" ON "public"."feuilles_caisse" FOR SELECT USING ("public"."is_local_authenticated"());



CREATE POLICY "Local users can view programmations" ON "public"."programmations" FOR SELECT USING ("public"."is_local_authenticated"());



CREATE POLICY "Local users can view recettes" ON "public"."recettes" FOR SELECT USING ("public"."is_local_authenticated"());



CREATE POLICY "Local users can view rubriques" ON "public"."rubriques" FOR SELECT USING ("public"."is_local_authenticated"());



CREATE POLICY "Local users can view services" ON "public"."services" FOR SELECT USING ("public"."is_local_authenticated"());



CREATE POLICY "Only admin can delete depenses" ON "public"."depenses" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Only admin can delete feuilles_caisse" ON "public"."feuilles_caisse" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Only admin can delete recettes" ON "public"."recettes" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Only admin can manage alert settings" ON "public"."alert_settings" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Service role can manage all users" ON "public"."local_users" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage login attempts" ON "public"."login_attempts" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage sessions" ON "public"."user_sessions" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access on local_users" ON "public"."local_users" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access on login_attempts" ON "public"."login_attempts" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access on programmations" ON "public"."programmations" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access on report_templates" ON "public"."report_templates" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access on user_sessions" ON "public"."user_sessions" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create own templates" ON "public"."report_templates" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete own templates" ON "public"."report_templates" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can insert their own login" ON "public"."login_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own templates" ON "public"."report_templates" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view own and public templates" ON "public"."report_templates" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR ("is_public" = true)));



CREATE POLICY "Users can view their own role" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."has_role"("auth"."uid"(), 'admin'::"text")));



ALTER TABLE "public"."alert_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow_all_pgm" ON "public"."programmation_depenses" USING (true) WITH CHECK (true);



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contentieux" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."depenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feuilles_caisse" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."local_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."login_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parametres" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parametres_mise_en_forme" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programmation_depenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programmations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recettes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rubriques" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."signataires" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."depenses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."feuilles_caisse";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."programmations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recettes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rubriques";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."can_edit"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_programmation_numero_ordre"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_programmation_numero_ordre"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_programmation_numero_ordre"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_local_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_local_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_local_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_numero_ordre"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_numero_ordre"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_numero_ordre"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_request_session_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_request_session_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_request_session_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_user_id"("session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_session_user_id"("session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_user_id"("session_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_user_role"("session_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_session_user_role"("session_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_user_role"("session_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_any_role"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_any_role"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_any_role"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_local_authenticated"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_local_authenticated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_local_authenticated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."local_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."local_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."local_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."local_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."local_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."local_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_depense_numero_ordre"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_depense_numero_ordre"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_depense_numero_ordre"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_recette_numero_ordre"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_recette_numero_ordre"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_recette_numero_ordre"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_single_default_template"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_single_default_template"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_single_default_template"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."alert_settings" TO "anon";
GRANT ALL ON TABLE "public"."alert_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_settings" TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."contentieux" TO "anon";
GRANT ALL ON TABLE "public"."contentieux" TO "authenticated";
GRANT ALL ON TABLE "public"."contentieux" TO "service_role";



GRANT ALL ON TABLE "public"."depenses" TO "anon";
GRANT ALL ON TABLE "public"."depenses" TO "authenticated";
GRANT ALL ON TABLE "public"."depenses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."depenses_numero_bon_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."depenses_numero_bon_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."depenses_numero_bon_seq" TO "service_role";



GRANT ALL ON TABLE "public"."feuilles_caisse" TO "anon";
GRANT ALL ON TABLE "public"."feuilles_caisse" TO "authenticated";
GRANT ALL ON TABLE "public"."feuilles_caisse" TO "service_role";



GRANT ALL ON TABLE "public"."local_users" TO "anon";
GRANT ALL ON TABLE "public"."local_users" TO "authenticated";
GRANT ALL ON TABLE "public"."local_users" TO "service_role";



GRANT ALL ON TABLE "public"."login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."login_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."login_history" TO "anon";
GRANT ALL ON TABLE "public"."login_history" TO "authenticated";
GRANT ALL ON TABLE "public"."login_history" TO "service_role";



GRANT ALL ON TABLE "public"."parametres" TO "anon";
GRANT ALL ON TABLE "public"."parametres" TO "authenticated";
GRANT ALL ON TABLE "public"."parametres" TO "service_role";



GRANT ALL ON TABLE "public"."parametres_mise_en_forme" TO "anon";
GRANT ALL ON TABLE "public"."parametres_mise_en_forme" TO "authenticated";
GRANT ALL ON TABLE "public"."parametres_mise_en_forme" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."programmation_depenses" TO "anon";
GRANT ALL ON TABLE "public"."programmation_depenses" TO "authenticated";
GRANT ALL ON TABLE "public"."programmation_depenses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."programmation_depenses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."programmation_depenses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."programmation_depenses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."programmations" TO "anon";
GRANT ALL ON TABLE "public"."programmations" TO "authenticated";
GRANT ALL ON TABLE "public"."programmations" TO "service_role";



GRANT ALL ON TABLE "public"."recettes" TO "anon";
GRANT ALL ON TABLE "public"."recettes" TO "authenticated";
GRANT ALL ON TABLE "public"."recettes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recettes_numero_bon_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recettes_numero_bon_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recettes_numero_bon_seq" TO "service_role";



GRANT ALL ON TABLE "public"."report_templates" TO "anon";
GRANT ALL ON TABLE "public"."report_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."report_templates" TO "service_role";



GRANT ALL ON TABLE "public"."resultats" TO "anon";
GRANT ALL ON TABLE "public"."resultats" TO "authenticated";
GRANT ALL ON TABLE "public"."resultats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."resultats_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."resultats_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."resultats_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rubriques" TO "anon";
GRANT ALL ON TABLE "public"."rubriques" TO "authenticated";
GRANT ALL ON TABLE "public"."rubriques" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."signataires" TO "anon";
GRANT ALL ON TABLE "public"."signataires" TO "authenticated";
GRANT ALL ON TABLE "public"."signataires" TO "service_role";



GRANT ALL ON TABLE "public"."signatures" TO "anon";
GRANT ALL ON TABLE "public"."signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."signatures" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transactions_numero_ordre_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transactions_numero_ordre_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transactions_numero_ordre_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































