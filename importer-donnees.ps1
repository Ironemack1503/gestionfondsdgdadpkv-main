# Script pour importer les données CSV dans Supabase
# Usage: .\importer-donnees.ps1

param(
    [string]$Host = "localhost",
    [int]$Port = 54322,
    [string]$User = "postgres",
    [string]$Password = "postgres",
    [string]$Database = "postgres"
)

$exportFolder = "access-exports"

if (-not (Test-Path $exportFolder)) {
    Write-Host "❌ Le dossier '$exportFolder' n'existe pas" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Import des données CSV dans Supabase" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

# Vérifier si psql est disponible
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ psql n'a pas été trouvé. Assurez-vous que PostgreSQL Client est installé." -ForegroundColor Red
    Write-Host "   Ou modifiez les paramètres -Host, -Port, -User, -Password" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ psql trouvé : $($psqlPath.Source)" -ForegroundColor Green

$csvFiles = Get-ChildItem -Path $exportFolder -Filter "*.csv"

foreach ($csvFile in $csvFiles) {
    $TableName = $csvFile.BaseName
    $CsvPath = (Resolve-Path $csvFile.FullName).Path
    
    Write-Host "`n🔄 Import de la table : $TableName" -ForegroundColor Yellow
    Write-Host "   Fichier : $CsvPath" -ForegroundColor Cyan
    
    # Créer la commande SQL pour importer le CSV
    $ImportSQL = @"
\COPY "$TableName" FROM '$CsvPath' WITH CSV HEADER ENCODING 'UTF-8' DELIMITER ',' QUOTE '"' NULL '';
"@
    
    # Exécuter l'import via psql
    $env:PGPASSWORD = $Password
    
    try {
        $Output = $ImportSQL | & psql -h $Host -p $Port -U $User -d $Database 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Import réussi" -ForegroundColor Green
            Write-Host "     Sortie : $Output" -ForegroundColor Cyan
        } else {
            Write-Host "  ⚠️  Erreur lors de l'import" -ForegroundColor Yellow
            Write-Host "     Erreur : $Output" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ Erreur : $_" -ForegroundColor Red
    }
}

$env:PGPASSWORD = ""

Write-Host "`n✅ Import des données terminé !" -ForegroundColor Green
Write-Host "`n📋 Vérification :" -ForegroundColor Cyan
Write-Host "  Exécutez : npx supabase db list" -ForegroundColor Cyan
Write-Host "  Ou connectez-vous à Supabase Studio pour voir les données" -ForegroundColor Cyan
