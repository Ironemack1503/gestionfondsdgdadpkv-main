# 🚀 GUIDE DE DÉMARRAGE AUTOMATIQUE

## Ce qui démarre automatiquement à l'ouverture de VS Code

### ✅ Services configurés pour démarrage automatique :

1. **Serveur Vite (Port 8081)** - Application web
   - Démarre automatiquement via `.vscode/tasks.json`
   - Accessible sur : http://localhost:8081 et http://192.168.0.32:8081

2. **Supabase (Ports 54321, 54322)** - Backend et base de données
   - Vérifie si déjà démarré
   - Si non démarré, utilisez la commande : `npx supabase start`

### 📋 Tâches VS Code disponibles

Pour exécuter une tâche, appuyez sur `Ctrl+Shift+P` et tapez "Run Task" :

| Tâche | Description |
|-------|-------------|
| 🚀 Démarrage automatique complet | Lance tous les services |
| 🔧 Démarrer Supabase Local | Démarre Supabase manuellement |
| Démarrer serveur dev | Démarre uniquement le serveur Vite |
| 🛑 Arrêter tous les services | Arrête Supabase |
| 🔒 Autoriser ports réseau | Configure le pare-feu (ADMIN) |

## 🔧 Configuration initiale (à faire une seule fois)

### Étape 1 : Autoriser VS Code à lancer des tâches automatiques

Lors de la première ouverture du projet, VS Code demande :
> "Cette tâche peut s'exécuter automatiquement. Autorisez-vous les tâches automatiques dans ce dossier ?"

**➜ Cliquez sur "Autoriser" ou "Allow"**

### Étape 2 : Configurer le pare-feu (OBLIGATOIRE pour accès réseau)

**Option A - Via script PowerShell (RECOMMANDÉ) :**

1. Clic droit sur `autoriser-ports-reseau.ps1`
2. "Exécuter avec PowerShell" (accepter les droits admin)

**Option B - Via VS Code :**

1. Appuyez sur `Ctrl+Shift+P`
2. Tapez "Run Task"
3. Sélectionnez "🔒 Autoriser ports réseau (Admin requis)"

**Option C - Manuellement en PowerShell Admin :**

```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server (8081)" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Supabase Local API (54321)" -Direction Inbound -LocalPort 54321 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Supabase PostgreSQL (54322)" -Direction Inbound -LocalPort 54322 -Protocol TCP -Action Allow
```

### Étape 3 : Vérifier que tout fonctionne

Exécutez le script de vérification :

```powershell
.\demarrer-application.ps1
```

Ce script vérifie :
- ✅ Supabase est démarré
- ✅ Serveur Vite est accessible
- ✅ Ports pare-feu sont autorisés

## 📱 Accès depuis d'autres PC

### Configuration réseau

L'application utilise maintenant l'IP réseau : **192.168.0.32**

**Sur n'importe quel PC du même réseau :**
1. Ouvrez un navigateur
2. Allez sur : **http://192.168.0.32:8081**
3. Connectez-vous normalement

**Aucune configuration nécessaire sur les PC clients !**

## 🔍 Diagnostic des problèmes

### Le serveur ne démarre pas automatiquement

1. Vérifiez que vous avez autorisé les tâches automatiques
2. Rechargez la fenêtre : `Ctrl+Shift+P` → "Reload Window"

### "Failed to fetch" lors de la connexion

**Cause :** Supabase n'est pas démarré ou n'écoute pas sur l'IP réseau

**Solution :**
```powershell
npx supabase stop
npx supabase start
```

Puis redémarrez le serveur Vite.

### Les autres PC ne peuvent pas se connecter

1. **Vérifiez les ports du pare-feu** :
   ```powershell
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Vite*" -or $_.DisplayName -like "*Supabase*"}
   ```

2. **Si aucune règle n'apparaît, exécutez** :
   ```powershell
   .\autoriser-ports-reseau.ps1
   ```
   (en tant qu'administrateur)

3. **Vérifiez que les deux PC sont sur le même réseau**

### Vérifier les services en cours

```powershell
# Vérifier les ports ouverts
Test-NetConnection -ComputerName localhost -Port 8081
Test-NetConnection -ComputerName localhost -Port 54321
Test-NetConnection -ComputerName localhost -Port 54322

# Vérifier les processus
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*postgres*"}
```

## 🔄 Workflow quotidien

### Démarrage de la journée

1. **Ouvrez VS Code** dans le dossier du projet
2. ✅ Le serveur Vite démarre automatiquement
3. ✅ Supabase devrait déjà être actif (reste en mémoire)
4. Vérifiez avec : `.\demarrer-application.ps1`

### Si Supabase n'est pas démarré

```powershell
npx supabase start
```

### Fin de journée

```powershell
# Arrêter Supabase (optionnel, économise les ressources)
npx supabase stop

# Le serveur Vite s'arrête automatiquement à la fermeture de VS Code
```

## 📝 Résumé des fichiers de configuration

| Fichier | Rôle |
|---------|------|
| `.vscode/tasks.json` | Tâches automatiques VS Code |
| `.vscode/settings.json` | Active les tâches automatiques |
| `.env.local` | Configuration réseau Supabase |
| `demarrer-application.ps1` | Script de vérification |
| `autoriser-ports-reseau.ps1` | Configuration pare-feu |

## ✅ Checklist de vérification

- [ ] VS Code autorisé à lancer des tâches automatiques
- [ ] Ports 8081, 54321, 54322 autorisés dans le pare-feu
- [ ] Supabase démarre avec `npx supabase start`
- [ ] Serveur Vite démarre automatiquement
- [ ] Application accessible sur http://localhost:8081
- [ ] Application accessible depuis autre PC sur http://192.168.0.32:8081
- [ ] Connexion utilisateur fonctionne depuis autre PC

---

**Tout est configuré pour un fonctionnement automatique !** 🎉

En cas de problème, exécutez `.\demarrer-application.ps1` pour un diagnostic complet.
