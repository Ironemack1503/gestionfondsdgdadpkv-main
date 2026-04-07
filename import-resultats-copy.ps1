# Regenerate clean CSV and import via COPY FROM STDIN
Set-Location $PSScriptRoot

Write-Host "=== Etape 1: CSV nettoyage ===" -ForegroundColor Cyan
$csv = Import-Csv '.\access-exports\RESULTAT_COMPLET.csv' -Encoding UTF8
Write-Host "  Source: $($csv.Count) lignes"

$writer = [System.IO.StreamWriter]::new("$PSScriptRoot\access-exports\RESULTAT_CLEAN.csv", $false, [System.Text.UTF8Encoding]::new($false))
$writer.Write('numero,code,libelle,montant_recette,montant_depense,mois_annee,annee,num,categorie,categorie_depense,montant_lettres,comptable,daf,directeur_provincial,date_feuille,titre,cod')

foreach ($r in $csv) {
    $n  = if ($r.NUMERO -and $r.NUMERO.Trim()) { $r.NUMERO.Trim() } else { '0' }
    $mt = if ($r.MT -and $r.MT.Trim()) { $r.MT.Trim().Replace(',','.') } else { '0' }
    $md = if ($r.MDEP -and $r.MDEP.Trim()) { $r.MDEP.Trim().Replace(',','.') } else { '0' }
    $a  = if ($r.ANNE -and $r.ANNE.Trim()) { $r.ANNE.Trim() } else { '0' }
    $nu = if ($r.NUM -and $r.NUM.Trim()) { $r.NUM.Trim() } else { '0' }

    $co = ($r.CODE -replace '"','""')
    $li = ($r.LIB -replace '"','""')
    $mo = ($r.MOISAN -replace '"','""')
    $ca = ($r.Categorie -replace '"','""')
    $cd = ($r.Categdep -replace '"','""')
    $ml = ($r.ML -replace '"','""')
    $cm = ($r.COMPT -replace '"','""')
    $da = ($r.DAF -replace '"','""')
    $dp = ($r.DP -replace '"','""')
    $dt = ($r.DATF -replace '"','""')
    $ti = ($r.TITRE -replace '"','""')
    $cc = ($r.COD -replace '"','""')

    $writer.Write("`n$n,""$co"",""$li"",$mt,$md,""$mo"",$a,$nu,""$ca"",""$cd"",""$ml"",""$cm"",""$da"",""$dp"",""$dt"",""$ti"",""$cc""")
}
$writer.Close()
Write-Host "  CSV pret" -ForegroundColor Green

Write-Host "`n=== Etape 2: Truncate table ===" -ForegroundColor Cyan
docker exec -i supabase_db_fecwhtqugcxnvvvmcxif psql -U postgres -d postgres -c "TRUNCATE TABLE resultats RESTART IDENTITY;" 2>&1

Write-Host "`n=== Etape 3: Docker cp ===" -ForegroundColor Cyan
docker cp "$PSScriptRoot\access-exports\RESULTAT_CLEAN.csv" supabase_db_fecwhtqugcxnvvvmcxif:/tmp/RESULTAT_CLEAN.csv 2>&1

Write-Host "`n=== Etape 4: COPY FROM STDIN ===" -ForegroundColor Cyan
Get-Content "$PSScriptRoot\access-exports\RESULTAT_CLEAN.csv" -Raw | docker exec -i supabase_db_fecwhtqugcxnvvvmcxif psql -U postgres -d postgres -c "COPY resultats (numero,code,libelle,montant_recette,montant_depense,mois_annee,annee,num,categorie,categorie_depense,montant_lettres,comptable,daf,directeur_provincial,date_feuille,titre,cod) FROM STDIN WITH (FORMAT csv, HEADER true);" 2>&1

Write-Host "`n=== Etape 5: Verification ===" -ForegroundColor Cyan
docker exec -i supabase_db_fecwhtqugcxnvvvmcxif psql -U postgres -d postgres -c "SELECT annee, COUNT(*) as nb FROM resultats GROUP BY annee ORDER BY annee;" 2>&1
docker exec -i supabase_db_fecwhtqugcxnvvvmcxif psql -U postgres -d postgres -c "SELECT COUNT(*) as total FROM resultats;" 2>&1
