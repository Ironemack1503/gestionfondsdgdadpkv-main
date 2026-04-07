# Import RESULTAT_COMPLET.csv via fichiers SQL temporaires
$csvPath = "$PSScriptRoot\access-exports\RESULTAT_COMPLET.csv"
$containerName = "supabase_db_fecwhtqugcxnvvvmcxif"
$batchSize = 300
$tmpSqlFile = "$PSScriptRoot\tmp_batch.sql"

$csv = Import-Csv -Path $csvPath -Encoding UTF8
$total = $csv.Count
Write-Host "Lignes a importer: $total" -ForegroundColor Cyan

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
    $end = [Math]::Min($i + $batchSize - 1, $total - 1)
    $batch = $csv[$i .. $end]
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

    $sqlText = "INSERT INTO resultats (numero, code, libelle, montant_recette, montant_depense, mois_annee, annee, num, categorie, categorie_depense, montant_lettres, comptable, daf, directeur_provincial, date_feuille, titre, cod) VALUES " + ($values -join ",") + ";"
    
    # Écrire dans un fichier temporaire puis le pipper
    [System.IO.File]::WriteAllText($tmpSqlFile, $sqlText, [System.Text.Encoding]::UTF8)
    
    $result = Get-Content $tmpSqlFile -Raw | docker exec -i $containerName psql -U postgres -d postgres 2>&1
    
    if ($result -match "INSERT") {
        $imported += $batch.Count
        $pct = [math]::Round(($imported / $total) * 100, 1)
        if ($imported % 3000 -lt $batchSize) {
            Write-Host "  [$pct%] $imported / $total" -ForegroundColor Green
        }
    } else {
        $errors++
        Write-Host "  ERREUR batch $i : $result" -ForegroundColor Red
    }
}

# Nettoyage
if (Test-Path $tmpSqlFile) { Remove-Item $tmpSqlFile -Force }

Write-Host "`nImport termine: $imported lignes, $errors erreurs" -ForegroundColor $(if($errors-eq 0){'Green'}else{'Red'})

# Vérification
docker exec -i $containerName psql -U postgres -d postgres -c "SELECT annee, COUNT(*) as nb FROM resultats GROUP BY annee ORDER BY annee;" 2>&1
