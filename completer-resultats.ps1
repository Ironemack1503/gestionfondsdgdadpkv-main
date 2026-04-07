# =============================================================
# Compléter la table RESULTATS — extraction Access + import Supabase
# Extrait TOUTE la table RESULTAT depuis le fichier Access
# puis réimporte dans Supabase (TRUNCATE + INSERT)
# =============================================================

$mdbPath     = "$PSScriptRoot\Gestion1_Caisse -06_10_16.mdb"
$csvPath     = "$PSScriptRoot\access-exports\RESULTAT_COMPLET.csv"
$containerName = "supabase_db_fecwhtqugcxnvvvmcxif"
$batchSize   = 500

Write-Host "=== ETAPE 1 : Extraction depuis Access ===" -ForegroundColor Cyan

$connStr = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$mdbPath"
$conn = New-Object System.Data.OleDb.OleDbConnection($connStr)
$conn.Open()

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT NUMERO, CODE, LIB, MT, MDEP, MOISAN, ANNE, NUM, Categorie, Categdep, ML, COMPT, DAF, DP, DATF, TITRE, COD FROM RESULTAT ORDER BY ANNE, MOISAN, NUMERO"
$adapter = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
$dataTable = New-Object System.Data.DataTable
$adapter.Fill($dataTable) | Out-Null
$conn.Close()

Write-Host "  Lignes extraites: $($dataTable.Rows.Count)" -ForegroundColor Green

# Exporter en CSV
$dataTable | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
Write-Host "  CSV sauvegardé: $csvPath" -ForegroundColor Green

# =============================================================
Write-Host "`n=== ETAPE 2 : Vider table resultats dans Supabase ===" -ForegroundColor Cyan

$truncResult = docker exec -i $containerName psql -U postgres -d postgres -c "TRUNCATE TABLE resultats RESTART IDENTITY;" 2>&1
Write-Host "  Table vidée: $truncResult" -ForegroundColor Yellow

# =============================================================
Write-Host "`n=== ETAPE 3 : Import des données ===" -ForegroundColor Cyan

$csv = Import-Csv -Path $csvPath -Encoding UTF8
$total = $csv.Count
Write-Host "  Lignes à importer: $total"

function Clean-SqlStr($val) {
    if ($null -eq $val -or $val -eq '') { return 'NULL' }
    $escaped = $val.ToString().Replace("'", "''")
    return "'$escaped'"
}

function Clean-Num($val) {
    if ($null -eq $val -or $val -eq '' -or $val -eq ' ') { return '0' }
    $cleaned = $val.ToString().Trim().Replace(',', '.').Replace(' ', '')
    if ($cleaned -match '^-?\d+\.?\d*$') { return $cleaned }
    return '0'
}

function Clean-Int($val) {
    if ($null -eq $val -or $val -eq '' -or $val -eq ' ') { return '0' }
    $cleaned = $val.ToString().Trim()
    if ($cleaned -match '^\d+$') { return $cleaned }
    return '0'
}

$imported = 0
$errors = 0

for ($i = 0; $i -lt $total; $i += $batchSize) {
    $batch = $csv[$i .. [Math]::Min($i + $batchSize - 1, $total - 1)]
    $values = @()

    foreach ($row in $batch) {
        $vals = @(
            Clean-Int($row.NUMERO),
            Clean-SqlStr($row.CODE),
            Clean-SqlStr($row.LIB),
            Clean-Num($row.MT),
            Clean-Num($row.MDEP),
            Clean-SqlStr($row.MOISAN),
            Clean-Int($row.ANNE),
            Clean-Int($row.NUM),
            Clean-SqlStr($row.Categorie),
            Clean-SqlStr($row.Categdep),
            Clean-SqlStr($row.ML),
            Clean-SqlStr($row.COMPT),
            Clean-SqlStr($row.DAF),
            Clean-SqlStr($row.DP),
            Clean-SqlStr($row.DATF),
            Clean-SqlStr($row.TITRE),
            Clean-SqlStr($row.COD)
        )
        $values += "($($vals -join ','))"
    }

    $sql = "INSERT INTO resultats (numero, code, libelle, montant_recette, montant_depense, mois_annee, annee, num, categorie, categorie_depense, montant_lettres, comptable, daf, directeur_provincial, date_feuille, titre, cod) VALUES $($values -join ",`n");"

    $result = $sql | docker exec -i $containerName psql -U postgres -d postgres 2>&1
    
    if ($result -match "INSERT") {
        $batchCount = $batch.Count
        $imported += $batchCount
        $pct = [math]::Round(($imported / $total) * 100, 1)
        Write-Host "  [$pct%] $imported / $total importés" -ForegroundColor Green
    } else {
        $errors++
        Write-Host "  ERREUR batch $($i): $result" -ForegroundColor Red
    }
}

# =============================================================
Write-Host "`n=== ETAPE 4 : Vérification ===" -ForegroundColor Cyan

$check = docker exec -i $containerName psql -U postgres -d postgres -c "
SELECT annee, categorie, COUNT(*) as nb, 
  SUM(montant_recette) as total_rec, 
  SUM(montant_depense) as total_dep
FROM resultats 
GROUP BY annee, categorie 
ORDER BY annee, categorie;" 2>&1

Write-Host $check

$totalCheck = docker exec -i $containerName psql -U postgres -d postgres -c "SELECT COUNT(*) as total FROM resultats;" 2>&1
Write-Host "`nTotal final: $totalCheck" -ForegroundColor Green
Write-Host "Importés: $imported | Erreurs: $errors" -ForegroundColor $(if ($errors -eq 0) { 'Green' } else { 'Yellow' })
