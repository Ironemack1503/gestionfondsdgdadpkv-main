# ========================================
# 📁 INSTALLER RACCOURCI DÉMARRAGE (MÉTHODE ALTERNATIVE)
# ========================================
# Ce script place un raccourci vers le script de démarrage
# dans le dossier Démarrage de Windows
# 
# NE NÉCESSITE PAS DE DROITS ADMINISTRATEUR
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION RACCOURCI DÉMARRAGE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = $PSScriptRoot
$batchFile = Join-Path $projectPath "demarrage-auto.bat"
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder "GestionFondsDGDA.lnk"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Dossier Démarrage: $startupFolder" -ForegroundColor Gray
Write-Host "  Fichier batch: $batchFile" -ForegroundColor Gray
Write-Host ""

# Vérifier que le fichier batch existe
if (-not (Test-Path $batchFile)) {
    Write-Host "✗ ERREUR: Le fichier demarrage-auto.bat n'existe pas!" -ForegroundColor Red
    Write-Host "  Chemin recherché: $batchFile" -ForegroundColor Gray
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Supprimer l'ancien raccourci s'il existe
if (Test-Path $shortcutPath) {
    Write-Host "Suppression de l'ancien raccourci..." -ForegroundColor Yellow
    Remove-Item $shortcutPath -Force
    Write-Host "  ✓ Ancien raccourci supprimé" -ForegroundColor Green
}

# Créer le nouveau raccourci
Write-Host "Création du raccourci..." -ForegroundColor Yellow

try {
    $WScriptShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $batchFile
    $Shortcut.WorkingDirectory = $projectPath
    $Shortcut.WindowStyle = 7  # Minimized
    $Shortcut.Description = "Démarre automatiquement l'application de gestion des fonds DGDA"
    $Shortcut.Save()
    
    Write-Host "  ✓ Raccourci créé avec succès" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Note sur les règles de pare-feu
Write-Host ""
Write-Host "⚠ IMPORTANT: Configuration du pare-feu" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour que les autres PC puissent accéder à l'application," -ForegroundColor Gray
Write-Host "vous devez configurer les règles de pare-feu." -ForegroundColor Gray
Write-Host ""
Write-Host "Exécutez EN TANT QU'ADMINISTRATEUR:" -ForegroundColor Cyan
Write-Host "  .\autoriser-ports-reseau.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Ou utilisez:" -ForegroundColor Cyan
Write-Host "  .\installer-demarrage-auto.ps1" -ForegroundColor White
Write-Host "  (Configure tout automatiquement avec la tâche planifiée)" -ForegroundColor Gray
Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLATION TERMINÉE  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Raccourci créé dans le dossier Démarrage" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  • L'application démarrera au prochain login Windows" -ForegroundColor Gray
Write-Host "  • Démarrage: Immédiat après l'ouverture de session" -ForegroundColor Gray
Write-Host "  • Fenêtre: Minimisée" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour désactiver:" -ForegroundColor Yellow
Write-Host "  • Supprimez le raccourci dans:" -ForegroundColor Gray
Write-Host "    $startupFolder" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour tester maintenant:" -ForegroundColor Yellow
Write-Host "  • Double-cliquez sur 'demarrage-auto.bat'" -ForegroundColor Gray
Write-Host ""

Read-Host "Appuyez sur Entrée pour terminer"
