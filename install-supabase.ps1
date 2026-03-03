# ========================================
# Installation Supabase CLI
# ========================================

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host "OK $args" -ForegroundColor Green }
function Write-Info { Write-Host "INFO $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "ATTENTION $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "ERREUR $args" -ForegroundColor Red }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INSTALLATION SUPABASE CLI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Docker
Write-Info "Verification Docker..."
try {
    $dockerVersion = docker --version
    Write-Success "Docker installe: $dockerVersion"
} catch {
    Write-Error "Docker non installe ou non demarre!"
    Write-Warning "Veuillez demarrer Docker Desktop"
    exit 1
}

# Créer le dossier d'installation
$installDir = "$env:USERPROFILE\.supabase-cli"
if (!(Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

Write-Info "Telechargement Supabase CLI..."
# Essayer plusieurs URLs
$urls = @(
    "https://github.com/supabase/cli/releases/download/v2.1.0/supabase_2.1.0_windows_amd64.zip",
    "https://github.com/supabase/cli/releases/download/v2.0.0/supabase_2.0.0_windows_amd64.zip",
    "https://github.com/supabase/cli/releases/download/v1.200.3/supabase_1.200.3_windows_amd64.zip"
)

$downloaded = $false
$zipPath = "$env:TEMP\supabase.zip"

foreach ($url in $urls) {
    Write-Info "Tentative: $url"
    try {
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing -ErrorAction Stop
        Write-Success "Telechargement termine depuis: $url"
        $downloaded = $true
        break
    } catch {
        Write-Warning "URL non disponible, essai suivant..."
    }
}

if (-not $downloaded) {
    Write-Error "Impossible de telecharger Supabase CLI"
    Write-Info "Telechargement manuel depuis: https://github.com/supabase/cli/releases"
    exit 1
}

Write-Info "Extraction..."
try {
    Expand-Archive -Path $zipPath -DestinationPath $installDir -Force
    Write-Success "Extraction terminee"
} catch {
    Write-Error "Echec extraction: $($_.Exception.Message)"
    exit 1
}

# Nettoyer
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue

# Ajouter au PATH de la session actuelle
$env:PATH += ";$installDir"

# Ajouter au PATH utilisateur permanent
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    Write-Info "Ajout au PATH utilisateur..."
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
    Write-Success "PATH mis a jour"
}

Write-Host ""
Write-Info "Verification installation..."
try {
    $supabaseVersion = & "$installDir\supabase.exe" --version
    Write-Success "Supabase CLI installe: $supabaseVersion"
} catch {
    Write-Error "Impossible de verifier l'installation"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   INSTALLATION TERMINEE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Emplacement: $installDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host "1. Fermez et rouvrez PowerShell (pour charger le nouveau PATH)" -ForegroundColor White
Write-Host "2. Tapez: supabase start" -ForegroundColor White
Write-Host "3. Attendez 1-2 minutes (telechargement des images Docker)" -ForegroundColor White
Write-Host ""
Write-Host "Voulez-vous demarrer Supabase maintenant? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Write-Info "Demarrage de Supabase..."
    Write-Warning "Cela peut prendre 1-2 minutes la première fois..."
    Write-Host ""
    
    cd "C:\Users\DGDA\Downloads\gestionfonsdgdadpkv-main\gestionfonsdgdadpkv-main\gestionfondsdgdadpkv-main"
    & "$installDir\supabase.exe" start
}
