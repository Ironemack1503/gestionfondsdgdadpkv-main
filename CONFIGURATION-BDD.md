# 🚀 Configuration de la Connexion à la Base de Données

Le fichier `.env.local` a été créé. Maintenant, choisissez votre méthode de connexion :

## ✅ Option 1: Supabase Local (Recommandé pour développement)

### Prérequis
- Docker Desktop installé
- Supabase CLI installé

### Installation Supabase CLI
```powershell
# Avec Scoop (recommandé)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OU avec npm
npm install -g supabase
```

### Démarrage

```powershell
# Dans le dossier du projet
supabase start

# L'URL et la clé seront affichées
# Copiez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env.local
```

### Lancer l'application
```powershell
npm run dev
```

---

## 🌐 Option 2: Supabase Cloud (Pour production)

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Dans Settings > API, copiez:
   - Project URL → VITE_SUPABASE_URL
   - anon public key → VITE_SUPABASE_PUBLISHABLE_KEY
4. Mettez à jour `.env.local` avec ces valeurs
5. Lancez `npm run dev`

---

## 💾 Option 3: Installation PostgreSQL locale

### Installation
1. Téléchargez PostgreSQL 15+: https://www.postgresql.org/download/windows/
2. Installez-le (notez bien le mot de passe)
3. Exécutez:

```powershell
cd C:\Users\DGDA\Downloads\gestionfonsdgdadpkv-main\scripts

# Exécuter en tant qu'ADMINISTRATEUR
.\setup-production-local.ps1
```

Ce script va:
- Configurer PostgreSQL
- Créer la base de données
- Appliquer les migrations
- Créer le fichier .env avec les bonnes valeurs

---

## 🧪 Tester la Configuration

Une fois la base configurée, testez:

```powershell
npm run dev
```

Ouvrez votre navigateur à: http://localhost:5173

---

## 🆘 Besoin d'Aide?

Consultez les guides détaillés:
- `QUICK-START.md` - Démarrage rapide
- `GUIDE-DEPLOIEMENT-LOCAL.md` - Guide complet de déploiement
- `GUIDE-SQLTOOLS.md` - Configuration des outils SQL
