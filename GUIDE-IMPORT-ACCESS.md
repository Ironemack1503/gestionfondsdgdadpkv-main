# Guide d'Import : Base Access → Supabase

## 📋 Résumé du Processus

Ce guide vous permet d'importer votre base de données Access `Gestion_Caisse -06_10_16.mdb` dans votre application Supabase en 5 étapes automatisées.

## 🚀 Démarrage Rapide

```powershell
# Exécutez ce script depuis PowerShell (en tant qu'administrateur si nécessaire)
.\importer-base-access.ps1
```

Le script va :
1. ✅ Vérifier les prérequis (Access Database Engine, psql, etc.)
2. 📊 Extraire les données d'Access en fichiers CSV
3. 📋 Analyser les données et générer les migrations SQL
4. 🚀 Déployer les tables dans Supabase
5. 📦 Importer les données

## 📋 Prérequis

### 1. **Microsoft ACE OLEDB 12.0 (Required)**
   - Nécessaire pour lire les fichiers `.mdb` / `.accdb`
   - Téléchargez depuis : https://www.microsoft.com/download/details.aspx?id=13255
   - Choisissez la version correspondant à votre architecture (32-bit ou 64-bit)
   - Installation : Exécutez le fichier `.exe` téléchargé

### 2. **PostgreSQL Client (psql)** (Optionnel)
   - Utilisé pour importer directement dans Supabase
   - Inclus dans : PostgreSQL > 12 ou PostgreSQL Client (stand-alone)
   - Téléchargez depuis : https://www.postgresql.org/download/windows/

### 3. **Node.js avec Supabase CLI**
   - Vérifiez : `node --version`
   - Vérifiez Supabase : `npx supabase --version`

### 4. **Le fichier Access**
   - Placez `Gestion_Caisse -06_10_16.mdb` dans le répertoire racine du projet
   - S'il n'est pas accessible, utilisez le chemin complet dans le script

## 📂 Structure des Dossiers Créés

Après l'exécution du script, vous aurez :

```
access-exports/
  ├── Table1.csv
  ├── Table2.csv
  └── TableN.csv

supabase/migrations/
  └── YYYYMMDD_HHMMSS_import_access_gestion_caisse.sql
```

## 🔄 Processus Détaillé

### Étape 1 : Vérification des Prérequis
Le script vérifie que tous les outils nécessaires sont installés. Si quelque chose manque, vous recevrez un message d'erreur avec un lien de téléchargement.

### Étape 2 : Extraction des Données
```powershell
.\extraire-access.ps1 -AccessFile "Gestion_Caisse -06_10_16.mdb"
```
- Lit chaque table de la base Access
- Exporte les données en fichiers CSV dans le dossier `access-exports/`
- Les fichiers sont encodés en UTF-8

**Fichiers créés :** `access-exports/*.csv`

### Étape 3 : Analyse et Génération SQL
```powershell
.\analyser-et-importer.ps1
```
- Analyse les fichiers CSV
- Détecte les types de données (TEXT, BIGINT, TIMESTAMP, DECIMAL, etc.)
- Génère un fichier migration SQL
- Crée des tables vides dans la base

**Fichier créé :** `supabase/migrations/YYYYMMDD_HHMMSS_import_access_gestion_caisse.sql`

⚠️ **Important :** Vérifiez et ajustez les types de données si nécessaire dans le fichier SQL généré.

### Étape 4 : Déploiement des Migrations
```powershell
npx supabase db push
```
- Exécute la migration SQL
- Crée les tables dans Supabase
- Vous pouvez voir les tables dans Supabase Studio (http://localhost:54323)

### Étape 5 : Import des Données
```powershell
.\importer-donnees.ps1
```
- Utilise `psql` pour importer les données CSV
- Remplit les tables créées à l'étape 4
- Affiche un résumé de l'import

## 🛠️ Scripts Individuels

Si vous avez besoin d'exécuter uniquement une partie du processus :

### Extraire les Données Uniquement
```powershell
.\extraire-access.ps1 -AccessFile "Gestion_Caisse -06_10_16.mdb"
```
**Paramètres :**
- `-AccessFile` : Chemin vers le fichier .mdb ou .accdb

### Analyser et Générer les Migrations
```powershell
.\analyser-et-importer.ps1
```
**Entrée :** Lit les fichiers CSV depuis `access-exports/`
**Sortie :** Crée un fichier migration dans `supabase/migrations/`

### Importer les Données dans Supabase
```powershell
.\importer-donnees.ps1 -Host "localhost" -Port 54322 -User "postgres" -Password "postgres" -Database "postgres"
```
**Paramètres :**
- `-Host` : Nom d'hôte Supabase (par défaut : localhost)
- `-Port` : Port Supabase (par défaut : 54322 pour local)
- `-User` : Utilisateur PostgreSQL (par défaut : postgres)
- `-Password` : Mot de passe PostgreSQL (par défaut : postgres)
- `-Database` : Nom de la base (par défaut : postgres)

## 🔍 Vérification

### Vérifier que les tables sont créées
```powershell
# Via Supabase Studio (interface web)
# http://localhost:54323

# Ou via psql en ligne de commande
psql -h localhost -p 54322 -U postgres -c "\dt"
```

### Vérifier que les données sont importées
```sql
-- Remplacez 'table_name' par le nom d'une table
SELECT COUNT(*) FROM "table_name";
SELECT * FROM "table_name" LIMIT 5;
```

## ❌ Dépannage

### Erreur : "Microsoft.ACE.OLEDB.12.0 Provider Not Found"
**Solution :** Installez Microsoft ACE OLEDB 12.0
- https://www.microsoft.com/download/details.aspx?id=13255
- Choisissez votre architecture (32-bit ou 64-bit)
- Redémarrez VS Code après l'installation

### Erreur : "psql not found"
**Solution 1 :** Installez PostgreSQL Client
- https://www.postgresql.org/download/windows/
- Installez au minimum "PostgreSQL Client"
- Redémarrez VS Code

**Solution 2 :** Importer manuellement via Supabase Studio
- Allez à http://localhost:54323
- Dans l'onglet SQL, exécutez des commandes `COPY` manuellement

### Erreur : "Permission Denied" sur les fichiers CSV
**Solution :** Vérifiez les permissions des fichiers CSV
```powershell
chmod 644 access-exports/*.csv
```
Ou utilisez Supabase Studio pour importer via l'interface graphique.

### Erreur : "Encoding Mismatch" ou Caractères Corrompus
**Solution :** Les fichiers CSV sont générés en UTF-8. Vérifiez que :
- Votre terminal PowerShell utilise UTF-8 : `chcp 65001`
- Votre base Supabase accepte UTF-8 (par défaut, oui)

### Les migrations SQL ne s'appliquent pas
**Solution :** Vérifiez le fichier migration et assurez-vous que :
1. Le fichier est dans `supabase/migrations/`
2. Les types de données sont valides (TEXT, BIGINT, BOOLEAN, TIMESTAMP, etc.)
3. Pas de conflits de noms de tables
4. Exécutez : `npx supabase db push --dry-run` pour prévisualiser

## 🛡️ Bonnes Pratiques

1. **Sauvegarde** : Avant de commencer, sauvegardez votre base Supabase existante
2. **Test** : Testez d'abord avec une copie de votre fichier Access
3. **Vérification** : Vérifiez les données importées avant de les utiliser en production
4. **RLS** : Si vous activez Row Level Security, mettez à jour les politiques pour les nouvelles tables
5. **Migrations** : Versionnez vos fichiers de migration dans Git

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les fichiers journaux dans le dossier `logs/` (s'il existe)
2. Exécutez les scripts individuels pour identifier l'étape problématique
3. Consultez les messages d'erreur détaillés fournis par les scripts
4. Relancez depuis l'étape précédente (vous pouvez réexécuter sans danger)

---

**Créé pour :** Gestion_Caisse -06_10_16.mdb
**Version de Supabase Local :** 1.50.0+
**Compatibilité :** Windows PowerShell 5.0+, PowerShell Core 7.0+
