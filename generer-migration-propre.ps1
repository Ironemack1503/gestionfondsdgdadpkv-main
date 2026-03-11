$exportFolder = "access-exports"

if (-not (Test-Path $exportFolder)) {
    Write-Host "[ERREUR] Le dossier '$exportFolder' n'existe pas"
    exit 1
}

$csvFiles = Get-ChildItem -Path $exportFolder -Filter "*.csv" | Sort-Object Name

$sqlContent = ""

foreach ($csvFile in $csvFiles) {
    $TableName = $csvFile.BaseName
    
    # Exclure les tables temporaires et systeme
    if ($TableName -match "^~" -or $TableName -match "^MSys" -or $TableName -match "Table des erreurs") {
        Write-Host "[IGNORER] Table : $TableName (temporaire/systeme)"
        continue
    }
    
    $Content = @(Get-Content -Path $csvFile.FullName -Encoding UTF8)
    
    if ($Content.Count -gt 0) {
        $HeaderLine = $Content[0]
        $Headers = @($HeaderLine -split ',' | ForEach-Object { $_ -replace '"', '' })
        
        $sqlContent += "CREATE TABLE IF NOT EXISTS ""$TableName"" ("
        $sqlContent += "`n  id BIGSERIAL PRIMARY KEY,"
        
        for ($i = 0; $i -lt $Headers.Count; $i++) {
            $ColumnName = $Headers[$i].Trim()
            $ColumnType = "TEXT"
            
            if ($ColumnName -match "id|ID") {
                $ColumnType = "BIGINT"
            }
            elseif ($ColumnName -match "date|Date|TIME|Time") {
                $ColumnType = "TIMESTAMP"
            }
            elseif ($ColumnName -match "montant|prix|amount") {
                $ColumnType = "DECIMAL(15,2)"
            }
            
            if ($i -eq $Headers.Count - 1) {
                $sqlContent += "`n  ""$ColumnName"" $ColumnType"
            } else {
                $sqlContent += "`n  ""$ColumnName"" $ColumnType,"
            }
        }
        
        $sqlContent += "`n);"
        $sqlContent += "`n`n"
    }
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$migrationFile = "supabase/migrations/${timestamp}_import_access_tables.sql"

[System.IO.File]::WriteAllText($migrationFile, $sqlContent, [System.Text.Encoding]::UTF8)

Write-Host "[OK] Migration SQL creee : $migrationFile"
Write-Host "[INFO] Prochaine etape : npx supabase db push --local"
