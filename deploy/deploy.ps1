# ================================================================
# deploy.ps1 – Script de déploiement GestCaisse
# Un seul script pour tout : certs, build Docker, lancement, firewall
#
# Usage :
#   cd deploy
#   .\deploy.ps1                     # déploiement complet (auto-IP)
#   .\deploy.ps1 -ServerIP 192.168.1.50   # forcer une IP
#   .\deploy.ps1 -Action stop        # arrêter les conteneurs
#   .\deploy.ps1 -Action logs        # voir les logs en temps réel
#   .\deploy.ps1 -Action restart     # redémarrer
#   .\deploy.ps1 -Action status      # état des conteneurs
# ================================================================

param(
    [string]$ServerIP = "",
    [ValidateSet("deploy","stop","restart","logs","status","rebuild")]
    [string]$Action   = "deploy"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# ================================================================
# Constantes
# ================================================================
$SUPABASE_KEY  = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
$SUPABASE_PORT = 45321
$APP_PORT_HTTP  = 80
$APP_PORT_HTTPS = 443

# ================================================================
# Fonctions utilitaires
# ================================================================

function Write-Banner {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║   GestCaisse – Déploiement LAN Production    ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step([string]$msg) {
    Write-Host "  ▶ $msg" -ForegroundColor Yellow
}

function Write-OK([string]$msg) {
    Write-Host "  ✔ $msg" -ForegroundColor Green
}

function Write-Fail([string]$msg) {
    Write-Host "  ✘ $msg" -ForegroundColor Red
}

function Test-Docker {
    try {
        $out = docker info 2>&1
        if ($LASTEXITCODE -ne 0) { return $false }
        return $true
    } catch { return $false }
}

function Get-LanIP {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notmatch '^127\.' -and
            $_.IPAddress -notmatch '^169\.254\.' -and
            $_.PrefixOrigin -ne 'WellKnown'
        } |
        Sort-Object InterfaceMetric |
        Select-Object -First 1 -ExpandProperty IPAddress
    return $ip
}

function Test-SupabaseRunning {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:${SUPABASE_PORT}/rest/v1/" `
            -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Set-FirewallRules {
    Write-Step "Configuration du pare-feu Windows..."
    $rules = @(
        @{ Name="GestCaisse HTTP";  Port=80  },
        @{ Name="GestCaisse HTTPS"; Port=443 }
    )
    foreach ($rule in $rules) {
        $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
        if (-not $existing) {
            New-NetFirewallRule `
                -DisplayName $rule.Name `
                -Direction Inbound `
                -Protocol TCP `
                -LocalPort $rule.Port `
                -Action Allow `
                -Profile Any | Out-Null
            Write-OK "Règle pare-feu créée : $($rule.Name) (port $($rule.Port))"
        } else {
            Write-OK "Règle pare-feu déjà présente : $($rule.Name)"
        }
    }
}

# ================================================================
# Actions secondaires
# ================================================================

if ($Action -eq "stop") {
    Write-Banner
    Write-Step "Arrêt des conteneurs..."
    docker-compose down
    Write-OK "Arrêté."
    exit 0
}

if ($Action -eq "restart") {
    Write-Banner
    Write-Step "Redémarrage..."
    docker-compose restart
    Write-OK "Redémarré."
    exit 0
}

if ($Action -eq "logs") {
    docker-compose logs -f gestcaisse-web
    exit 0
}

if ($Action -eq "status") {
    docker-compose ps
    exit 0
}

# ================================================================
# DÉPLOIEMENT PRINCIPAL (deploy ou rebuild)
# ================================================================

Write-Banner

# ----------------------------------------------------------------
# 1. Vérifier Docker
# ----------------------------------------------------------------
Write-Step "Vérification de Docker Desktop..."
if (-not (Test-Docker)) {
    Write-Fail "Docker Desktop n'est pas démarré ou non installé."
    Write-Host "     → Démarrez Docker Desktop puis relancez ce script." -ForegroundColor White
    exit 1
}
Write-OK "Docker opérationnel."

# ----------------------------------------------------------------
# 2. IP LAN du serveur
# ----------------------------------------------------------------
Write-Step "Détection de l'adresse IP LAN..."
if (-not $ServerIP) {
    $ServerIP = Get-LanIP
}
if (-not $ServerIP) {
    Write-Fail "Impossible de détecter l'IP LAN."
    Write-Host "     → Relancez avec : .\deploy.ps1 -ServerIP 192.168.x.x" -ForegroundColor White
    exit 1
}
Write-OK "IP du serveur : $ServerIP"

# ----------------------------------------------------------------
# 3. Vérifier que Supabase tourne
# ----------------------------------------------------------------
Write-Step "Vérification de Supabase local (port $SUPABASE_PORT)..."
if (-not (Test-SupabaseRunning)) {
    Write-Host ""
    Write-Host "  Supabase n'est pas lancé. Démarrage en cours..." -ForegroundColor Yellow
    Set-Location ".."
    Start-Process -FilePath "npx" -ArgumentList "supabase", "start" `
        -NoNewWindow -Wait
    Set-Location "deploy"
    Start-Sleep -Seconds 5
    if (-not (Test-SupabaseRunning)) {
        Write-Fail "Supabase n'a pas pu démarrer. Vérifiez manuellement."
        exit 1
    }
}
Write-OK "Supabase opérationnel."

# ----------------------------------------------------------------
# 4. Générer les certificats SSL si absents
# ----------------------------------------------------------------
$CertsDir   = "$PSScriptRoot\nginx\certs"
$ServerCert = "$CertsDir\server.crt"
$ServerKey  = "$CertsDir\server.key"

if (-not (Test-Path $ServerCert) -or -not (Test-Path $ServerKey)) {
    Write-Step "Génération des certificats SSL..."
    & "$PSScriptRoot\generate-certs.ps1" -ServerIP $ServerIP -OutputDir $CertsDir
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Échec de la génération des certificats."
        exit 1
    }
} else {
    Write-OK "Certificats SSL déjà présents."
}

# ----------------------------------------------------------------
# 5. Créer le fichier .env pour docker-compose
# ----------------------------------------------------------------
Write-Step "Création du fichier d'environnement de build..."

$EnvContent = @"
# Généré automatiquement par deploy.ps1 – NE PAS MODIFIER MANUELLEMENT
VITE_SUPABASE_URL=https://$ServerIP/api
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_KEY
"@

[System.IO.File]::WriteAllText("$PSScriptRoot\.env", $EnvContent)
Write-OK "Fichier .env créé (SUPABASE_URL = https://$ServerIP/api)"

# ----------------------------------------------------------------
# 6. Build de l'image Docker
# ----------------------------------------------------------------
$BuildFlag = if ($Action -eq "rebuild") { "--no-cache" } else { "" }
Write-Step "Build de l'image Docker (peut prendre 2-5 minutes)..."
Write-Host "     (le build npm est exécuté à l'intérieur du conteneur)" -ForegroundColor Gray

if ($BuildFlag) {
    docker-compose build --no-cache gestcaisse-web
} else {
    docker-compose build gestcaisse-web
}

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Échec du build Docker."
    exit 1
}
Write-OK "Image Docker construite avec succès."

# ----------------------------------------------------------------
# 7. Lancer les conteneurs
# ----------------------------------------------------------------
Write-Step "Démarrage du conteneur Nginx..."
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Impossible de démarrer le conteneur."
    docker-compose logs gestcaisse-web
    exit 1
}
Write-OK "Conteneur démarré."

# ----------------------------------------------------------------
# 8. Configurer le pare-feu Windows
# ----------------------------------------------------------------
Write-Step "Configuration du pare-feu..."
try {
    Set-FirewallRules
} catch {
    Write-Host "  ⚠ Pare-feu : droits insuffisants, configurez manuellement les ports 80/443." -ForegroundColor DarkYellow
}

# ----------------------------------------------------------------
# 9. Attendre que le service réponde
# ----------------------------------------------------------------
Write-Step "Attente du démarrage de l'application..."
$MaxTries = 15
$Ok = $false
for ($i = 1; $i -le $MaxTries; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost/health" `
            -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $Ok = $true; break }
    } catch {}
    Write-Host "     attente... ($i/$MaxTries)" -ForegroundColor Gray
}

if (-not $Ok) {
    Write-Host "  ⚠ L'application tarde à répondre. Vérifiez les logs : .\deploy.ps1 -Action logs" -ForegroundColor DarkYellow
} else {
    Write-OK "Application prête !"
}

# ----------------------------------------------------------------
# 10. Résumé et instructions
# ----------------------------------------------------------------
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "   DÉPLOIEMENT RÉUSSI" -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   URL d'accès (réseau local) :" -ForegroundColor White
Write-Host "     https://$ServerIP" -ForegroundColor Cyan
Write-Host "     http://$ServerIP          (redirigé vers HTTPS)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Sur ce PC serveur :" -ForegroundColor White
Write-Host "     https://localhost" -ForegroundColor Cyan
Write-Host ""
Write-Host "   POUR LES PC CLIENTS (première connexion) :" -ForegroundColor Yellow
Write-Host "     Installer le certificat CA : nginx\certs\ca.crt" -ForegroundColor White
Write-Host "     Sur chaque PC client (PowerShell Admin) :" -ForegroundColor Gray
Write-Host "     Import-Certificate -FilePath 'ca.crt' -CertStoreLocation 'Cert:\LocalMachine\Root'" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Commandes utiles :" -ForegroundColor White
Write-Host "     .\deploy.ps1 -Action logs      # voir les logs" -ForegroundColor Gray
Write-Host "     .\deploy.ps1 -Action status    # état des conteneurs" -ForegroundColor Gray
Write-Host "     .\deploy.ps1 -Action restart   # redémarrer" -ForegroundColor Gray
Write-Host "     .\deploy.ps1 -Action rebuild   # rebuild complet" -ForegroundColor Gray
Write-Host "     .\deploy.ps1 -Action stop      # arrêter" -ForegroundColor Gray
Write-Host ""
Write-Host "   ⚡ Le conteneur redémarre automatiquement avec Windows/Docker Desktop." -ForegroundColor DarkGray
Write-Host ""
