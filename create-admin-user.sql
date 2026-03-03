-- 👤 Création de l'utilisateur administrateur
-- Username: admin
-- Password: admin@123
-- Role: admin (administrateur)

-- Activer l'extension pgcrypto si nécessaire (pour le hash du mot de passe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Variables pour l'utilisateur
DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_username VARCHAR(50) := 'admin';
    v_password VARCHAR(100) := 'admin@123';
    v_password_hash TEXT;
    v_full_name VARCHAR(100) := 'Administrateur';
    v_role VARCHAR(20) := 'admin';
BEGIN
    -- Générer le hash du mot de passe avec bcrypt
    v_password_hash := crypt(v_password, gen_salt('bf'));

    -- 1. Insérer dans local_users (pour l'authentification locale)
    INSERT INTO public.local_users (
        id,
        username,
        password_hash,
        full_name,
        role,
        is_active,
        is_protected,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_username,
        v_password_hash,
        v_full_name,
        v_role,
        true,
        true,  -- Protégé contre la suppression
        now(),
        now()
    )
    ON CONFLICT (username) DO UPDATE
    SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = now();

    -- Récupérer l'ID réel en cas de conflit
    SELECT id INTO v_user_id FROM public.local_users WHERE username = v_username;

    -- 2. Insérer dans profiles (informations utilisateur)
    INSERT INTO public.profiles (
        user_id,
        username,
        full_name,
        is_active,
        is_locked,
        failed_login_attempts,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_username,
        v_full_name,
        true,
        false,
        0,
        now(),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active,
        updated_at = now();

    -- 3. Insérer dans user_roles (attribution du rôle)
    INSERT INTO public.user_roles (
        user_id,
        role,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_role::app_role,
        now(),
        now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        role = EXCLUDED.role,
        updated_at = now();

    RAISE NOTICE '✅ Utilisateur admin créé avec succès!';
    RAISE NOTICE 'ID: %', v_user_id;
    RAISE NOTICE 'Username: %', v_username;
    RAISE NOTICE 'Role: %', v_role;
END $$;

-- Vérification : afficher l'utilisateur créé
SELECT 
    p.user_id,
    p.username,
    p.full_name,
    ur.role,
    p.is_active,
    p.is_locked,
    lu.is_protected,
    p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
LEFT JOIN public.local_users lu ON lu.id = p.user_id
WHERE p.username = 'admin';
