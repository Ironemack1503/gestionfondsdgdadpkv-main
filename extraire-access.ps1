# Script pour extraire les données d'une base Access et les convertir en CSV
# Usage: .\extraire-access.ps1 -AccessFile "Gestion_Caisse -06_10_16.mdb"

param(
    [string]$AccessFile = "Gestion_Caisse -06_10_16.mdb"
)

# Vérifier si le fichier Access existe
if (-not (Test-Path $AccessFile)) {
    Write-Host "❌ Erreur : Fichier '$AccessFile' introuvable!" -ForegroundColor Red
    Write-Host "Placez le fichier Access dans le répertoire courant." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Fichier Access trouvé : $AccessFile" -ForegroundColor Green

# Créer un dossier pour les exports
$exportFolder = "access-exports"
if (-not (Test-Path $exportFolder)) {
    New-Item -ItemType Directory -Name $exportFolder | Out-Null
    Write-Host "📁 Dossier créé : $exportFolder" -ForegroundColor Cyan
}

# Utiliser Jet/ACE OLEDB pour lire la base Access
try {
    # Créer une connexion à la base Access
    $ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$(Resolve-Path $AccessFile);Persist Security Info=False;"
    
    $Connection = New-Object System.Data.OleDb.OleDbConnection($ConnectionString)
    $Connection.Open()
    
    Write-Host "✅ Connexion à Access établie" -ForegroundColor Green
    
    # Récupérer la liste des tables
    $SchemaTable = $Connection.GetOleDbSchemaTable([System.Data.OleDb.OleDbSchemaGuid]::Tables, @($null, $null, $null, "TABLE"))
    
    $Tables = @()
    foreach ($Row in $SchemaTable.Rows) {
        $TableName = $Row["TABLE_NAME"]
        if ($TableName -notlike "MSys*") {  # Exclure les tables système
            $Tables += $TableName
            Write-Host "  📊 Table trouvée : $TableName" -ForegroundColor Cyan
        }
    }
    
    if ($Tables.Count -eq 0) {
        Write-Host "⚠️  Aucune table trouvée dans la base Access!" -ForegroundColor Yellow
        $Connection.Close()
        exit 1
    }
    
    # Exporter chaque table en CSV
    foreach ($TableName in $Tables) {
        Write-Host "🔄 Extraction de la table : $TableName" -ForegroundColor Yellow
        
        $Query = "SELECT * FROM [$TableName]"
        $Adapter = New-Object System.Data.OleDb.OleDbDataAdapter($Query, $Connection)
        $DataTable = New-Object System.Data.DataTable
        $Adapter.Fill($DataTable) | Out-Null
        
        # Créer le fichier CSV
        $CsvFile = Join-Path $exportFolder "$TableName.csv"
        
        # Exporter en CSV avec encodage UTF-8
        $DataTable | Export-Csv -Path $CsvFile -NoTypeInformation -Encoding UTF8 -Delimiter ","
        
        Write-Host "  ✅ Exporté en CSV : $CsvFile ($($DataTable.Rows.Count) lignes)" -ForegroundColor Green
    }
    
    $Connection.Close()
    Write-Host "`n✅ Export terminé ! Les fichiers CSV sont dans le dossier '$exportFolder'" -ForegroundColor Green
    Write-Host "📋 Prochaine étape : Analyser les schémas et créer les tables Supabase" -ForegroundColor Cyan
    
}
catch {
    Write-Host "❌ Erreur lors de l'extraction : $_" -ForegroundColor Red
    Write-Host "`nAssurez-vous que :" -ForegroundColor Yellow
    Write-Host "  1. Microsoft Access Database Engine est installé" -ForegroundColor Yellow
    Write-Host "  2. Le fichier .mdb/.accdb est valide et accessible" -ForegroundColor Yellow
    Write-Host "  3. Aucun autre processus n'accède à la base" -ForegroundColor Yellow
    
    if ($Connection.State -eq "Open") {
        $Connection.Close()
    }
    exit 1
}
