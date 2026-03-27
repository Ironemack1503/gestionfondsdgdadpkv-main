
# ========================================
# Script de démarrage complet de l'application
# ========================================
# Ce script démarre tous les services nécessaires :
# - Supabase (API + PostgreSQL)
# - Serveur Vite (application web)
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DÉMARRAGE DE L'APPLICATION DGDA DPKV  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

# 1. Vérifier et démarrer Supabase
Write-Host "📦 Vérification de Supabase..." -ForegroundColor Yellow
$supabaseRunning = Test-Port -Port 54321
if ($supabaseRunning) {
    Write-Host "✓ Supabase est déjà en cours d'exécution" -ForegroundColor Green
    Write-Host "  - API: http://192.168.0.32:54321" -ForegroundColor Gray
    Write-Host "  - Studio: http://127.0.0.1:54323" -ForegroundColor Gray
    Write-Host "  - PostgreSQL: 192.168.0.32:54322" -ForegroundColor Gray
}
else {
    Write-Host "⚠ Supabase n'est pas démarré" -ForegroundColor Red
    Write-Host "Démarrage de Supabase..." -ForegroundColor Yellow
    $supabaseResult = npx supabase start
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Supabase démarré avec succès" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Erreur lors du démarrage de Supabase" -ForegroundColor Red
        Write-Host "  Essayez manuellement: npx supabase start" -ForegroundColor Gray
    }
Write-Host ""

# 2. Vérifier le serveur Vite
Write-Host "🌐 Vérification du serveur Vite..." -ForegroundColor Yellow
$viteRunning = Test-Port -Port 8081
if ($viteRunning) {
    Write-Host "✓ Serveur Vite déjà en cours d'exécution" -ForegroundColor Green
    Write-Host "  - Local: http://localhost:8081" -ForegroundColor Gray
    Write-Host "  - Réseau: http://192.168.0.32:8081" -ForegroundColor Gray
} else {
    Write-Host "⚠ Serveur Vite non démarré (sera démarré par VS Code)" -ForegroundColor Yellow
}

Write-Host ""

# 3. Vérifier les règles de pare-feu
Write-Host "🔒 Vérification des règles de pare-feu..." -ForegroundColor Yellow
$ports = @(
    @{Port=8081; Name="Vite Dev Server (8081)"},
    @{Port=54321; Name="Supabase Local API (54321)"},
    @{Port=54322; Name="Supabase PostgreSQL (54322)"}
)
$missingRules = @()
foreach ($portInfo in $ports) {
    $rule = Get-NetFirewallRule -DisplayName $portInfo.Name -ErrorAction SilentlyContinue
    if ($rule) {
        Write-Host "  ✓ Port $($portInfo.Port) autorisé" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Port $($portInfo.Port) NON autorisé" -ForegroundColor Red
        $missingRules += $portInfo
    }
}
if ($missingRules.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠ ATTENTION: Certains ports ne sont pas autorisés!" -ForegroundColor Red
    Write-Host "Les autres PC ne pourront pas accéder à l'application." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour autoriser les ports, exécutez en tant qu'ADMINISTRATEUR:" -ForegroundColor Cyan
    Write-Host "  .\autoriser-ports-reseau.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RÉSUMÉ DES SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
if ($supabaseRunning) {
    Write-Host "✓ Supabase (API + BDD)" -ForegroundColor Green
} else {
    Write-Host "✗ Supabase (API + BDD)" -ForegroundColor Red
}
if ($viteRunning) {
    Write-Host "✓ Serveur Web (Vite)" -ForegroundColor Green
} else {
    Write-Host "⚠ Serveur Web (Vite) - En attente" -ForegroundColor Yellow
}
if ($missingRules.Count -eq 0) {
    Write-Host "✓ Pare-feu configuré" -ForegroundColor Green
} else {
    Write-Host "✗ Pare-feu non configuré ($($missingRules.Count) ports)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ACCÈS À L'APPLICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sur ce PC: http://localhost:8081" -ForegroundColor White
Write-Host "Autres PC: http://192.168.0.32:8081" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
