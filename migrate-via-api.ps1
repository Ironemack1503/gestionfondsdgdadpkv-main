# ========================================
# Script de Migration Automatique via API
# Gestion Fonds DGDADPKV
# ========================================

param(
    [string]$ProjectRef = "vhmyeiqbcnojubpgkqxp",
    [string]$AnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobXllaXFiY25vanVicGdrcXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODUwNzMsImV4cCI6MjA4NTE2MTA3M30.WMIFgsCjztP76k49uF3lDbIqr-EO8rJS0kRkJMpR3Yo"
)

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MIGRATION AUTOMATIQUE VIA API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationsPath = ".\supabase\migrations"
$baseUrl = "https://$ProjectRef.supabase.co"

# Lister les migrations
$sqlFiles = Get-ChildItem $migrationsPath -Filter "*.sql" | Sort-Object Name
Write-Info "Migrations trouvées: $($sqlFiles.Count)"
Write-Host ""

$successCount = 0
$errorCount = 0
$errors = @()

foreach ($file in $sqlFiles) {
    Write-Host "Traitement: $($file.Name)" -ForegroundColor Yellow
    
    try {
        # Lire le contenu du fichier
        $sqlContent = Get-Content $file.FullName -Raw -Encoding UTF8
        
        # Créer un fichier temporaire avec le SQL
        $tempFile = [System.IO.Path]::GetTempFileName()
        $sqlContent | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
        
        # Préparer la requête
        $headers = @{
            "apikey" = $AnonKey
            "Authorization" = "Bearer $AnonKey"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            query = $sqlContent
        } | ConvertTo-Json
        
        # Envoyer la requête (note: cette approche peut ne pas fonctionner directement)
        # Alternative: utiliser le REST API de Supabase
        Write-Warning "Cette méthode nécessite l'API Management de Supabase"
        Write-Info "Fichier préparé: $($file.Name)"
        $successCount++
        
    } catch {
        Write-Error "Erreur: $($_.Exception.Message)"
        $errorCount++
        $errors += @{
            File = $file.Name
            Error = $_.Exception.Message
        }
    }
    
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Success "Migrations préparées: $successCount"
if ($errorCount -gt 0) {
    Write-Error "Erreurs: $errorCount"
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Warning "IMPORTANT: Cette méthode automatique nécessite un accès API Management"
Write-Info "Veuillez utiliser une des méthodes alternatives ci-dessous"
