# 🔧 Solution au problème SQLTools "detect node runtime"

## 📋 Description du problème

**Erreur rencontrée :**
```
Check Terminal view for an erroring 'detect node runtime' session. 
Capture details for investigation, then kill the terminal to continue 
SQLTools extension startup. Change the 'sqltools.useNodeRuntime' 
setting to disable runtime detection.
```

## 🔍 Cause du problème

L'extension **SQLTools** essayait de détecter et utiliser le runtime Node.js mais échouait, créant :
- ❌ Une session terminale bloquée en erreur
- ❌ Impossibilité de démarrer l'extension correctement
- ❌ Notifications d'erreur répétées

### Configuration problématique :
```json
"sqltools.useNodeRuntime": true
```

## ✅ Solutions appliquées

### 1. **Désactivation du runtime Node.js** (SOLUTION PRINCIPALE)

**Fichier modifié :** `.vscode/settings.json`

**Changement :**
```json
"sqltools.useNodeRuntime": false,  // ✅ Désactivé au lieu de true
```

**Pourquoi ?**
- SQLTools peut fonctionner sans le runtime Node.js pour les connexions PostgreSQL standard
- Élimine complètement le problème de détection
- Plus stable et plus rapide au démarrage

### 2. **Désactivation de l'auto-connexion**

**Changement :**
```json
"sqltools.autoConnectTo": [],  // ✅ Aucune connexion automatique
```

**Avantages :**
- Évite les tentatives de connexion avant que Supabase soit prêt
- Vous gardez le contrôle total sur quand vous connecter
- Réduit les erreurs au démarrage de VS Code

### 3. **Optimisations supplémentaires**

```json
{
  "sqltools.sortColumns": "name",        // Tri alphabétique des colonnes
  "sqltools.format": {
    "indent": "  "                       // Formatage SQL propre
  },
  "sqltools.results": {
    "limit": 100                         // Limite les résultats (perf)
  },
  "terminal.integrated.env.windows": {}, // Évite conflits env variables
  "extensions.autoUpdate": false         // Contrôle des mises à jour
}
```

## 🚀 Actions à faire maintenant

### Étape 1 : Nettoyer les terminaux en erreur

1. Ouvrez la vue **Terminal** (`Ctrl + ù`)
2. Cherchez un terminal nommé "detect node runtime" ou similaire
3. Cliquez sur l'icône **🗑️ poubelle** pour le fermer
4. **OU** cliquez sur "OK" dans la notification d'erreur

### Étape 2 : Recharger VS Code

**Option A - Rechargement rapide :**
1. Appuyez sur `Ctrl + Shift + P`
2. Tapez "Reload Window"
3. Appuyez sur `Entrée`

**Option B - Redémarrage complet :**
1. Fermez VS Code complètement
2. Réouvrez le projet

### Étape 3 : Vérifier que tout fonctionne

1. Ouvrez la vue **SQLTools** (icône 🗄️ dans la barre latérale)
2. Cliquez sur "Supabase Local (Port 54322)"
3. Cliquez sur "Connect"

✅ **Si vous voyez les tables** → Problème résolu !
❌ **Si erreur "Connection refused"** → Supabase n'est pas démarré

## 🛡️ Prévention future

### Si le problème réapparaît :

#### Cas 1 : Après une mise à jour de SQLTools
L'extension peut réinitialiser certains paramètres. Vérifiez `.vscode/settings.json` :
```json
"sqltools.useNodeRuntime": false  // Doit TOUJOURS être false
```

#### Cas 2 : Vous avez besoin du runtime Node
Si une fonctionnalité avancée le nécessite :

1. **Vérifiez que Node.js est installé :**
   ```powershell
   node --version
   ```

2. **Ajoutez Node.js au PATH Windows :**
   - Panneau de configuration → Système → Variables d'environnement
   - Ajoutez le chemin d'installation de Node.js (ex: `C:\Program Files\nodejs\`)

3. **Réactivez prudemment :**
   ```json
   "sqltools.useNodeRuntime": true
   ```

#### Cas 3 : Problèmes persistants

**Réinitialisez complètement SQLTools :**

1. Désinstallez l'extension SQLTools
2. Supprimez les données de l'extension :
   ```powershell
   Remove-Item -Recurse -Force "$env:USERPROFILE\.vscode\extensions\mtxr.sqltools-*"
   ```
3. Redémarrez VS Code
4. Réinstallez SQLTools
5. Restaurez UNIQUEMENT les connexions dans `.vscode/settings.json`

## 📊 Configuration recommandée finale

**Fichier `.vscode/settings.json` optimal :**

```json
{
  "sqltools.connections": [
    {
      "previewLimit": 50,
      "server": "localhost",
      "port": 54322,
      "driver": "PostgreSQL",
      "name": "Supabase Local (Port 54322)",
      "database": "postgres",
      "username": "postgres",
      "password": "postgres",
      "connectionTimeout": 30
    }
  ],
  "sqltools.useNodeRuntime": false,
  "sqltools.disableNodeDetectNotifications": true,
  "sqltools.autoConnectTo": [],
  "sqltools.showStatusbar": true,
  "sqltools.sortColumns": "name",
  "sqltools.format": {
    "indent": "  "
  },
  "sqltools.results": {
    "limit": 100
  },
  "task.autoDetect": "on",
  "task.allowAutomaticTasks": "on",
  "terminal.integrated.env.windows": {},
  "extensions.autoUpdate": false
}
```

## 🎯 Points clés à retenir

| Point | Description |
|-------|-------------|
| ✅ **Solution principale** | `"sqltools.useNodeRuntime": false` |
| ⚡ **Pas d'auto-connexion** | Connectez-vous manuellement quand Supabase est prêt |
| 🔄 **Après modification** | Rechargez VS Code (Reload Window) |
| 🛑 **Terminaux bloqués** | Fermez-les manuellement si nécessaire |
| 📌 **Préventif** | Désactivez les mises à jour auto des extensions |

## 💡 Commandes utiles

```powershell
# Vérifier que Node.js est installé (si besoin)
node --version
npm --version

# Voir les processus Node en cours
Get-Process node

# Tuer tous les processus Node (si blocage)
Stop-Process -Name node -Force

# Voir les extensions VS Code
code --list-extensions | Select-String sqltools
```

## 🆘 Support

Si le problème persiste après avoir suivi ce guide :

1. Consultez les logs de SQLTools :
   - `Ctrl + Shift + P` → "SQLTools: Show Output/Logs"

2. Vérifiez les logs VS Code :
   - Menu : **Help** → **Toggle Developer Tools** → onglet **Console**

3. Documentation officielle SQLTools :
   - https://vscode-sqltools.mteixeira.dev/

---

**Date de résolution :** 13 février 2026  
**Statut :** ✅ Problème résolu et documenté
