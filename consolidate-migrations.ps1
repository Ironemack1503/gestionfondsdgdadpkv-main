# ========================================
# Script de Consolidation des Migrations
# Gestion Fonds DGDADPKV
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CONSOLIDATION DES MIGRATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationsPath = ".\supabase\migrations"
$outputFile = ".\migration-complete.sql"

# Supprimer le fichier de sortie s'il existe
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Créer l'en-tête
$header = @"
-- ========================================
-- MIGRATION COMPLÈTE - Gestion Fonds DGDADPKV
-- Généré le: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- ========================================
-- 
-- Ce fichier contient toutes les migrations dans l'ordre chronologique.
-- À exécuter dans le SQL Editor de Supabase.
--
-- ========================================

"@

Add-Content -Path $outputFile -Value $header

# Lister tous les fichiers SQL dans l'ordre
$sqlFiles = Get-ChildItem $migrationsPath -Filter "*.sql" | Sort-Object Name

Write-Host "Fichiers de migration trouvés: $($sqlFiles.Count)" -ForegroundColor Green
Write-Host ""

$count = 0
foreach ($file in $sqlFiles) {
    $count++
    Write-Host "[$count/$($sqlFiles.Count)] Ajout de: $($file.Name)" -ForegroundColor Yellow
    
    # Ajouter un séparateur
    $separator = @"

-- ========================================
-- MIGRATION: $($file.Name)
-- ========================================

"@
    Add-Content -Path $outputFile -Value $separator
    
    # Ajouter le contenu du fichier
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    Add-Content -Path $outputFile -Value $content -Encoding UTF8
    
    # Ajouter une ligne vide
    Add-Content -Path $outputFile -Value "`n"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ CONSOLIDATION TERMINÉE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichier généré: $outputFile" -ForegroundColor Cyan
Write-Host "Taille: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "1. Ouvrez: https://app.supabase.com/project/vhmyeiqbcnojubpgkqxp/sql/new" -ForegroundColor White
Write-Host "2. Copiez le contenu de: $outputFile" -ForegroundColor White
Write-Host "3. Collez-le dans le SQL Editor de Supabase" -ForegroundColor White
Write-Host "4. Cliquez sur 'Run' (ou Ctrl+Enter)" -ForegroundColor White
Write-Host ""

# Ouvrir le fichier dans VS Code
Write-Host "Ouverture du fichier dans VS Code..." -ForegroundColor Yellow
code $outputFile

# Ouvrir le SQL Editor de Supabase dans le navigateur
Write-Host "Ouverture du SQL Editor de Supabase..." -ForegroundColor Yellow
Start-Process "https://app.supabase.com/project/vhmyeiqbcnojubpgkqxp/sql/new"

Write-Host ""
Write-Host "✨ Prêt à appliquer les migrations!" -ForegroundColor Green
