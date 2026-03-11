$exportFolder = "access-exports"

if (-not (Test-Path $exportFolder)) {
    Write-Host "[ERREUR] Le dossier '$exportFolder' n'existe pas. Executez d'abord : .\extraire-access.ps1"
    exit 1
}

$csvFiles = Get-ChildItem -Path $exportFolder -Filter "*.csv"

if ($csvFiles.Count -eq 0) {
    Write-Host "[ERREUR] Aucun fichier CSV trouve dans '$exportFolder'"
    exit 1
}

Write-Host "[ETAPE] Analyse des fichiers CSV extraits"
Write-Host "========================================"

$migrationContent = "-- Migration de la base Access : Gestion_Caisse`n-- Importee le : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

foreach ($csvFile in $csvFiles) {
    $TableName = $csvFile.BaseName
    Write-Host "`nTable : $TableName"
    
    $Content = Get-Content -Path $csvFile.FullName -Encoding UTF8
    
    if ($Content.Count -gt 0) {
        $HeaderLine = $Content[0]
        $Headers = $HeaderLine -split ',' | ForEach-Object { $_ -replace '"', '' }
        
        Write-Host "  Colonnes : $($Headers.Count)"
        
        $DataLines = $Content.Count - 1
        Write-Host "  Lignes de donnees : $DataLines"
        
        $createTableSQL = "CREATE TABLE IF NOT EXISTS ""$TableName"" ("  + "`n"
        $createTableSQL += "  id BIGSERIAL PRIMARY KEY,"  + "`n"
        
        for ($i = 0; $i -lt $Headers.Count; $i++) {
            $ColumnName = $Headers[$i].Trim()
            $ColumnType = "TEXT"
            
            if ($ColumnName -match "id|ID") {
                $ColumnType = "BIGINT"
            }
            elseif ($ColumnName -match "date|Date|TIME|Time") {
                $ColumnType = "TIMESTAMP"
            }
            elseif ($ColumnName -match "montant|prix|amount|Montant|Prix") {
                $ColumnType = "DECIMAL(15,2)"
            }
            
            if ($i -eq $Headers.Count - 1) {
                $createTableSQL += "  ""$ColumnName"" $ColumnType"  + "`n"
            } else {
                $createTableSQL += "  ""$ColumnName"" $ColumnType,"  + "`n"
            }
        }
        
        $createTableSQL += ");"  + "`n`n"
        $migrationContent += $createTableSQL
    }
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$migrationFile = "supabase/migrations/${timestamp}_import_access_gestion_caisse.sql"

$migrationDir = Split-Path -Parent $migrationFile
if (-not (Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
}

Set-Content -Path $migrationFile -Value $migrationContent -Encoding UTF8

Write-Host "`n[OK] Migration SQL generee : $migrationFile"
Write-Host "`n[INFO] Prochaines etapes :"
Write-Host "  1. Verifiez les types de donnees dans le fichier migration"
Write-Host "  2. Executez : npx supabase db push"
Write-Host "  3. Executez : .\importer-donnees.ps1"
