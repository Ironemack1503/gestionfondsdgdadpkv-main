# ================================================================
# generate-certs.ps1 – Génère les certificats SSL auto-signés
# Utilise OpenSSL via Docker (aucun outil supplémentaire requis)
# ================================================================

param(
    [string]$ServerIP   = "",     # IP LAN du serveur (auto-détectée si vide)
    [string]$OutputDir  = "$PSScriptRoot\nginx\certs",
    [int]   $ValidDays  = 3650    # 10 ans
)

$ErrorActionPreference = "Stop"

# ----------------------------------------------------------------
# 1. Détecter l'IP LAN si non fournie
# ----------------------------------------------------------------
if (-not $ServerIP) {
    $ServerIP = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notmatch '^127\.' -and
                       $_.IPAddress -notmatch '^169\.' -and
                       $_.IPAddress -notmatch '^172\.(1[6-9]|2\d|3[01])\.' -and
                       $_.PrefixOrigin -ne 'WellKnown' } |
        Sort-Object InterfaceMetric |
        Select-Object -First 1 -ExpandProperty IPAddress

    if (-not $ServerIP) {
        Write-Error "Impossible de détecter l'IP LAN. Relancez avec -ServerIP 192.168.x.x"
        exit 1
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Génération certificats SSL pour IP : $ServerIP" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------------
# 2. Créer le répertoire de sortie
# ----------------------------------------------------------------
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$OutputDir = (Resolve-Path $OutputDir).Path

# ----------------------------------------------------------------
# 3. Vérifier que Docker est disponible
# ----------------------------------------------------------------
try {
    $null = docker info 2>&1
} catch {
    Write-Error "Docker n'est pas disponible. Lancez Docker Desktop d'abord."
    exit 1
}

# ----------------------------------------------------------------
# 4. Générer CA + Certificat serveur via OpenSSL dans Docker
# ----------------------------------------------------------------

# Convertir le chemin Windows en chemin Docker (format Unix pour bind mount)
$DockerPath = $OutputDir -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'

$OpenSSLCommands = @"
set -e

# -- Autorité de Certification locale (CA) --
openssl genrsa -out /certs/ca.key 4096
openssl req -x509 -new -nodes \
  -key /certs/ca.key \
  -sha256 \
  -days $ValidDays \
  -out /certs/ca.crt \
  -subj "/C=CD/ST=Kinshasa/L=Kinshasa/O=DGDA/OU=IT/CN=GestCaisse-LocalCA"

# -- Clé privée du serveur --
openssl genrsa -out /certs/server.key 2048

# -- CSR (Certificate Signing Request) avec SAN pour l'IP --
cat > /tmp/san.cnf <<EOF
[req]
default_bits        = 2048
prompt              = no
default_md          = sha256
distinguished_name  = dn
req_extensions      = req_ext

[dn]
C  = CD
ST = Kinshasa
L  = Kinshasa
O  = DGDA
OU = GestCaisse
CN = $ServerIP

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = $ServerIP
IP.2 = 127.0.0.1
DNS.1 = gestcaisse.local
DNS.2 = localhost
EOF

openssl req -new -key /certs/server.key -out /tmp/server.csr -config /tmp/san.cnf

# -- Extension SAN pour le certificat final --
cat > /tmp/ext.cnf <<EOF
subjectAltName = IP:$ServerIP, IP:127.0.0.1, DNS:gestcaisse.local, DNS:localhost
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
EOF

# -- Signer le certificat avec notre CA --
openssl x509 -req \
  -in /tmp/server.csr \
  -CA /certs/ca.crt \
  -CAkey /certs/ca.key \
  -CAcreateserial \
  -out /certs/server.crt \
  -days $ValidDays \
  -sha256 \
  -extfile /tmp/ext.cnf

# -- Afficher l'empreinte --
echo ""
echo "=== Certificat généré ==="
openssl x509 -in /certs/server.crt -noout -subject -dates -fingerprint
echo ""
chmod 644 /certs/server.crt /certs/ca.crt
chmod 600 /certs/server.key /certs/ca.key
"@

Write-Host "Génération en cours via Docker (OpenSSL)..." -ForegroundColor Yellow

$TempScript = [System.IO.Path]::GetTempFileName() + ".sh"
[System.IO.File]::WriteAllText($TempScript, $OpenSSLCommands.Replace("`r`n", "`n"))

$TempScriptDocker = $TempScript -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'

docker run --rm `
    -v "${DockerPath}:/certs" `
    -v "${TempScriptDocker}:/run.sh" `
    alpine:latest `
    sh /run.sh

Remove-Item $TempScript -Force

if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec génération des certificats."
    exit 1
}

# ----------------------------------------------------------------
# 5. Instructions d'installation du CA sur les clients
# ----------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host " CERTIFICATS GÉNÉRÉS avec succès dans : $OutputDir" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Fichiers créés :" -ForegroundColor White
Write-Host "   ca.crt     → Autorité de certification (à installer sur chaque PC client)" -ForegroundColor Gray
Write-Host "   server.crt → Certificat du serveur (utilisé par Nginx)" -ForegroundColor Gray
Write-Host "   server.key → Clé privée (confidentiel, ne pas partager)" -ForegroundColor Gray
Write-Host ""
Write-Host " INSTALLATION SUR LES PC CLIENTS (Windows) :" -ForegroundColor Yellow
Write-Host " 1. Copier ca.crt sur le PC client (clé USB, partage réseau...)" -ForegroundColor White
Write-Host " 2. Double-cliquer sur ca.crt" -ForegroundColor White
Write-Host " 3. Choisir 'Autorités de certification racines de confiance'" -ForegroundColor White
Write-Host " 4. Valider → le navigateur acceptera le certificat sans avertissement" -ForegroundColor White
Write-Host ""
Write-Host " INSTALLATION RAPIDE via PowerShell (Admin) sur client :" -ForegroundColor Yellow
Write-Host "   Import-Certificate -FilePath 'ca.crt' -CertStoreLocation 'Cert:\LocalMachine\Root'" -ForegroundColor Cyan
Write-Host ""
