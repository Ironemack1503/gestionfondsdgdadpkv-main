# ========================================
# Installation Supabase CLI via NPX
# Solution Alternative
# ========================================

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host "OK $args" -ForegroundColor Green }
function Write-Info { Write-Host "INFO $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "ATTENTION $args" -ForegroundColor Yellow }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INSTALLATION SUPABASE (NPX)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Info "Verification Docker..."
try {
    docker --version | Out-Null
    Write-Success "Docker OK"
} catch {
    Write-Warning "Docker non demarre. Demarrez Docker Desktop SVP."
    exit 1
}

Write-Host ""
Write-Info "Installation de Supabase via npm (dans le projet)..."
Write-Host ""

# Installer supabase comme dépendance locale
npm install supabase --save-dev

Write-Host ""
Write-Success "Installation terminee!"
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Pour utiliser Supabase, utilisez:" -ForegroundColor Yellow
Write-Host "  npx supabase start" -ForegroundColor White
Write-Host "  npx supabase status" -ForegroundColor White
Write-Host "  npx supabase stop" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Voulez-vous demarrer Supabase maintenant? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "O" -or $response -eq "o") {
    Write-Info "Demarrage de Supabase..."
    Write-Warning "Premiere execution: telechargement ~500MB, patientez 2-5 min..."
    Write-Host ""
    npx supabase start
}
