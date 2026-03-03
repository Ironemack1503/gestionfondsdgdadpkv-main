# 🎯 Guide d'accès à votre base de données locale dans VS Code

Votre base de données PostgreSQL locale est **déjà configurée** ! ✅

## 📊 Informations de connexion

| Paramètre | Valeur |
| --- | --- |
| **Serveur** | localhost |
| **Port** | 54322 |
| **Base de données** | postgres |
| **Utilisateur** | postgres |
| **Mot de passe** | postgres |
| **Nom de connexion** | Supabase Local (Port 54322) |

---

## 🚀 Comment se connecter (3 étapes)

### 1️⃣ Ouvrir SQLTools

**Option A - Via la barre latérale :**
- Cliquez sur l'icône **🗄️ Database** (SQLTools) dans la barre d'activité gauche de VS Code

**Option B - Via la palette de commandes :**
- Appuyez sur `Ctrl+Shift+P`
- Tapez "SQLTools: Show Explorer"
- Appuyez sur Entrée

### 2️⃣ Se connecter à la base

1. Dans le panneau SQLTools, vous verrez **"Supabase Local (Port 54322)"**
2. **Cliquez sur l'icône ⚡** à côté du nom de la connexion
3. La connexion s'établit (indication verte ✅)

### 3️⃣ Explorer vos tables

Une fois connecté, vous verrez l'arborescence complète :

```
📁 Supabase Local (Port 54322)
  └── 📁 postgres
      └── 📁 public
          ├── 📋 Tables
          │   ├── audit_logs
          │   ├── categories
          │   ├── contentieux
          │   ├── depenses
          │   ├── feuille_caisse
          │   ├── local_users
          │   ├── login_attempts
          │   ├── parametres
          │   ├── profiles
          │   ├── recettes
          │   ├── report_templates
          │   ├── rubriques
          │   ├── services
          │   ├── user_roles
          │   └── user_sessions
          ├── 🔧 Functions
          ├── 🔒 Policies
          └── 📊 Views
```

---

## 💡 Actions disponibles

### ✅ Visualiser les données

**Clic droit sur une table** → `Show Table Records`

Exemple : 
- Clic droit sur `profiles` → Voir tous les utilisateurs
- Clic droit sur `depenses` → Voir toutes les dépenses

### ✏️ Exécuter des requêtes SQL

**Méthode 1 - Nouvelle requête :**
1. Clic droit sur la connexion → `New SQL File`
2. Écrivez votre requête SQL
3. `Ctrl+E Ctrl+E` pour exécuter

**Méthode 2 - Fichier existant :**
1. Ouvrez un fichier `.sql` (ex: `query-users.sql`)
2. Sélectionnez une requête
3. `Ctrl+E Ctrl+E` pour exécuter

### 📝 Exemples de requêtes

```sql
-- Voir tous les utilisateurs
SELECT * FROM profiles;

-- Compter les dépenses
SELECT COUNT(*) FROM depenses;

-- Statistiques par rubrique
SELECT r.code, r.libelle, COUNT(d.id) as nb_depenses, SUM(d.montant) as total
FROM rubriques r
LEFT JOIN depenses d ON d.rubrique_id = r.id
GROUP BY r.id, r.code, r.libelle
ORDER BY total DESC;

-- Voir les utilisateurs avec leurs rôles
SELECT p.username, p.full_name, ur.role, p.is_active
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC;
```

---

## 🔧 Fonctionnalités avancées

### 📊 Exporter les résultats

Après avoir exécuté une requête :
- Clic droit sur les résultats → `Export Results`
- Formats disponibles : CSV, JSON, SQL

### 🔍 Rechercher dans les tables

1. Développez une table dans l'arborescence
2. Vous voyez toutes les colonnes avec leurs types
3. Clic sur une colonne pour voir ses propriétés

### 🔄 Rafraîchir la connexion

Si vous ajoutez de nouvelles tables ou données :
- Clic droit sur la connexion → `Refresh`

---

## 🎨 Raccourcis clavier utiles

| Action | Raccourci |
| --- | --- |
| Exécuter la requête | `Ctrl+E Ctrl+E` |
| Exécuter la requête sélectionnée | `Ctrl+E Ctrl+E` |
| Nouvelle requête SQL | `Ctrl+E Ctrl+Q` |
| Formater le SQL | `Shift+Alt+F` |
| Afficher l'historique | `Ctrl+E Ctrl+H` |

---

## 📂 Fichiers SQL disponibles

Vous avez déjà des fichiers SQL prêts à l'emploi :

- `query-users.sql` - Requêtes sur les utilisateurs
- `create-admin-user.sql` - Création d'utilisateur admin
- `test-connection.sql` - Test de connexion
- `quick-test.sql` - Tests rapides

**Pour les utiliser :**
1. Ouvrez le fichier `.sql`
2. Placez le curseur sur une requête
3. `Ctrl+E Ctrl+E`

---

## 🔗 Connexions disponibles

Vous avez **2 connexions configurées** :

### ✅ **Supabase Local (Port 54322)** ← **Utilisez celle-ci !**
- Base de données locale Supabase avec Docker
- Contient toutes vos tables et données
- Port : 54322

### 🔧 PostgreSQL Local (Port 5432)
- PostgreSQL standard (si installé séparément)
- Port : 5432
- Nécessite installation PostgreSQL locale

---

## ❓ Besoin d'aide ?

### Connexion ne fonctionne pas ?

1. **Vérifiez que Supabase est démarré :**
   ```powershell
   npx supabase status
   ```

2. **Si arrêté, démarrez-le :**
   ```powershell
   npx supabase start
   ```

### Erreur de mot de passe ?

- Username : `postgres`
- Password : `postgres`
- Ces identifiants sont définis par Supabase Local

### Tables vides ?

Vérifiez que les migrations ont été appliquées :
```powershell
npx supabase db reset
```

---

## 🎯 Exemple complet : Afficher les utilisateurs

1. **Ouvrir SQLTools** (icône 🗄️)
2. **Connecter** : Clic sur ⚡ "Supabase Local (Port 54322)"
3. **Nouvelle requête** : Clic droit → New SQL File
4. **Copier-coller** :
   ```sql
   SELECT 
       p.username,
       p.full_name,
       ur.role,
       p.is_active,
       p.last_login_at
   FROM profiles p
   LEFT JOIN user_roles ur ON p.user_id = ur.user_id
   ORDER BY p.created_at DESC;
   ```
5. **Exécuter** : `Ctrl+E Ctrl+E`

---

## 🌐 Alternatives

### Supabase Studio (Interface Web)
- URL : <http://127.0.0.1:54323>
- Interface graphique complète
- SQL Editor intégré
- Parfait pour visualiser les données

### pgAdmin (Application dédiée)
- Plus puissant mais plus complexe
- Nécessite installation séparée

---

✅ **Vous êtes maintenant prêt à gérer votre base de données entièrement depuis VS Code !**
