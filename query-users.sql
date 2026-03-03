-- 📋 Liste complète des utilisateurs de l'application

-- Vue 1: Utilisateurs avec rôles (système Supabase Auth)
SELECT 
    p.user_id,
    p.username,
    p.full_name,
    ur.role,
    p.is_active,
    p.is_locked,
    p.failed_login_attempts,
    p.last_login_at,
    p.created_at,
    p.updated_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC;

-- Vue 2: Utilisateurs locaux (authentification locale)
SELECT 
    id,
    username,
    full_name,
    role,
    is_active,
    is_protected,
    failed_attempts,
    locked_until,
    last_login_at,
    created_at,
    updated_at
FROM public.local_users
ORDER BY created_at DESC;

-- Vue 3: Statistiques des utilisateurs
SELECT 
    COUNT(*) as total_utilisateurs,
    COUNT(CASE WHEN is_active = true THEN 1 END) as actifs,
    COUNT(CASE WHEN is_locked = true THEN 1 END) as verrouilles,
    COUNT(CASE WHEN last_login_at IS NOT NULL THEN 1 END) as deja_connectes
FROM public.profiles;

-- Vue 4: Répartition par rôle
SELECT 
    role,
    COUNT(*) as nombre
FROM public.user_roles
GROUP BY role
ORDER BY nombre DESC;

-- Vue 5: Dernières connexions (top 10)
SELECT 
    p.username,
    p.full_name,
    ur.role,
    p.last_login_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.last_login_at IS NOT NULL
ORDER BY p.last_login_at DESC
LIMIT 10;
