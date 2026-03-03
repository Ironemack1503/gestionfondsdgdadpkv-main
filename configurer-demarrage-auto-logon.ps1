# ========================================
# CONFIGURATION DEMARRAGE AUTO AU LOGON
# ========================================
# Ce script configure le démarrage automatique
# à la CONNEXION utilisateur (et non au boot système)
# 
# DOIT ÊTRE EXECUTÉ EN TANT QU'ADMINISTRATEUR
# ========================================

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERREUR: DROITS ADMINISTRATEUR REQUIS  " -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Faites un clic droit sur ce script et sélectionnez:" -ForegroundColor Yellow
    Write-Host "'Exécuter en tant qu'administrateur'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION DEMARRAGE AUTO AU LOGON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = $PSScriptRoot
$scriptPath = Join-Path $projectPath "demarrage-auto-windows.ps1"
$taskName = "GestionFondsDGDA_DemarrageAuto"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Utilisateur: $currentUser" -ForegroundColor Gray
Write-Host "  Répertoire projet: $projectPath" -ForegroundColor Gray
Write-Host "  Script de démarrage: $scriptPath" -ForegroundColor Gray
Write-Host "  Nom de la tâche: $taskName" -ForegroundColor Gray
Write-Host ""

# Vérifier que le script existe
if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERREUR] Le script demarrage-auto-windows.ps1 n'existe pas!" -ForegroundColor Red
    Write-Host "  Chemin recherché: $scriptPath" -ForegroundColor Gray
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "Étape 1/3: Suppression de l'ancienne tâche (si elle existe)..." -ForegroundColor Cyan
try {
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "[OK] Ancienne tâche supprimée" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Aucune tâche existante" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARN] Erreur lors de la suppression: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Étape 2/3: Création de la nouvelle tâche..." -ForegroundColor Cyan

# Créer l'action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Créer le déclencheur (à la CONNEXION utilisateur, avec délai de 10 secondes)
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$trigger.Delay = "PT10S"  # Délai de 10 secondes après le logon

# Créer les paramètres
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Créer le principal (exécuter avec les privilèges de l'utilisateur)
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited

# Enregistrer la tâche
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Démarre automatiquement Supabase et le serveur de développement pour l'application Gestion Fonds DGDA" `
        -Force | Out-Null
    
    Write-Host "[OK] Tâche planifiée créée avec succès!" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Échec de la création de la tâche: $_" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "Étape 3/3: Vérification de la configuration..." -ForegroundColor Cyan

$task = Get-ScheduledTask -TaskName $taskName
if ($task) {
    Write-Host "[OK] Tâche trouvée" -ForegroundColor Green
    Write-Host "  État: $($task.State)" -ForegroundColor Gray
    Write-Host "  Déclencheur: À la connexion de $currentUser" -ForegroundColor Gray
    Write-Host "  Délai: 10 secondes après la connexion" -ForegroundColor Gray
    Write-Host "  Mode: Arrière-plan (fenêtre cachée)" -ForegroundColor Gray
} else {
    Write-Host "[ERREUR] Tâche non trouvée après création!" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONFIGURATION TERMINÉE AVEC SUCCÈS!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Le démarrage automatique est maintenant configuré." -ForegroundColor Cyan
Write-Host ""
Write-Host "Au prochain démarrage de Windows:" -ForegroundColor Yellow
Write-Host "  1. Vous vous connecterez normalement" -ForegroundColor Gray
Write-Host "  2. Après 10 secondes, les services démarreront automatiquement" -ForegroundColor Gray
Write-Host "  3. Le navigateur s'ouvrira sur l'application" -ForegroundColor Gray
Write-Host "  4. Tout se passe en arrière-plan" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour vérifier le statut de la tâche:" -ForegroundColor Cyan
Write-Host "  Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour tester maintenant (sans redémarrer):" -ForegroundColor Cyan
Write-Host "  Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host ""
Write-Host "Fichier de log:" -ForegroundColor Cyan
Write-Host "  $projectPath\demarrage-auto.log" -ForegroundColor Gray
Write-Host ""

Read-Host "Appuyez sur Entrée pour terminer"
