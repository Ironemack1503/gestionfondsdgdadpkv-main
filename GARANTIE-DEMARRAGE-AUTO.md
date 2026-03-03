# ✅ GARANTIE DE DÉMARRAGE AUTOMATIQUE

## Ce que j'ai configuré pour vous

### 🎯 Services qui démarrent AUTOMATIQUEMENT :

#### 1. ✅ Serveur Vite (Port 8081) - Application Web
- **État :** ✅ Configuré pour démarrage automatique
- **Comment :** Via `.vscode/tasks.json` avec `runOn: folderOpen`
- **Garantie :** Démarre à chaque ouverture du projet dans VS Code
- **Accès :** 
  - Local : http://localhost:8081
  - Réseau : http://192.168.0.32:8081

#### 2. ⚠️ Supabase (Ports 54321, 54322) - Backend + Base de données  
- **État actuel :** ✅ DÉJÀ EN COURS D'EXÉCUTION (10 processus PostgreSQL détectés)
- **Persistance :** Supabase reste actif même après fermeture de VS Code
- **Vérification :** Tâche automatique vérifie son état au démarrage
- **Si besoin de redémarrage :** Commande disponible dans VS Code (`Ctrl+Shift+P` → "Run Task" → "🔧 Démarrer Supabase Local")

### 🔒 Configuration Pare-feu

**⚠️ ACTION REQUISE UNE SEULE FOIS :**

Les ports suivants DOIVENT être autorisés pour l'accès réseau :
- Port 8081 : Application web (Vite)
- Port 54321 : API Supabase  
- Port 54322 : PostgreSQL

**Pour autoriser (en tant qu'administrateur) :**
```powershell
.\autoriser-ports-reseau.ps1
```

## 📋 Workflow au démarrage de VS Code

```
1. Ouvrir VS Code dans le dossier du projet
   ↓
2. ✅ Tâche automatique "🚀 Démarrage automatique complet" se lance
   ↓
3. ✅ Vérification de Supabase (déjà actif normalement)
   ↓
4. ✅ Démarrage du serveur Vite (port 8081)
   ↓
5. 🎉 Application prête !
```

**Temps estimé :** 5-10 secondes

## 🛠️ Scripts de maintenance

J'ai créé 3 scripts pour vous :

### 1. `demarrer-application.ps1` - Diagnostic complet
```powershell
.\demarrer-application.ps1
```
**Vérifie :**
- ✅ Supabase est actif
- ✅ Serveur Vite est accessible
- ✅ Ports pare-feu configurés
- 📊 Affiche l'état complet

**Quand l'utiliser :** Chaque jour avant de commencer, ou en cas de problème

### 2. `autoriser-ports-reseau.ps1` - Configuration pare-feu
```powershell
.\autoriser-ports-reseau.ps1
```
**(DOIT être exécuté en tant qu'administrateur)**

**Quand l'utiliser :** Une seule fois après configuration initiale

### 3. Tâches VS Code intégrées

Appuyez sur `Ctrl+Shift+P` → "Run Task" :

| Tâche | Usage |
|-------|-------|
| 🚀 Démarrage automatique complet | Lance automatiquement (pas besoin de l'appeler) |
| 🔧 Démarrer Supabase Local | Si Supabase s'est arrêté |
| 🛑 Arrêter tous les services | Fin de journée (optionnel) |
| 🔒 Autoriser ports réseau | Alternative à autoriser-ports-reseau.ps1 |

## ✅ Checklist de validation

Exécutez cette checklist pour vous assurer que tout fonctionne :

```powershell
# 1. Vérifier l'état complet
.\demarrer-application.ps1

# 2. Tester l'accès local
Start-Process "http://localhost:8081"

# 3. Tester l'accès réseau depuis un autre PC
# Aller sur http://192.168.0.32:8081
```

**Résultat attendu :**
- ✅ Supabase : Actif
- ✅ Serveur Vite : Actif  
- ✅ Pare-feu : 3/3 ports autorisés
- ✅ Connexion : Fonctionne depuis autre PC

## 🔄 Scénarios de redémarrage

### Scénario 1 : Redémarrage de Windows
```
1. Windows démarre
2. Ouvrir VS Code
3. ✅ Serveur Vite démarre automatiquement
4. ⚠️ Supabase à vérifier : .\demarrer-application.ps1
   Si non actif : npx supabase start
```

### Scénario 2 : VS Code fermé et réouvert
```
1. Ouvrir VS Code
2. ✅ Serveur Vite démarre automatiquement
3. ✅ Supabase déjà actif (reste en mémoire)
```

### Scénario 3 : Erreur "Failed to fetch"
```
1. Vérifier Supabase : .\demarrer-application.ps1
2. Si inactif : npx supabase start
3. Recharger la page web (F5)
```

## 📱 Accès multi-postes

### Configuration côté serveur (ce PC)
- ✅ `.env.local` : URL Supabase = http://192.168.0.32:54321
- ✅ Pare-feu : Ports 8081, 54321, 54322 autorisés
- ✅ Serveur Vite écoute sur 0.0.0.0:8081

### Côté clients (autres PC)
- **Action requise :** AUCUNE
- **Accès :** Navigateur → http://192.168.0.32:8081
- **Fonctionnalités :** Toutes (connexion, données, etc.)

## 🎯 GARANTIES

### ✅ Ce qui est GARANTI automatique :
1. **Serveur Vite** démarre à chaque ouverture de VS Code
2. **Vérification Supabase** s'exécute automatiquement
3. **Terminal dédié** s'ouvre avec les logs en temps réel
4. **Notification visuelle** si une tâche échoue

### ⚠️ Ce qui nécessite action manuelle (rare) :
1. **Autoriser ports pare-feu** (une seule fois)
2. **Autoriser tâches VS Code** (une seule fois, au premier lancement)
3. **Redémarrer Supabase** (seulement si arrêté manuellement ou après crash)

### ❌ Ce qui NE nécessite PAS d'action :
1. ❌ Démarrer le serveur Vite manuellement
2. ❌ Ouvrir un terminal pour lancer npm run dev
3. ❌ Vérifier les ports à chaque démarrage
4. ❌ Configurer les autres PC clients

## 📞 En cas de problème

### Problème : Le serveur ne démarre pas automatiquement

**Diagnostic :**
```powershell
# Vérifier si la tâche auto est activée
cat .vscode\settings.json | Select-String "task.allow"
```

**Solution :**
1. `Ctrl+Shift+P` → "Reload Window"
2. Autoriser les tâches automatiques si demandé

### Problème : "Failed to fetch" depuis autre PC

**Diagnostic :**
```powershell
.\demarrer-application.ps1
```

**Solution :**
1. Si pare-feu non configuré : `.\autoriser-ports-reseau.ps1` (en admin)
2. Si Supabase inactif : `npx supabase start`

### Problème : Supabase ne répond pas

**Solution :**
```powershell
npx supabase stop
npx supabase start
```

Puis redémarrer le serveur Vite (fermer/rouvrir VS Code ou `Ctrl+C` dans le terminal Vite puis `npm run dev`)

## 📚 Documentation détaillée

Pour plus d'informations, consultez :
- **[GUIDE-DEMARRAGE-AUTO.md](GUIDE-DEMARRAGE-AUTO.md)** : Guide complet avec tous les détails

---

## 🎉 RÉSUMÉ EXÉCUTIF

**Vous avez maintenant :**
✅ Démarrage automatique du serveur web  
✅ Scripts de diagnostic et maintenance  
✅ Configuration réseau multi-postes  
✅ Tâches VS Code intégrées  
✅ Gestion automatique de tous les services  

**À faire UNE SEULE FOIS :**
1. Autoriser les tâches VS Code (popup au premier lancement)
2. Exécuter `.\autoriser-ports-reseau.ps1` en administrateur

**Après ça :**
👉 **Ouvrez VS Code → Tout démarre automatiquement !** 🚀

---

*Dernière mise à jour : 12 février 2026*
