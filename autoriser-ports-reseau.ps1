# Script pour autoriser les ports nécessaires dans le pare-feu Windows
# Doit être exécuté en tant qu'administrateur

Write-Host "Configuration du pare-feu pour l'accès réseau..." -ForegroundColor Cyan

# Port 8081 - Serveur Vite
try {
    New-NetFirewallRule -DisplayName "Vite Dev Server (8081)" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow -ErrorAction Stop
    Write-Host "✓ Port 8081 (Vite) autorisé" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ Port 8081 (Vite) déjà autorisé" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Erreur port 8081: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Port 54321 - Supabase API
try {
    New-NetFirewallRule -DisplayName "Supabase Local API (54321)" -Direction Inbound -LocalPort 54321 -Protocol TCP -Action Allow -ErrorAction Stop
    Write-Host "✓ Port 54321 (Supabase) autorisé" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ Port 54321 (Supabase) déjà autorisé" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Erreur port 54321: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Port 54322 - PostgreSQL (optionnel)
try {
    New-NetFirewallRule -DisplayName "Supabase PostgreSQL (54322)" -Direction Inbound -LocalPort 54322 -Protocol TCP -Action Allow -ErrorAction Stop
    Write-Host "✓ Port 54322 (PostgreSQL) autorisé" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*already exists*") {
        Write-Host "✓ Port 54322 (PostgreSQL) déjà autorisé" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Erreur port 54322: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nConfiguration terminée !" -ForegroundColor Cyan
Write-Host "Les autres PC peuvent maintenant accéder à l'application via:" -ForegroundColor White
Write-Host "http://192.168.0.32:8081" -ForegroundColor Green
Write-Host "`nAppuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
