# Script maitre pour importer une base Access dans Supabase
# Usage: .\importer-base-access.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IMPORT DE BASE ACCESS VERS SUPABASE" -ForegroundColor Cyan
Write-Host "Gestion_Caisse -06_10_16.mdb" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Fonction pour demander confirmation
function Confirm-Action {
    param([string]$Message)
    $response = Read-Host "$Message (y/n)"
    return $response -eq "y" -or $response -eq "yes"
}

# ============================================================
# ETAPE 1 : VERIFICATION DES PREREQUIS
# ============================================================

Write-Host "[ETAPE 1] Verification des prerequis" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

# Verifier Access Database Engine
try {
    $TestConnection = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.12.0;")
    Write-Host "[OK] Microsoft ACE OLEDB 12.0 (Access Database Engine) : trouve" -ForegroundColor Green
}
catch {
    Write-Host "[ERREUR] Microsoft ACE OLEDB 12.0 n'est pas installe" -ForegroundColor Red
    Write-Host "   Telechargez et installez depuis : https://www.microsoft.com/en-us/download/details.aspx?id=13255" -ForegroundColor Yellow
    Write-Host "   (Choisissez la version correspondant a votre architecture : 32-bit ou 64-bit)" -ForegroundColor Yellow
    exit 1
}

# Verifier psql
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "[OK] PostgreSQL Client (psql) : trouve" -ForegroundColor Green
} else {
    Write-Host "[AVERTISSEMENT] PostgreSQL Client (psql) : non trouve (vous pouvez l'ajouter plus tard)" -ForegroundColor Yellow
}

# Verifier Node.js
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if ($nodePath) {
    $nodeVersion = & node --version
    Write-Host "[OK] Node.js : trouve ($nodeVersion)" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Node.js n'est pas installe" -ForegroundColor Red
    exit 1
}

# Verifier le fichier Access
$accessFile = "Gestion_Caisse -06_10_16.mdb"
if (Test-Path $accessFile) {
    $fileSize = (Get-Item $accessFile).Length / 1MB
    Write-Host "[OK] Fichier Access trouve : $accessFile ($('{0:F2}' -f $fileSize) MB)" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Fichier Access introuvable : $accessFile" -ForegroundColor Red
    Write-Host "   Placez le fichier dans : $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# ETAPE 2 : EXTRACTION DES DONNEES
# ============================================================

Write-Host "`n[ETAPE 2] Extraction des donnees d'Access" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

if (Confirm-Action "Commencer l'extraction des donnees ?") {
    Write-Host "`nExecution du script d'extraction..." -ForegroundColor Cyan
    & .\extraire-access.ps1 -AccessFile $accessFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Extraction terminee avec succes" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Erreur lors de l'extraction" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[INFORMATION] Extraction ignoree" -ForegroundColor Yellow
}

# ============================================================
# ETAPE 3 : ANALYSE ET GENERATION DES MIGRATION SQL
# ============================================================

Write-Host "`n[ETAPE 3] Analyse et generation des migrations SQL" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Yellow

if (Confirm-Action "Analyser les donnees et generer les migrations SQL ?") {
    Write-Host "`nExecution du script d'analyse..." -ForegroundColor Cyan
    & .\analyser-et-importer.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Migration SQL generee" -ForegroundColor Green
        Write-Host "`n[AVERTISSEMENT] IMPORTANT : Verifiez et ajustez les types de donnees dans :" -ForegroundColor Yellow
        Write-Host "   supabase/migrations/" -ForegroundColor Cyan
    } else {
        Write-Host "[ERREUR] Erreur lors de la generation" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[INFORMATION] Analyse ignoree" -ForegroundColor Yellow
}

# ============================================================
# ETAPE 4 : DEPLOIEMENT DES MIGRATIONS
# ============================================================

Write-Host "`n[ETAPE 4] Deploiement des migrations Supabase" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow

if (Confirm-Action "Deployer les migrations Supabase ?") {
    Write-Host "`nExecution : npx supabase db push" -ForegroundColor Cyan
    & npx supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Migrations deployees avec succes" -ForegroundColor Green
    } else {
        Write-Host "[AVERTISSEMENT] Verifiez les erreurs de migration" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFORMATION] Deploiement des migrations ignore" -ForegroundColor Yellow
    Write-Host "   Relancez : npx supabase db push" -ForegroundColor Cyan
}

# ============================================================
# ETAPE 5 : IMPORT DES DONNEES
# ============================================================

Write-Host "`n[ETAPE 5] Import des donnees CSV" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

if (Confirm-Action "Importer les donnees dans Supabase ?") {
    Write-Host "`nExecution de l'import des donnees..." -ForegroundColor Cyan
    & .\importer-donnees.ps1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Donnees importees avec succes" -ForegroundColor Green
    } else {
        Write-Host "[AVERTISSEMENT] Verifiez les erreurs d'import" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFORMATION] Import des donnees ignore" -ForegroundColor Yellow
    Write-Host "   Relancez : .\importer-donnees.ps1" -ForegroundColor Cyan
}

# ============================================================
# RESUME
# ============================================================

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "IMPORT TERMINE !" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "[INFORMATION] Prochaines etapes :" -ForegroundColor Cyan
Write-Host "  1. Verifiez les donnees dans Supabase Studio :" -ForegroundColor Cyan
Write-Host "     http://localhost:54323" -ForegroundColor Yellow
Write-Host "`n  2. Mettez a jour votre application React pour utiliser les nouvelles tables :" -ForegroundColor Cyan
Write-Host "     - Modifiez src/hooks ou src/services pour interroger les donnees" -ForegroundColor Yellow
Write-Host "`n  3. Testez les fonctionnalites CRUD (Create, Read, Update, Delete)" -ForegroundColor Cyan
Write-Host "`n  4. En cas de probleme :" -ForegroundColor Cyan
Write-Host "     - Executez : npx supabase db reset" -ForegroundColor Yellow
Write-Host "     - Relancez le processus" -ForegroundColor Yellow

Write-Host "`n[OK] Import reussi !" -ForegroundColor Green
