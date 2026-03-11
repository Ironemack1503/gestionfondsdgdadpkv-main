$exportFolder = "access-exports"
$PgHost = "localhost"
$PgPort = 45322
$PgUser = "postgres"
$PgPassword = "postgres"
$PgDatabase = "postgres"

if (-not (Test-Path $exportFolder)) {
    Write-Host "[ERREUR] Le dossier '$exportFolder' n'existe pas"
    exit 1
}

Write-Host "[ETAPE] Import des donnees CSV dans Supabase local"
Write-Host "=================================================="

$csvFiles = Get-ChildItem -Path $exportFolder -Filter "*.csv" | Sort-Object Name
$count = 0

foreach ($csvFile in $csvFiles) {
    $TableName = $csvFile.BaseName
    
    # Exclure les tables temporaires
    if ($TableName -match "^~" -or $TableName -match "^MSys" -or $TableName -match "Table des erreurs") {
        continue
    }
    
    $CsvPath = (Resolve-Path $csvFile.FullName).Path
    
    Write-Host "`n[IMPORT] Table : $TableName ($($csvFile.Length / 1KB)KB)"
    
    $env:PGPASSWORD = $PgPassword
    
    try {
        $ImportSQL = "\COPY ""$TableName"" FROM '$CsvPath' WITH CSV HEADER ENCODING 'UTF-8' DELIMITER ',' QUOTE '""' ESCAPE '""';"
        
        $Output = $ImportSQL | & psql -h $PgHost -p $PgPort -U $PgUser -d $PgDatabase 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $count++
            Write-Host "  [OK] Import reussi"
        } else {
            Write-Host "  [AVERTISSEMENT] Erreur : $($Output | Select-Object -First 1)"
        }
    }
    catch {
        Write-Host "  [ERREUR] $_"
    }
}

$env:PGPASSWORD = ""

Write-Host "`n=================================================="
Write-Host "[OK] Import termine ! $count tables importees"
Write-Host "[INFO] Connectez-vous a Supabase Studio : http://localhost:45323"
