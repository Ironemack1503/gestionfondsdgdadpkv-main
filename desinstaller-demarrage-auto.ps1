# ========================================
# 🗑️ DÉSINSTALLATEUR DU DÉMARRAGE AUTOMATIQUE
# ========================================
# Ce script supprime la configuration du démarrage automatique
# 
# DOIT ÊTRE EXÉCUTÉ EN TANT QU'ADMINISTRATEUR
# ========================================

# Vérifier les droits administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERREUR: DROITS ADMINISTRATEUR REQUIS  " -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ce script doit être exécuté en tant qu'administrateur." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DÉSINSTALLATION DU DÉMARRAGE AUTO  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$taskName = "GestionFondsDGDA_DemarrageAuto"

# Supprimer la tâche planifiée
Write-Host "Suppression de la tâche planifiée..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($task) {
    try {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "  ✓ Tâche planifiée supprimée" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  • Aucune tâche planifiée trouvée" -ForegroundColor Gray
}

# Options pour les règles de pare-feu
Write-Host ""
Write-Host "Voulez-vous également supprimer les règles de pare-feu ? (O/N)" -ForegroundColor Yellow
Write-Host "  (Les autres PC ne pourront plus accéder à l'application)" -ForegroundColor Gray
$response = Read-Host

if ($response -eq "O" -or $response -eq "o" -or $response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Suppression des règles de pare-feu..." -ForegroundColor Yellow
    
    $firewallRules = @(
        "Vite Dev Server (8081)",
        "Supabase Local API (54321)",
        "Supabase PostgreSQL (54322)"
    )
    
    foreach ($ruleName in $firewallRules) {
        $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        if ($rule) {
            try {
                Remove-NetFirewallRule -DisplayName $ruleName
                Write-Host "  ✓ Règle '$ruleName' supprimée" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ Erreur pour '$ruleName': $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "  • Règle '$ruleName' non trouvée" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  • Règles de pare-feu conservées" -ForegroundColor Gray
}

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DÉSINSTALLATION TERMINÉE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "L'application ne démarrera plus automatiquement." -ForegroundColor Green
Write-Host ""
Write-Host "Pour la démarrer manuellement:" -ForegroundColor Yellow
Write-Host "  • Exécutez 'demarrage-auto-windows.ps1'" -ForegroundColor Gray
Write-Host "  • Ou utilisez VS Code avec les tâches configurées" -ForegroundColor Gray
Write-Host ""

Read-Host "Appuyez sur Entrée pour terminer"
