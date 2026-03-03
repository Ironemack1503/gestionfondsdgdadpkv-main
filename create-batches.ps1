# ========================================
# Migration par Fichiers Séparés
# Gestion Fonds DGDADPKV
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CREATION FICHIERS MIGRATION SEPARES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationsPath = ".\supabase\migrations"
$outputDir = ".\migrations-separees"

# Créer le dossier de sortie
if (Test-Path $outputDir) {
    Remove-Item $outputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $outputDir | Out-Null

# Lister les migrations
$sqlFiles = Get-ChildItem $migrationsPath -Filter "*.sql" | Sort-Object Name

$totalFiles = $sqlFiles.Count
Write-Host "Creation de $totalFiles fichiers separes..." -ForegroundColor Yellow
Write-Host ""

# Grouper par lots de 5 migrations
$batchSize = 5
$batchNumber = 1
$currentBatch = @()

foreach ($file in $sqlFiles) {
    $currentBatch += $file
    
    if ($currentBatch.Count -eq $batchSize -or $file -eq $sqlFiles[-1]) {
        $outputFile = Join-Path $outputDir "batch-$($batchNumber.ToString('00')).sql"
        
        # Créer l'en-tête
        $header = @"
-- ========================================
-- BATCH $batchNumber - $(($currentBatch | Select-Object -First 1).Name) à $(($currentBatch | Select-Object -Last 1).Name)
-- ========================================

"@
        Add-Content -Path $outputFile -Value $header
        
        # Ajouter chaque fichier du batch
        foreach ($batchFile in $currentBatch) {Dark
            Write-Host "  [$batchNumber] Ajout: $($batchFile.Name)" -ForegroundColor Gray
            
            $separator = @"

-- ========================================
-- MIGRATION: $($batchFile.Name)
-- ========================================

"@
            Add-Content -Path $outputFile -Value $separator
            
            $content = Get-Content $batchFile.FullName -Raw -Encoding UTF8
            Add-Content -Path $outputFile -Value $content -Encoding UTF8
            Add-Content -Path $outputFile -Value "`n"
        }
        
        $fileSize = [math]::Round((Get-Item $outputFile).Length / 1KB, 2)
        $migCount = $currentBatch.Count
        Write-Host "OK Batch $batchNumber cree: $fileSize KB ($migCount fichiers)" -ForegroundColor Green
        
        $batchNumber++
        $currentBatch = @()
    }
}

Write-Host ""
Write-Host "OK FICHIERS CREE=========================" -ForegroundColor Green
Write-Host "✅ FICHIERS CRÉÉS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dossier: $outputDir" -ForegroundColor Cyan
$totalBatches = $batchNumber - 1
Write-Host "Nombre de batches: $totalBatches" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Ouvrez le dossier: $outputDir" -ForegroundColor White
Write-Host "2. Executez chaque fichier batch-XX.sql dans l ordre" -ForegroundColor White
Write-Host "3. Allez sur: https://app.supabase.com/project/vhmyeiqbcnojubpgkqxp/sql/new" -ForegroundColor White
Write-Host "4. Copiez-collez le contenu de batch-01.sql puis RUN" -ForegroundColor White
Write-Host "5. Repetez pour batch-02.sql batch-03.sql etc" -ForegroundColor White
Write-Host ""

# Ouvrir le dossier
explorer $outputDir

Write-Host "Pret a migrer!" -ForegroundColor Green
