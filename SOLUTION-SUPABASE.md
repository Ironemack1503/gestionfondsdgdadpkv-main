# 🔧 Solutions pour l'erreur Supabase

## 🔍 Problème identifié

Le CLI Supabase ne trouve pas les conteneurs Docker car :
- **project_id** dans config.toml : `fecwhtqugcxnvvvmcxif`
- **Nom des conteneurs** : `supabase_*_gestionfonsdgdadpkv-main`
- Conteneurs problématiques : `vector` (redémarrage) et `edge_runtime` (arrêté)

---

## ✅ Solution 1 : Redémarrage complet (RECOMMANDÉ)

### Étape 1 : Arrêter et nettoyer
```powershell
# Arrêter tous les conteneurs Supabase
npx supabase stop

# Si l'erreur persiste, arrêter manuellement
docker stop $(docker ps -a -q --filter "name=supabase_")
docker rm $(docker ps -a -q --filter "name=supabase_")

# Nettoyer les volumes (ATTENTION : supprime les données locales)
docker volume prune -f
```

### Étape 2 : Redémarrer proprement
```powershell
# Démarrer Supabase
npx supabase start

# Vérifier le statut
npx supabase status
```

### Étape 3 : Mettre à jour les variables d'environnement
Après le redémarrage, récupérer les nouvelles clés :
```powershell
npx supabase status
```
Et mettre à jour votre fichier `.env` ou `.env.local`.

---

## ✅ Solution 2 : Réinitialiser la configuration

### Étape 1 : Sauvegarder les migrations
```powershell
# Vos migrations sont dans supabase/migrations/
# Vérifier qu'elles sont bien présentes
ls supabase/migrations/
```

### Étape 2 : Réinitialiser Supabase
```powershell
# Supprimer la configuration locale
Remove-Item -Recurse -Force supabase/.branches
Remove-Item -Recurse -Force supabase/.temp

# Arrêter les conteneurs
npx supabase stop

# Relancer avec un nouveau projet_id
npx supabase init --force

# Démarrer
npx supabase start

# Appliquer les migrations
npx supabase db push
```

---

## ✅ Solution 3 : Réparer les conteneurs existants

Si vous voulez garder les données actuelles :

### Réparer le conteneur vector
```powershell
docker restart supabase_vector_gestionfonsdgdadpkv-main
docker logs supabase_vector_gestionfonsdgdadpkv-main
```

### Réparer le conteneur edge_runtime
```powershell
docker start supabase_edge_runtime_gestionfonsdgdadpkv-main
docker logs supabase_edge_runtime_gestionfonsdgdadpkv-main
```

### Vérifier l'état
```powershell
docker ps -a --filter "name=supabase_"
```

---

## ✅ Solution 4 : Mise à jour du config.toml

Si vous voulez continuer avec les conteneurs actuels, créez un lien symbolique ou mettez à jour manuellement :

```powershell
# Arrêter Supabase
npx supabase stop

# Démarrer avec le bon nom de projet
cd $env:USERPROFILE\Downloads\gestionfonsdgdadpkv-main\gestionfonsdgdadpkv-main\gestionfondsdgdadpkv-main
npx supabase start
```

---

## 🎯 Solution recommandée

Pour une installation **durable et stable**, je recommande la **Solution 1** :

```powershell
# 1. Arrêter tout
npx supabase stop

# 2. Nettoyer si nécessaire
docker stop $(docker ps -a -q --filter "name=supabase_")
docker rm $(docker ps -a -q --filter "name=supabase_")

# 3. Redémarrer
npx supabase start

# 4. Vérifier
npx supabase status

# 5. Appliquer les migrations
npx supabase db push
```

---

## 📝 Prévention future

### 1. Créer un script de vérification

Créez `verifier-supabase.ps1` :
```powershell
Write-Host "🔍 Vérification de Supabase..." -ForegroundColor Cyan

# Vérifier Docker
if (!(Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Desktop n'est pas démarré" -ForegroundColor Red
    exit 1
}

# Vérifier les conteneurs
$containers = docker ps --filter "name=supabase_" --format "{{.Names}}" | Measure-Object -Line
if ($containers.Lines -lt 10) {
    Write-Host "⚠️  Tous les conteneurs Supabase ne sont pas démarrés" -ForegroundColor Yellow
    Write-Host "Tentative de démarrage..." -ForegroundColor Yellow
    npx supabase start
}

# Vérifier le statut
npx supabase status
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase fonctionne correctement" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur Supabase détectée" -ForegroundColor Red
    exit 1
}
```

### 2. Modifier la tâche de vérification

Dans `.vscode/tasks.json`, modifier la tâche "Vérifier Supabase" :
```json
{
    "label": "Vérifier Supabase",
    "type": "shell",
    "command": "powershell",
    "args": [
        "-ExecutionPolicy", "Bypass",
        "-File", "${workspaceFolder}/verifier-supabase.ps1"
    ],
    "isBackground": false,
    "problemMatcher": []
}
```

### 3. Ajouter un healthcheck automatique

Créez `healthcheck-supabase.ps1` :
```powershell
# Vérifier toutes les 10 secondes
while ($true) {
    $unhealthy = docker ps --filter "name=supabase_" --filter "health=unhealthy" -q
    if ($unhealthy) {
        Write-Host "⚠️  Conteneurs unhealthy détectés, redémarrage..." -ForegroundColor Yellow
        docker restart $unhealthy
    }
    Start-Sleep -Seconds 10
}
```

---

## 🚀 Vérification finale

Après avoir appliqué la solution, vérifiez que tout fonctionne :
```powershell
# 1. Vérifier Docker
docker ps --filter "name=supabase_"

# 2. Vérifier Supabase
npx supabase status

# 3. Tester la connexion
curl http://localhost:54321/rest/v1/

# 4. Vérifier les logs
docker logs supabase_db_gestionfonsdgdadpkv-main --tail 50
```

---

## 📞 Support

Si les problèmes persistent :
1. Vérifier les logs Docker : `docker logs <container_name>`
2. Vérifier Docker Desktop est bien démarré
3. Vérifier les ports ne sont pas utilisés : `netstat -ano | findstr "54321"`
4. Redémarrer Docker Desktop
