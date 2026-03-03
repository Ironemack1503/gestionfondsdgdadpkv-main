# Script de reparation automatique de Supabase
# Version simplifiee sans emojis pour compatibilite PowerShell

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Diagnostic et reparation Supabase" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier Docker Desktop
Write-Host "[1/4] Verification de Docker Desktop..." -ForegroundColor Yellow
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if (!$dockerProcess) {
    Write-Host "ERREUR: Docker Desktop n'est pas demarre" -ForegroundColor Red
    Write-Host "Veuillez demarrer Docker Desktop et relancer ce script" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "OK: Docker Desktop est actif" -ForegroundColor Green

# 2. Verifier les conteneurs Supabase
Write-Host ""
Write-Host "[2/4] Verification des conteneurs Supabase..." -ForegroundColor Yellow
$containers = docker ps -a --filter "name=supabase_" --format "{{.Names}}`t{{.Status}}"
$containerCount = ($containers | Measure-Object -Line).Lines

if ($containerCount -eq 0) {
    Write-Host "ATTENTION: Aucun conteneur Supabase trouve" -ForegroundColor Yellow
    Write-Host "Demarrage de Supabase..." -ForegroundColor Cyan
    npx supabase start
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Supabase demarre avec succes" -ForegroundColor Green
    } else {
        Write-Host "ERREUR: Echec du demarrage" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Conteneurs trouves: $containerCount" -ForegroundColor Cyan
    
    # Verifier les conteneurs problematiques
    $unhealthy = docker ps --filter "name=supabase_" --filter "health=unhealthy" --format "{{.Names}}"
    $exited = docker ps -a --filter "name=supabase_" --filter "status=exited" --format "{{.Names}}"
    $restarting = docker ps -a --filter "name=supabase_" --filter "status=restarting" --format "{{.Names}}"
    
    if ($unhealthy) {
        Write-Host "ATTENTION: Conteneurs unhealthy detectes:" -ForegroundColor Yellow
        $unhealthy | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        Write-Host "Redemarrage..." -ForegroundColor Cyan
        $unhealthy | ForEach-Object { docker restart $_ }
    }
    
    if ($exited) {
        Write-Host "ATTENTION: Conteneurs arretes detectes:" -ForegroundColor Yellow
        $exited | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        Write-Host "Demarrage..." -ForegroundColor Cyan
        $exited | ForEach-Object { docker start $_ }
    }
    
    if ($restarting) {
        Write-Host "ATTENTION: Conteneurs en redemarrage constant:" -ForegroundColor Yellow
        $restarting | ForEach-Object { 
            Write-Host "  - $_" -ForegroundColor Yellow
            Write-Host "  Logs recents:" -ForegroundColor Gray
            docker logs $_ --tail 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }
    }
    
    if (!$unhealthy -and !$exited -and !$restarting) {
        Write-Host "OK: Tous les conteneurs sont sains" -ForegroundColor Green
    }
}

# 3. Verifier la commande supabase status
Write-Host ""
Write-Host "[3/4] Verification de la configuration Supabase..." -ForegroundColor Yellow
$statusOutput = npx supabase status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Configuration Supabase valide" -ForegroundColor Green
    Write-Host ""
    Write-Host $statusOutput
} else {
    Write-Host "ERREUR: Configuration Supabase invalide" -ForegroundColor Red
    Write-Host "Message d'erreur:" -ForegroundColor Gray
    Write-Host "$statusOutput" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Tentative de reparation..." -ForegroundColor Cyan
    
    # Proposer de reinitialiser
    Write-Host ""
    Write-Host "Options de reparation:" -ForegroundColor Yellow
    Write-Host "[1] Redemarrer Supabase (conserve les donnees)" -ForegroundColor Cyan
    Write-Host "[2] Reinitialiser completement Supabase (supprime les donnees locales)" -ForegroundColor Red
    Write-Host "[3] Annuler" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "Choisir une option (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "Redemarrage de Supabase..." -ForegroundColor Cyan
            npx supabase stop
            Start-Sleep -Seconds 2
            npx supabase start
            if ($LASTEXITCODE -eq 0) {
                Write-Host "OK: Redemarrage reussi" -ForegroundColor Green
                npx supabase status
            }
        }
        "2" {
            Write-Host ""
            Write-Host "ATTENTION: Cette action supprimera toutes les donnees locales!" -ForegroundColor Red
            $confirm = Read-Host "Taper 'OUI' pour confirmer"
            if ($confirm -eq "OUI") {
                Write-Host "Arret et suppression des conteneurs..." -ForegroundColor Yellow
                npx supabase stop
                
                Write-Host "Nettoyage des conteneurs..." -ForegroundColor Yellow
                docker ps -a -q --filter "name=supabase_" | ForEach-Object { 
                    docker rm -f $_ 2>$null
                }
                
                Write-Host "Nettoyage des volumes..." -ForegroundColor Yellow
                docker volume ls -q --filter "name=supabase_" | ForEach-Object { 
                    docker volume rm $_ 2>$null
                }
                
                Write-Host "Demarrage d'une nouvelle instance..." -ForegroundColor Cyan
                npx supabase start
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "OK: Reinitialisation reussie" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Nouvelles informations de connexion:" -ForegroundColor Cyan
                    npx supabase status
                }
            } else {
                Write-Host "Annule" -ForegroundColor Yellow
            }
        }
        "3" {
            Write-Host "Operation annulee" -ForegroundColor Yellow
        }
    }
}

# 4. Resume final
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "[4/4] Resume final" -ForegroundColor Cyan
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
        Write-Host "OK: API accessible sur http://localhost:54321" -ForegroundColor Green
    }
} catch {
    Write-Host "ATTENTION: API non accessible - verifier que Supabase est demarre" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Diagnostic termine" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
pause
