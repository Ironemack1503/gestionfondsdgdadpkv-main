# Ce script PowerShell exporte les tables recettes, depenses et rubriques de la base Access en CSV
# Prérequis : Microsoft Access Database Engine installé (ou Access)

$accessFile = "Gestion_Caisse -06_10_16.mdb"
$tables = @("recettes", "depenses", "rubriques")

foreach ($table in $tables) {
    $csvFile = "$table.csv"
    $query = "SELECT * FROM [$table]"
    $connStr = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$accessFile;Persist Security Info=False;"
    $conn = New-Object -ComObject ADODB.Connection
    $rs = New-Object -ComObject ADODB.Recordset
    $conn.Open($connStr)
    $rs.Open($query, $conn)
    $fields = @()
    for ($i = 0; $i -lt $rs.Fields.Count; $i++) { $fields += $rs.Fields.Item($i).Name }
    $data = @()
    while (-not $rs.EOF) {
        $row = @{}
        foreach ($field in $fields) { $row[$field] = $rs.Fields.Item($field).Value }
        $data += (New-Object PSObject -Property $row)
        $rs.MoveNext()
    }
    $data | Export-Csv -Path $csvFile -NoTypeInformation -Delimiter ","
    $rs.Close()
    $conn.Close()
    Write-Host "Table $table exportée dans $csvFile"
}
Write-Host "Export terminé."
