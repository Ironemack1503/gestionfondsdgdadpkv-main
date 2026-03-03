# STRUCTURE DES TABLES - CORRESPONDANCE FORMULAIRE/BASE DE DONNÉES
Date: 12 février 2026

## ✅ TABLE RECETTES

### Colonnes de la base de données:
| Nom dans la BDD | Type | Description | Correspond au formulaire |
|----------------|------|-------------|--------------------------|
| `date_transaction` | DATE | Date de l'enregistrement | ✅ Date d'enregistrement |
| `numero_bon` | INTEGER | Numéro d'ordre (Auto-incrémenté) | ✅ N°d'ord (Auto) |
| `numero_beo` | VARCHAR | Numéro BEO (4 chiffres) | ✅ N°BEO |
| `libelle` | TEXT | Libellé de la recette | ✅ LIBELLE |
| `montant` | NUMERIC | Montant de la recette | ✅ Recettes (CDF) |
| `montant_lettre` | TEXT | Montant en lettres | ✅ Montant en lettres |
| `imp` | VARCHAR | Code d'imputation | ✅ Code IMP |
| `user_id` | UUID | Utilisateur qui a créé | ✅ user_id |
| `heure` | TIME | Heure de l'enregistrement | ⚙️ Auto |
| `motif` | TEXT | Motif (provenance) | 📝 Ancien champ |
| `provenance` | TEXT | Source de la recette | 📝 Ancien champ |
| `observation` | TEXT | Observations | 📝 Champ optionnel |

### Colonnes calculées automatiquement:
- `id` (UUID) - Identifiant unique
- `created_at` (TIMESTAMP) - Date de création
- `updated_at` (TIMESTAMP) - Date de mise à jour
- `mois`, `annee`, `mois_lettre`, `mois_annee` - Colonnes dérivées
- `solde_avant`, `solde_apres` - Colonnes calculées
- `statut` - Statut de la transaction
- Colonnes de signature: `signature_dp`, `signature_daf`, `signature_compt`

---

## ✅ TABLE DEPENSES

### Colonnes de la base de données:
| Nom dans la BDD | Type | Description | Correspond au formulaire |
|----------------|------|-------------|--------------------------|
| `date_transaction` | DATE | Date de l'enregistrement | ✅ Date d'enregistrement |
| `numero_bon` | INTEGER | Numéro d'ordre (Auto-incrémenté) | ✅ N°d'ord (Auto) |
| `numero_beo` | VARCHAR | Numéro BEO (4 chiffres) | ✅ N°BEO |
| `beneficiaire` | TEXT | Nom du bénéficiaire | ✅ Bénéficiaire |
| `libelle` | TEXT | Libellé de la dépense | ✅ LIBELLE |
| `montant` | NUMERIC | Montant de la dépense | ✅ Dépenses (CDF) |
| `montant_lettre` | TEXT | Montant en lettres | ✅ Montant en lettres |
| `imp` | VARCHAR | Code d'imputation | ✅ Code IMP |
| `user_id` | UUID | Utilisateur qui a créé | ✅ user_id |
| `rubrique_id` | UUID | Rubrique budgétaire | ✅ Rubrique |
| `heure` | TIME | Heure de l'enregistrement | ⚙️ Auto |
| `motif` | TEXT | Motif de la dépense | 📝 Ancien champ |
| `observation` | TEXT | Observations | 📝 Champ optionnel |

### Colonnes calculées automatiquement:
- `id` (UUID) - Identifiant unique
- `created_at` (TIMESTAMP) - Date de création
- `updated_at` (TIMESTAMP) - Date de mise à jour
- `mois`, `annee`, `mois_lettre`, `mois_annee` - Colonnes dérivées
- `solde_avant`, `solde_apres` - Colonnes calculées
- `statut` - Statut de la transaction
- Colonnes de signature: `signature_dp`, `signature_daf`, `signature_compt`
- `code_contentieux` - Pour les contentieux

---

## 📋 CORRESPONDANCE EXACTE

### Pour RECETTES:
```
FORMULAIRE                  →  BASE DE DONNÉES
─────────────────────────────────────────────────
Date d'enregistrement       →  date_transaction (DATE)
N°d'ord (Auto)             →  numero_bon (INTEGER, auto)
N°BEO (4 chiffres)         →  numero_beo (VARCHAR)
LIBELLE                     →  libelle (TEXT)
Recettes (CDF)             →  montant (NUMERIC)
Montant en lettres         →  montant_lettre (TEXT)
Code IMP                    →  imp (VARCHAR)
user_id                     →  user_id (UUID)
```

### Pour DEPENSES:
```
FORMULAIRE                  →  BASE DE DONNÉES
─────────────────────────────────────────────────
Date d'enregistrement       →  date_transaction (DATE)
N°d'ord (Auto)             →  numero_bon (INTEGER, auto)
N°BEO (4 chiffres)         →  numero_beo (VARCHAR)
Bénéficiaire               →  beneficiaire (TEXT)
LIBELLE                     →  libelle (TEXT)
Dépenses (CDF)             →  montant (NUMERIC)
Montant en lettres         →  montant_lettre (TEXT)
Code IMP                    →  imp (VARCHAR)
Rubrique                    →  rubrique_id (UUID)
user_id                     →  user_id (UUID)
```

---

## ✅ VÉRIFICATION EFFECTUÉE

Le cache du schéma PostgREST a été vidé et les colonnes suivantes sont disponibles:
- ✅ `numero_beo` existe dans `recettes`
- ✅ `numero_beo` existe dans `depenses`
- ✅ `imp` existe dans `recettes`
- ✅ `imp` existe dans `depenses`
- ✅ `libelle` existe dans `recettes`
- ✅ `libelle` existe dans `depenses`
- ✅ `montant_lettre` existe dans `recettes`
- ✅ `montant_lettre` existe dans `depenses`

**Action à effectuer:** Recharger l'application (F5) pour que le nouveau cache soit utilisé.
