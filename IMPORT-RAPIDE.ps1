Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IMPORT DE BASE ACCESS VERS SUPABASE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

function Confirm-Action {
    param([string]$Message)
    $response = Read-Host "$Message (y/n)"
    return $response -eq "y"
}

Write-Host "[ETAPE 1] Verification des prerequis" -ForegroundColor Yellow

try {
    $TestConnection = New-Object System.Data.OleDb.OleDbConnection("Provider=Microsoft.ACE.OLEDB.12.0;")
    Write-Host "[OK] Microsoft ACE OLEDB 12.0 : trouve"
}
catch {
    Write-Host "[ERREUR] Microsoft ACE OLEDB 12.0 n'est pas installe"
    exit 1
}

$accessFile = "Gestion_Caisse -06_10_16.mdb"
if (Test-Path $accessFile) {
    $fileSize = (Get-Item $accessFile).Length / 1MB
    Write-Host "[OK] Fichier Access trouve : $([Math]::Round($fileSize, 2)) MB"
} else {
    Write-Host "[ERREUR] Fichier Access introuvable"
    exit 1
}

Write-Host "`n[ETAPE 2] Extraction des donnees d'Access" -ForegroundColor Yellow
if (Confirm-Action "Commencer l'extraction ?") {
    & .\extraire-access_v2.ps1 -AccessFile $accessFile
}

Write-Host "`n[ETAPE 3] Analyse et generation SQL" -ForegroundColor Yellow
if (Confirm-Action "Generer les migrations SQL ?") {
    & .\analyser-et-importer_v2.ps1
}

Write-Host "`n[ETAPE 4] Deploiement des migrations" -ForegroundColor Yellow
if (Confirm-Action "Deployer les migrations Supabase ?") {
    Write-Host "Execution : npx supabase db push"
    & npx supabase db push
}

Write-Host "`n[ETAPE 5] Import des donnees" -ForegroundColor Yellow
if (Confirm-Action "Importer les donnees CSV ?") {
    & .\importer-donnees_v2.ps1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "IMPORT TERMINE !" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
