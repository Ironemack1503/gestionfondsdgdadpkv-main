# Script de vérification et réparation automatique de Supabase
# Ce script détecte et corrige les problèmes courants

Write-Host "🔧 Diagnostic et réparation Supabase..." -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier Docker Desktop
Write-Host "1️⃣  Vérification de Docker Desktop..." -ForegroundColor Yellow
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if (!$dockerProcess) {
    Write-Host "❌ Docker Desktop n'est pas démarré" -ForegroundColor Red
    Write-Host "   Veuillez démarrer Docker Desktop et relancer ce script" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "   ✅ Docker Desktop est actif" -ForegroundColor Green

# 2. Vérifier les conteneurs Supabase
Write-Host ""
Write-Host "2️⃣  Vérification des conteneurs Supabase..." -ForegroundColor Yellow
$containers = docker ps -a --filter "name=supabase_" --format "{{.Names}}`t{{.Status}}"
$containerCount = ($containers | Measure-Object -Line).Lines

if ($containerCount -eq 0) {
    Write-Host "   ⚠️  Aucun conteneur Supabase trouvé" -ForegroundColor Yellow
    Write-Host "   Démarrage de Supabase..." -ForegroundColor Cyan
    npx supabase start
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase démarré avec succès" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur lors du démarrage" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   Conteneurs trouvés : $containerCount" -ForegroundColor Cyan
    
    # Vérifier les conteneurs problématiques
    $unhealthy = docker ps --filter "name=supabase_" --filter "health=unhealthy" --format "{{.Names}}"
    $exited = docker ps -a --filter "name=supabase_" --filter "status=exited" --format "{{.Names}}"
    $restarting = docker ps -a --filter "name=supabase_" --filter "status=restarting" --format "{{.Names}}"
    
    if ($unhealthy) {
        Write-Host "   ⚠️  Conteneurs unhealthy détectés:" -ForegroundColor Yellow
        $unhealthy | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
        Write-Host "   Redémarrage..." -ForegroundColor Cyan
        $unhealthy | ForEach-Object { docker restart $_ }
    }
    
    if ($exited) {
        Write-Host "   ⚠️  Conteneurs arrêtés détectés:" -ForegroundColor Yellow
        $exited | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
        Write-Host "   Démarrage..." -ForegroundColor Cyan
        $exited | ForEach-Object { docker start $_ }
    }
    
    if ($restarting) {
        Write-Host "   ⚠️  Conteneurs en redémarrage constant:" -ForegroundColor Yellow
        $restarting | ForEach-Object { 
            Write-Host "      - $_" -ForegroundColor Yellow
            Write-Host "      Logs récents:" -ForegroundColor Gray
            docker logs $_ --tail 10 | ForEach-Object { Write-Host "        $_" -ForegroundColor Gray }
        }
    }
    
    if (!$unhealthy -and !$exited -and !$restarting) {
        Write-Host "   ✅ Tous les conteneurs sont sains" -ForegroundColor Green
    }
}

# 3. Vérifier la commande supabase status
Write-Host ""
Write-Host "3️⃣  Vérification de la configuration Supabase..." -ForegroundColor Yellow
$statusOutput = npx supabase status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Configuration Supabase OK" -ForegroundColor Green
    Write-Host ""
    Write-Host $statusOutput
} else {
    Write-Host "   ❌ Erreur de configuration détectée" -ForegroundColor Red
    Write-Host "   Message d'erreur:" -ForegroundColor Gray
    Write-Host "   $statusOutput" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   🔄 Tentative de réparation..." -ForegroundColor Cyan
    
    # Proposer de réinitialiser
    Write-Host ""
    Write-Host "   Options de réparation:" -ForegroundColor Yellow
    Write-Host "   1️⃣  Redémarrer Supabase (conserve les données)" -ForegroundColor Cyan
    Write-Host "   2️⃣  Réinitialiser complètement Supabase (supprime les données locales)" -ForegroundColor Red
    Write-Host "   3️⃣  Annuler" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "   Choisir une option (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "   🔄 Redémarrage de Supabase..." -ForegroundColor Cyan
            npx supabase stop
            Start-Sleep -Seconds 2
            npx supabase start
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Redémarrage réussi" -ForegroundColor Green
                npx supabase status
            }
        }
        "2" {
            Write-Host ""
            Write-Host "   ⚠️  ATTENTION: Cette action supprimera toutes les données locales!" -ForegroundColor Red
            $confirm = Read-Host "   Taper 'OUI' pour confirmer"
            if ($confirm -eq "OUI") {
                Write-Host "   🗑️  Arrêt et suppression des conteneurs..." -ForegroundColor Yellow
                npx supabase stop
                
                Write-Host "   🗑️  Nettoyage des conteneurs..." -ForegroundColor Yellow
                docker ps -a -q --filter "name=supabase_" | ForEach-Object { 
                    docker rm -f $_ 2>$null
                }
                
                Write-Host "   🗑️  Nettoyage des volumes..." -ForegroundColor Yellow
                docker volume ls -q --filter "name=supabase_" | ForEach-Object { 
                    docker volume rm $_ 2>$null
                }
                
                Write-Host "   🆕 Démarrage d'une nouvelle instance..." -ForegroundColor Cyan
                npx supabase start
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Réinitialisation réussie" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "   📋 Nouvelles informations de connexion:" -ForegroundColor Cyan
                    npx supabase status
                }
            } else {
                Write-Host "   ❌ Annulé" -ForegroundColor Yellow
            }
        }
        "3" {
            Write-Host "   ❌ Opération annulée" -ForegroundColor Yellow
        }
    }
}

# 4. Résumé final
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Résumé final" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$finalContainers = docker ps --filter "name=supabase_" --format "{{.Names}}" | Measure-Object -Line
$runningCount = $finalContainers.Lines

Write-Host "Conteneurs actifs: $runningCount" -ForegroundColor $(if ($runningCount -ge 10) {"Green"} else {"Yellow"})

# Tester la connexion API
Write-Host ""
Write-Host "Test de connexion API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:54321/rest/v1/" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
        Write-Host "✅ API accessible sur http://localhost:54321" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  API non accessible - vérifier que Supabase est démarré" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
pause
