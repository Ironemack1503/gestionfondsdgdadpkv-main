param(
    [string]$AccessFile = "Gestion_Caisse -06_10_16.mdb"
)

if (-not (Test-Path $AccessFile)) {
    Write-Host "[ERREUR] Fichier '$AccessFile' introuvable!"
    exit 1
}

Write-Host "[OK] Fichier Access trouve : $AccessFile"

$exportFolder = "access-exports"
if (-not (Test-Path $exportFolder)) {
    New-Item -ItemType Directory -Name $exportFolder | Out-Null
    Write-Host "[OK] Dossier cree : $exportFolder"
}

try {
    $ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$((Resolve-Path $AccessFile).Path);Persist Security Info=False;"
    $Connection = New-Object System.Data.OleDb.OleDbConnection($ConnectionString)
    $Connection.Open()
    
    Write-Host "[OK] Connexion a Access etablie"
    
    $SchemaTable = $Connection.GetOleDbSchemaTable([System.Data.OleDb.OleDbSchemaGuid]::Tables, @($null, $null, $null, "TABLE"))
    
    $Tables = @()
    foreach ($Row in $SchemaTable.Rows) {
        $TableName = $Row["TABLE_NAME"]
        if ($TableName -notlike "MSys*") {
            $Tables += $TableName
            Write-Host "  Table trouvee : $TableName"
        }
    }
    
    if ($Tables.Count -eq 0) {
        Write-Host "[AVERTISSEMENT] Aucune table trouvee dans la base Access!"
        $Connection.Close()
        exit 1
    }
    
    foreach ($TableName in $Tables) {
        Write-Host "[ETAPE] Extraction de la table : $TableName"
        
        $Query = "SELECT * FROM [$TableName]"
        $Adapter = New-Object System.Data.OleDb.OleDbDataAdapter($Query, $Connection)
        $DataTable = New-Object System.Data.DataTable
        $Adapter.Fill($DataTable) | Out-Null
        
        $CsvFile = Join-Path $exportFolder "$TableName.csv"
        
        $DataTable | Export-Csv -Path $CsvFile -NoTypeInformation -Encoding UTF8 -Delimiter ","
        
        Write-Host "  Exporte en CSV : $CsvFile ($($DataTable.Rows.Count) lignes)"
    }
    
    $Connection.Close()
    Write-Host "[OK] Export termine ! Les fichiers CSV sont dans le dossier '$exportFolder'"
    
}
catch {
    Write-Host "[ERREUR] lors de l'extraction : $_"
    Write-Host "[INFO] Verifiez que :"
    Write-Host "  1. Microsoft Access Database Engine est installe"
    Write-Host "  2. Le fichier .mdb/.accdb est valide et accessible"
    Write-Host "  3. Aucun autre processus n'accede a la base"
    
    if ($Connection.State -eq "Open") {
        $Connection.Close()
    }
    exit 1
}
