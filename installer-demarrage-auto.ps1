# ========================================
# INSTALLATEUR DE DEMARRAGE AUTOMATIQUE
# ========================================
# Ce script configure le demarrage automatique
# de l'application au demarrage de Windows
# 
# DOIT ETRE EXECUTE EN TANT QU'ADMINISTRATEUR
# ========================================

# Verifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERREUR: DROITS ADMINISTRATEUR REQUIS  " -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ce script doit etre execute en tant qu'administrateur." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Faites un clic droit sur le script et selectionnez:" -ForegroundColor Cyan
    Write-Host "'Executer en tant qu'administrateur'" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION DU DEMARRAGE AUTOMATIQUE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = $PSScriptRoot
$scriptPath = Join-Path $projectPath "demarrage-auto-windows.ps1"
$taskName = "GestionFondsDGDA_DemarrageAuto"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Repertoire projet: $projectPath" -ForegroundColor Gray
Write-Host "  Script de demarrage: $scriptPath" -ForegroundColor Gray
Write-Host "  Nom de la tache: $taskName" -ForegroundColor Gray
Write-Host ""

# Verifier que le script existe
if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERREUR] Le script demarrage-auto-windows.ps1 n'existe pas!" -ForegroundColor Red
    Write-Host "  Chemin recherche: $scriptPath" -ForegroundColor Gray
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Supprimer l'ancienne tache si elle existe
Write-Host "Verification des taches existantes..." -ForegroundColor Yellow
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "  Une tache existante a ete trouvee" -ForegroundColor Gray
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "  [OK] Ancienne tache supprimee" -ForegroundColor Green
}

# Creer la nouvelle tache planifiee
Write-Host ""
Write-Host "Creation de la tache planifiee..." -ForegroundColor Yellow

try {
    # Action: Executer le script PowerShell
    $action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`"" `
        -WorkingDirectory $projectPath

    # Declencheur: Au demarrage de Windows (avec delai de 30 secondes)
    $trigger = New-ScheduledTaskTrigger -AtStartup
    # Ajouter un delai de 30 secondes pour laisser le systeme demarrer
    $trigger.Delay = "PT30S"

    # Configuration de la tache
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1)

    # Principal: Executer avec les privileges de l'utilisateur actuel
    $principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -LogonType Interactive `
        -RunLevel Limited

    # Enregistrer la tache
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Demarre automatiquement l'application de gestion des fonds DGDA DPKV au demarrage de Windows" | Out-Null

    Write-Host "  [OK] Tache planifiee creee avec succes" -ForegroundColor Green

} catch {
    Write-Host "  [ERREUR] Erreur lors de la creation de la tache: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Configuration des regles de pare-feu
Write-Host ""
Write-Host "Configuration des regles de pare-feu..." -ForegroundColor Yellow

$firewallRules = @(
    @{Name="Vite Dev Server (8081)"; Port=8081},
    @{Name="Supabase Local API (54321)"; Port=54321},
    @{Name="Supabase PostgreSQL (54322)"; Port=54322}
)

foreach ($rule in $firewallRules) {
    # Supprimer la regle existante si elle existe
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Remove-NetFirewallRule -DisplayName $rule.Name
    }
    
    # Creer la nouvelle regle
    try {
        New-NetFirewallRule `
            -DisplayName $rule.Name `
            -Direction Inbound `
            -LocalPort $rule.Port `
            -Protocol TCP `
            -Action Allow `
            -Profile Any | Out-Null
        
        Write-Host "  [OK] Port $($rule.Port) autorise" -ForegroundColor Green
    } catch {
        Write-Host "  [ERREUR] Erreur pour le port $($rule.Port): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Resume final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION TERMINEE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Tache planifiee creee: $taskName" -ForegroundColor Green
Write-Host "[OK] Regles de pare-feu configurees" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  - Demarrage: 30 secondes apres le boot Windows" -ForegroundColor Gray
Write-Host "  - Utilisateur: $env:USERNAME" -ForegroundColor Gray
Write-Host "  - Condition: Reseau disponible" -ForegroundColor Gray
Write-Host ""
Write-Host "Services qui demarreront automatiquement:" -ForegroundColor Yellow
Write-Host "  1. Supabase (API + PostgreSQL)" -ForegroundColor Gray
Write-Host "  2. Serveur Vite (Application Web)" -ForegroundColor Gray
Write-Host "  3. Ouverture automatique du navigateur" -ForegroundColor Gray
Write-Host ""
Write-Host "Options de gestion:" -ForegroundColor Yellow
Write-Host "  - Desactiver: Ouvrez le Planificateur de taches Windows" -ForegroundColor Gray
Write-Host "    et desactivez la tache '$taskName'" -ForegroundColor Gray
Write-Host "  - Desinstaller: Executez 'desinstaller-demarrage-auto.ps1'" -ForegroundColor Gray
Write-Host "  - Tester maintenant: Executez 'demarrage-auto-windows.ps1'" -ForegroundColor Gray
Write-Host ""
Write-Host "Fichier log: demarrage-auto.log" -ForegroundColor Cyan
Write-Host ""

# Demander si l'utilisateur veut tester maintenant
Write-Host "Voulez-vous tester le demarrage automatique maintenant ? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Demarrage du test..." -ForegroundColor Cyan
    Write-Host ""
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -NoNewWindow -Wait
} else {
    Write-Host ""
    Write-Host "L'application demarrera automatiquement au prochain redemarrage de Windows." -ForegroundColor Green
    Write-Host ""
}

Read-Host "Appuyez sur Entree pour terminer"
