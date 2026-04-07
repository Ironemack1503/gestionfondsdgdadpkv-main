$mdb = "C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\Gestion1_Caisse -06_10_16.mdb"
$cs = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=`"$mdb`";"
$c = New-Object System.Data.OleDb.OleDbConnection($cs)
$c.Open()

Write-Host "=== Depenses DECEMBRE/2025 avec CODE IMP ==="
$q = $c.CreateCommand()
$q.CommandText = "SELECT TOP 25 NBEO, Num_Mvt, Motif_Mvt, MT_Chiffre_Mvt_D, CODE FROM MouvementsF WHERE MOISAN='DECEMBRE/2025' AND MT_Chiffre_Mvt_D > 0 ORDER BY Num_Mvt"
$rd = $q.ExecuteReader()
while ($rd.Read()) {
    $ord = $rd['Num_Mvt']
    $beo = $rd['NBEO']
    $code = $rd['CODE']
    $mt = $rd['MT_Chiffre_Mvt_D']
    $motif = $rd['Motif_Mvt']
    Write-Host "ORD=$ord BEO=$beo CODE=$code MT=$mt Motif=$motif"
}
$rd.Close()

Write-Host ""
Write-Host "=== Export NBEO->CODE pour toutes les depenses (CSV) ==="
$q2 = $c.CreateCommand()
$q2.CommandText = "SELECT NBEO, CODE FROM MouvementsF WHERE MT_Chiffre_Mvt_D > 0 AND NBEO IS NOT NULL AND CODE IS NOT NULL AND CODE <> ''"
$rd2 = $q2.ExecuteReader()
$lines = @("nbeo,code")
$cnt = 0
while ($rd2.Read()) {
    $beo = "$($rd2.GetValue(0))".Trim()
    $code = "$($rd2.GetValue(1))".Trim()
    if ($beo -ne "" -and $code -ne "" -and $code -ne "-") {
        $lines += "$beo,$code"
        $cnt++
    }
}
$rd2.Close()
Write-Host "Lignes: $cnt"
$lines | Set-Content -Path "C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\mvt_nbeo_code.csv" -Encoding UTF8
Write-Host "CSV: tools\mvt_nbeo_code.csv"

$c.Close()
