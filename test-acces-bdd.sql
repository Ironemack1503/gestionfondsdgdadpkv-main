-- 🎯 Requêtes de test pour votre base de données locale
-- Sélectionnez une requête et appuyez sur Ctrl+E Ctrl+E pour l'exécuter

-- ========================================
-- 1. TEST DE CONNEXION
-- ========================================

-- Vérifier que la connexion fonctionne
SELECT 'Connexion réussie ! ✅' as statut, now() as date_heure;

-- ========================================
-- 2. LISTER TOUTES LES TABLES
-- ========================================

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 3. VUE D'ENSEMBLE DES DONNÉES
-- ========================================

SELECT 
    'profiles' as table_name,
    COUNT(*) as nombre_enregistrements
FROM profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'local_users', COUNT(*) FROM local_users
UNION ALL
SELECT 'rubriques', COUNT(*) FROM rubriques
UNION ALL
SELECT 'depenses', COUNT(*) FROM depenses
UNION ALL
SELECT 'recettes', COUNT(*) FROM recettes
UNION ALL
SELECT 'services', COUNT(*) FROM services
ORDER BY nombre_enregistrements DESC;

-- ========================================
-- 4. AFFICHER LES UTILISATEURS
-- ========================================

SELECT 
    p.user_id,
    p.username,
    p.full_name,
    ur.role,
    p.is_active,
    p.is_locked,
    p.failed_login_attempts,
    p.last_login_at,
    p.created_at
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC;

-- ========================================
-- 5. STRUCTURE D'UNE TABLE (exemple: profiles)
-- ========================================

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ========================================
-- 6. RECHERCHER UN UTILISATEUR SPÉCIFIQUE
-- ========================================

-- Remplacez 'admin' par le nom d'utilisateur recherché
SELECT 
    p.username,
    p.full_name,
    ur.role,
    p.is_active,
    p.last_login_at,
    lu.is_protected
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
LEFT JOIN local_users lu ON lu.id = p.user_id
WHERE p.username = 'admin';

-- ========================================
-- 7. STATISTIQUES PAR RÔLE
-- ========================================

SELECT 
    ur.role,
    COUNT(*) as nombre_utilisateurs,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as actifs,
    COUNT(CASE WHEN p.is_locked = true THEN 1 END) as verrouilles
FROM user_roles ur
LEFT JOIN profiles p ON p.user_id = ur.user_id
GROUP BY ur.role
ORDER BY nombre_utilisateurs DESC;

-- ========================================
-- 8. DERNIÈRES CONNEXIONS
-- ========================================

SELECT 
    p.username,
    p.full_name,
    p.last_login_at,
    CASE 
        WHEN p.last_login_at IS NULL THEN 'Jamais connecté'
        WHEN p.last_login_at > now() - interval '1 day' THEN 'Aujourd''hui'
        WHEN p.last_login_at > now() - interval '7 days' THEN 'Cette semaine'
        WHEN p.last_login_at > now() - interval '30 days' THEN 'Ce mois'
        ELSE 'Il y a longtemps'
    END as derniere_connexion
FROM profiles p
WHERE p.last_login_at IS NOT NULL
ORDER BY p.last_login_at DESC
LIMIT 10;

-- ========================================
-- 9. VÉRIFIER LES RUBRIQUES
-- ========================================

SELECT 
    code,
    libelle,
    type_rubrique,
    is_active,
    created_at
FROM rubriques
WHERE is_active = true
ORDER BY code;

-- ========================================
-- 10. COMPTER LES ENREGISTREMENTS PAR MOIS
-- ========================================

SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as mois,
    COUNT(*) as nouveaux_elements
FROM profiles
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY mois DESC;

-- ========================================
-- 💡 CONSEILS D'UTILISATION
-- ========================================
-- 1. Sélectionnez une requête (ou placez le curseur dessus)
-- 2. Appuyez sur Ctrl+E Ctrl+E pour exécuter
-- 3. Les résultats s'affichent dans un panneau en bas
-- 4. Clic droit sur les résultats → Export pour exporter en CSV/JSON
