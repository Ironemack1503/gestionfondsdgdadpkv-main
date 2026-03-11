param(
    [string]$PgHost = "localhost",
    [int]$PgPort = 54322,
    [string]$PgUser = "postgres",
    [string]$PgPassword = "postgres",
    [string]$PgDatabase = "postgres"
)

$exportFolder = "access-exports"

if (-not (Test-Path $exportFolder)) {
    Write-Host "[ERREUR] Le dossier '$exportFolder' n'existe pas"
    exit 1
}

Write-Host "[ETAPE] Import des donnees CSV dans Supabase"
Write-Host "============================================"

$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "[ERREUR] psql n'a pas ete trouve. Installez PostgreSQL Client."
    exit 1
}

Write-Host "[OK] psql trouve : $($psqlPath.Source)"

$csvFiles = Get-ChildItem -Path $exportFolder -Filter "*.csv"

foreach ($csvFile in $csvFiles) {
    $TableName = $csvFile.BaseName
    $CsvPath = (Resolve-Path $csvFile.FullName).Path
    
    Write-Host "`n[ETAPE] Import de la table : $TableName"
    Write-Host "   Fichier : $CsvPath"
    
    $env:PGPASSWORD = $PgPassword
    
    try {
        $ImportSQL = "\COPY ""$TableName"" FROM '$CsvPath' WITH CSV HEADER ENCODING 'UTF-8' DELIMITER ',' QUOTE '""' NULL '';"
        
        $Output = $ImportSQL | & psql -h $PgHost -p $PgPort -U $PgUser -d $PgDatabase 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Import reussi"
        } else {
            Write-Host "  [AVERTISSEMENT] Erreur lors de l'import"
            Write-Host "     $Output"
        }
    }
    catch {
        Write-Host "  [ERREUR] $_"
    }
}

$env:PGPASSWORD = ""

Write-Host "`n[OK] Import des donnees termine !"
Write-Host "`n[INFO] Verification :"
Write-Host "  Exécutez : npx supabase db list"
Write-Host "  Ou connectez-vous a Supabase Studio : http://localhost:54323"
