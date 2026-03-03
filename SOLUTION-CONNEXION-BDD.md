# 🔧 SOLUTION: Connexion à la Base de Données

## ❌ Problème Identifié

L'erreur SQLTools se produit parce qu'**aucune base de données n'est en cours d'exécution**.

## ✅ Solutions Disponibles

---

### 🎯 Solution 1: PostgreSQL LocalPostgreSQL (RECOMMANDÉ - Plus Simple)

#### Étape 1: Télécharger PostgreSQL

1. Allez sur: <https://www.postgresql.org/download/windows/>
2. Téléchargez PostgreSQL 15 ou supérieur
3. Lancez l'installateur

#### Étape 2: Installation

- **Port**: 5432 (par défaut)
- **Mot de passe**: Choisissez un mot de passe et **NOTEZ-LE** ✏️
- **Composants**: Cochez tout (PostgreSQL Server, pgAdmin 4, Command Line Tools)

#### Étape 3: Configuration Automatique

```powershell
# Ouvrir PowerShell en ADMINISTRATEUR
cd "C:\Users\DGDA\Downloads\gestionfonsdgdadpkv-main\gestionfonsdgdadpkv-main"

# Exécuter le script de configuration
.\scripts\setup-production-local.ps1
```

Le script va vous demander:

- Votre mot de passe PostgreSQL
- Confirmer l'IP du serveur
- Il créera automatiquement la base de données et appliquera toutes les migrations

#### Étape 4: Configuration SQLTools dans VS Code

Une fois PostgreSQL installé et configuré, créez la connexion SQLTools :

1. **Ouvrir SQLTools**: `Ctrl+Shift+P` → "SQLTools: Add New Connection"
2. **Choisir**: PostgreSQL
3. **Paramètres**:
   - Connection name: `Base Locale DGDA`
   - Server: `localhost`
   - Port: `5432`
   - Database: `gestion_fonds_dgdadpkv`
   - Username: `postgres`
   - Password: [Votre mot de passe PostgreSQL]
   - SSL: Désactivé
4. **Test Connection** puis **Save**

---

### 🐳 Solution 2: Docker + PostgreSQL (Pour développeurs avancés)

Si vous préférez utiliser Docker (vous avez déjà Docker installé):

#### Option A: PostgreSQL Simple avec Docker

```powershell
# Créer et démarrer un conteneur PostgreSQL
docker run --name postgres-dgda `
  -e POSTGRES_PASSWORD=monmotdepasse `
  -e POSTGRES_DB=gestion_fonds_dgdadpkv `
  -p 5432:5432 `
  -d postgres:15-alpine

# Vérifier qu'il tourne
docker ps
```

Puis appliquez les migrations:

```powershell
cd "C:\Users\DGDA\Downloads\gestionfonsdgdadpkv-main\gestionfonsdgdadpkv-main\gestionfondsdgdadpkv-main"

# Installer psql tools si nécessaire
# Puis appliquer les migrations manuellement
```

#### Option B: Téléchargement manuel Supabase CLI

1. Allez sur: <https://github.com/supabase/cli/releases>
2. Téléchargez `supabase_windows_amd64.exe`
3. Renommez en `supabase.exe`
4. Placez dans `C:\Windows\System32` ou ajoutez au PATH
5. Redémarrez PowerShell
6. Exécutez: `supabase start`

---

### 🌐 Solution 3: Supabase Cloud (Pour tester rapidement)

1. Créez un compte gratuit sur <https://supabase.com>
2. Créez un nouveau projet
3. Attendez ~2 minutes (création du projet)
4. Dans **Settings > API**:
   - Copiez **Project URL** → `VITE_SUPABASE_URL`
   - Copiez **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`

5. Mettez à jour `.env.local`:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique
```

1. Appliquez les migrations depuis le SQL Editor de Supabase:

   - Ouvrez les fichiers dans `supabase/migrations/*.sql`
   - Copiez et exécutez chaque fichier dans l'ordre

2. Configuration SQLTools pour Supabase Cloud:

   - Server: [extrait de votre URL, ex: db.xxx.supabase.co]
   - Port: 5432
   - Database: postgres
   - Username: postgres
   - Password: [Dans Settings > Database > Database password]
   - SSL: Activé

---

## 🎯 Quelle Solution Choisir?

| Solution | Avantages | Inconvénients |
| --- | --- | --- |
| **PostgreSQL Local** | ✅ Simple / ✅ Pas de Docker / ✅ Script auto | ⚠️ Installation ~200MB |
| **Docker** | ✅ Portable / ✅ Isolé | ⚠️ Nécessite Docker / ⚠️ Plus complexe |
| **Supabase Cloud** | ✅ Aucune installation / ✅ Immediate | ⚠️ Nécessite Internet / ⚠️ Gratuit limité |

---

## 📝 Après Installation

Une fois la base connectée:

1. **Tester la connexion**:

   ```powershell
   npm run dev
   ```

   Puis allez sur <http://localhost:5173>

2. **Ouvrir SQLTools**:

   - Cliquez sur l'icône SQLTools (base de données) dans la barre latérale
   - Cliquez sur l'icône ⚡ pour connecter
   - Vous devriez voir toutes les tables

3. **Tester avec une requête**:
   - Ouvrez `test-connection.sql`
   - Placez le curseur sur une requête
   - Appuyez sur `Ctrl+E Ctrl+E`

---

## ❓ Besoin d'Aide?

Si vous rencontrez des problèmes:

1. Vérifiez que PostgreSQL/Docker est démarré
2. Vérifiez vos identifiants
3. Consultez les logs: `docker logs postgres-dgda` (si Docker)
