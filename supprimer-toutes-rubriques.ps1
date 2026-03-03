# Script pour supprimer toutes les rubriques via l'API Supabase

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "  SUPPRESSION DE TOUTES LES RUBRIQUES" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Charger les variables d'environnement
if (Test-Path .env.local) {
    Get-Content .env.local | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:VITE_SUPABASE_PUBLISHABLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "Erreur: Variables Supabase manquantes" -ForegroundColor Red
    exit 1
}

Write-Host "Configuration Supabase trouvee" -ForegroundColor Green
Write-Host "URL: $supabaseUrl" -ForegroundColor Gray
Write-Host ""

# Confirmation
Write-Host "ATTENTION: Cette action est IRREVERSIBLE!" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Tapez SUPPRIMER pour confirmer"

if ($confirmation -ne "SUPPRIMER") {
    Write-Host ""
    Write-Host "Operation annulee" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Suppression en cours..." -ForegroundColor Yellow

try {
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }
    
    $url = "$supabaseUrl/rest/v1/rubriques"
    
    $response = Invoke-RestMethod -Uri $url -Method Delete -Headers $headers
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "TOUTES LES RUBRIQUES ONT ETE SUPPRIMEES" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Rechargez la page dans votre navigateur." -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "Erreur lors de la suppression:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}
