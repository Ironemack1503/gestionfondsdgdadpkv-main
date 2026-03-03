[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
# Script de verification simple de Supabase
# A utiliser avant le demarrage de l'application

Write-Host "[VERIF] Verification de Supabase..." -ForegroundColor Cyan

# Verifier Docker Desktop
if (!(Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] Docker Desktop n'est pas demarre" -ForegroundColor Red
    Write-Host "   Demarrez Docker Desktop et relancez ce script" -ForegroundColor Yellow
    exit 1
}

# Compter les conteneurs actifs
$containers = docker ps --filter "name=supabase_" --format "{{.Names}}" | Measure-Object -Line
$count = $containers.Lines

if ($count -lt 10) {
    Write-Host ("[ATTENTION] Supabase n'est pas completement demarre ({0}/11 conteneurs)" -f $count) -ForegroundColor Yellow
    Write-Host "   Demarrage de Supabase..." -ForegroundColor Cyan
    npx supabase start

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Erreur lors du demarrage" -ForegroundColor Red
        Write-Host "   Lancez 'reparer-supabase.ps1' pour diagnostiquer" -ForegroundColor Yellow
        exit 1
    }
}

# Verifier le statut
Write-Host ""
npx supabase status

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Supabase fonctionne correctement" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "[ERREUR] Supabase detectee" -ForegroundColor Red
    Write-Host "   Lancez 'reparer-supabase.ps1' pour reparer" -ForegroundColor Yellow
    exit 1
}
