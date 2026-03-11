# Script pour analyser les CSV et générer les migrations Supabase
# Usage: .\analyser-et-importer.ps1

$exportFolder = "access-exports"

if (-not (Test-Path $exportFolder)) {
    Write-Host "❌ Le dossier '$exportFolder' n'existe pas. Exécutez d'abord : .\extraire-access.ps1" -ForegroundColor Red
    exit 1
}

$csvFiles = Get-ChildItem -Path $exportFolder -Filter "*.csv"

if ($csvFiles.Count -eq 0) {
    Write-Host "❌ Aucun fichier CSV trouvé dans '$exportFolder'" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Analyse des fichiers CSV extraits" -ForegroundColor Cyan
Write-Host "════════════════════════════════════" -ForegroundColor Cyan

$migrationContent = "-- Migration de la base Access : Gestion_Caisse`n-- Importée le : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

foreach ($csvFile in $csvFiles) {
    $TableName = $csvFile.BaseName
    Write-Host "`n📋 Table : $TableName" -ForegroundColor Yellow
    
    # Lire la première ligne pour obtenir les colonnes
    $Content = Get-Content -Path $csvFile.FullName -Encoding UTF8
    
    if ($Content.Count -gt 0) {
        $HeaderLine = $Content[0]
        $Headers = $HeaderLine -split ',' | ForEach-Object { $_ -replace '"', '' }
        
        Write-Host "  Colonnes détectées :" -ForegroundColor Green
        foreach ($Header in $Headers) {
            Write-Host "    - $Header" -ForegroundColor Cyan
        }
        
        # Compter les lignes de données
        $DataLines = $Content.Count - 1
        Write-Host "  Lignes de données : $DataLines" -ForegroundColor Green
        
        # Suggérer les types de données (simple heuristique)
        Write-Host "  Types de données suggérés :" -ForegroundColor Magenta
        
        $createTableSQL = "CREATE TABLE IF NOT EXISTS `"$TableName`" (`n"
        $createTableSQL += "  id BIGSERIAL PRIMARY KEY,`n"
        
        for ($i = 0; $i -lt $Headers.Count; $i++) {
            $ColumnName = $Headers[$i].Trim()
            $ColumnType = "TEXT"  # Type par défaut
            
            # Heuristique simple pour déterminer le type
            if ($ColumnName -match "id|ID|_id") {
                $ColumnType = "BIGINT"
            }
            elseif ($ColumnName -match "date|time|Date|Time") {
                $ColumnType = "TIMESTAMP"
            }
            elseif ($ColumnName -match "montant|prix|amount|Montant|Prix" -or $ColumnName -match "\d+") {
                $ColumnType = "DECIMAL(15,2)"
            }
            elseif ($ColumnName -match "email") {
                $ColumnType = "VARCHAR(255)"
            }
            elseif ($ColumnName -match "phone|tel|téléphone") {
                $ColumnType = "VARCHAR(20)"
            }
            
            Write-Host "    - $ColumnName : $ColumnType" -ForegroundColor Cyan
            
            if ($i -eq $Headers.Count - 1) {
                $createTableSQL += "  `"$ColumnName`" $ColumnType`n"
            } else {
                $createTableSQL += "  `"$ColumnName`" $ColumnType,`n"
            }
        }
        
        $createTableSQL += ");`n`n"
        $migrationContent += $createTableSQL
    }
}

# Sauvegarder la migration à un fichier
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$migrationFile = "supabase\migrations\${timestamp}_import_access_gestion_caisse.sql"

# Créer le dossier migrations s'il n'existe pas
$migrationDir = Split-Path -Parent $migrationFile
if (-not (Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
}

Set-Content -Path $migrationFile -Value $migrationContent -Encoding UTF8

Write-Host "`n✅ Migration SQL générée : $migrationFile" -ForegroundColor Green
Write-Host "`n📝 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Vérifiez et ajustez les types de données dans le fichier migration" -ForegroundColor Cyan
Write-Host "  2. Exécutez : npx supabase db push" -ForegroundColor Cyan
Write-Host "  3. Exécutez : .\importer-donnees.ps1" -ForegroundColor Cyan
