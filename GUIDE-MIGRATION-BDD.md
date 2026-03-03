# GUIDE DE MIGRATION - Structure Base de Données

## ⚠️ ACTION REQUISE

Les nouvelles colonnes doivent être ajoutées à la base de données avant que l'application ne fonctionne correctement.

## 📋 Étapes à suivre

### 1. Ouvrir Supabase Studio
- Ouvrez votre navigateur
- Allez sur : **http://127.0.0.1:54323**
- (C'est l'interface d'administration de votre base de données locale)

### 2. Accéder à l'éditeur SQL
- Dans le menu de gauche, cliquez sur **"SQL Editor"**
- Cliquez sur **"New Query"** pour créer une nouvelle requête

### 3. Copier-coller le script SQL
- Ouvrez le fichier `MIGRATION-MANUELLE.sql` dans ce dossier
- **Copiez tout le contenu** du fichier
- **Collez-le** dans l'éditeur SQL de Supabase Studio

### 4. Exécuter le script
- Cliquez sur le bouton **"Run"** (ou appuyez sur `Ctrl + Enter`)
- Attendez que l'exécution se termine
- Vous devriez voir un message de succès ✅

### 5. Vérifier que tout fonctionne
- Retournez sur votre application : http://192.168.0.32:8080
- Essayez de créer une nouvelle recette
- Elle devrait s'enregistrer et s'afficher correctement !

## 📊 Nouvelles colonnes ajoutées

### Table `recettes`:
- ✅ `numero_beo` (VARCHAR(4)) - Numéro BÉO à 4 chiffres
- ✅ `libelle` (TEXT) - Libellé descriptif de la recette
- ✅ `imp` (VARCHAR(20)) - Code IMP (Imputation budgétaire)

### Table `depenses`:
- ✅ `numero_beo` (VARCHAR(4)) - Numéro BÉO à 4 chiffres
- ✅ `libelle` (TEXT) - Libellé descriptif de la dépense
- ✅ `imp` (VARCHAR(20)) - Code IMP (Imputation budgétaire)

## 🔄 Correspondance Formulaire ↔ Base de Données

### RECETTES:
| Champ Formulaire | Colonne Base de Données | Type |
|------------------|------------------------|------|
| Date d'enregistrement | `date` | DATE |
| N°d'ord (Auto) | `numero_bon` | SERIAL |
| N°BEO (4 chiffres) | `numero_beo` | VARCHAR(4) |
| LIBELLE | `libelle` | TEXT |
| Recettes (CDF) | `montant` | NUMERIC |
| Montant en lettres | `montant_lettre` | TEXT |
| Code IMP | `imp` | VARCHAR(20) |
| - | `user_id` | UUID |

### DÉPENSES:
| Champ Formulaire | Colonne Base de Données | Type |
|------------------|------------------------|------|
| Date | `date` | DATE |
| N°d'ord (Auto) | `numero_bon` | SERIAL |
| N°BEO (4 chiffres) | `numero_beo` | VARCHAR(4) |
| Rubrique | `rubrique_id` | UUID |
| Bénéficiaire | `beneficiaire` | TEXT |
| LIBELLE/Motif | `libelle` | TEXT |
| Montant (CDF) | `montant` | NUMERIC |
| Montant en lettres | `montant_lettre` | TEXT |
| Code IMP | `imp` | VARCHAR(20) |
| - | `user_id` | UUID |

## ❓ Aide

Si vous rencontrez des problèmes :
1. Vérifiez que Supabase est bien démarré (l'URL http://127.0.0.1:54323 doit s'ouvrir)
2. Relisez attentivement les étapes ci-dessus
3. Vérifiez qu'il n'y a pas d'erreurs dans la console du navigateur (F12)
