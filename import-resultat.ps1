# Import des données de la table RESULTAT (Access) vers Supabase
# Table source: RESULTAT.csv (24053 lignes)
# Table cible: resultats

$csvPath = "$PSScriptRoot\access-exports\RESULTAT.csv"
$containerName = "supabase_db_fecwhtqugcxnvvvmcxif"

Write-Host "=== Import table RESULTAT ===" -ForegroundColor Cyan
Write-Host "Fichier: $csvPath"

# Lire le CSV
$data = Import-Csv $csvPath -Encoding Default
Write-Host "Lignes lues: $($data.Count)" -ForegroundColor Green

# Importer par lots de 500
$batchSize = 500
$total = $data.Count
$imported = 0
$errors = 0

for ($i = 0; $i -lt $total; $i += $batchSize) {
    $batch = $data[$i..([Math]::Min($i + $batchSize - 1, $total - 1))]
    $values = @()
    
    foreach ($row in $batch) {
        # Nettoyer les valeurs
        $numero = if ($row.NUMERO -match '^\d+$') { $row.NUMERO } else { "0" }
        $code = ($row.CODE -replace "'", "''").Trim()
        $lib = ($row.LIB -replace "'", "''").Trim()
        
        # Montants : remplacer virgule par point
        $mt = ($row.MT -replace ',', '.').Trim()
        if (-not ($mt -match '^\d+\.?\d*$')) { $mt = "0" }
        
        $mdep = ($row.MDEP -replace ',', '.').Trim()
        if (-not ($mdep -match '^\d+\.?\d*$')) { $mdep = "0" }
        
        $moisan = ($row.MOISAN -replace "'", "''").Trim()
        $annee = if ($row.ANNE -match '^\d+$') { $row.ANNE } else { "0" }
        $num = if ($row.NUM -match '^\d+$') { $row.NUM } else { "0" }
        $categorie = ($row.Categorie -replace "'", "''").Trim()
        $categdep = ($row.Categdep -replace "'", "''").Trim()
        $ml = ($row.ML -replace "'", "''").Trim()
        $compt = ($row.COMPT -replace "'", "''").Trim()
        $daf = ($row.DAF -replace "'", "''").Trim()
        $dp = ($row.DP -replace "'", "''").Trim()
        $datf = ($row.DATF -replace "'", "''").Trim()
        $titre = ($row.TITRE -replace "'", "''").Trim()
        $cod = ($row.COD -replace "'", "''").Trim()
        
        $values += "($numero, '$code', '$lib', $mt, $mdep, '$moisan', $annee, $num, '$categorie', '$categdep', '$ml', '$compt', '$daf', '$dp', '$datf', '$titre', '$cod')"
    }
    
    $sql = "INSERT INTO resultats (numero, code, libelle, montant_recette, montant_depense, mois_annee, annee, num, categorie, categorie_depense, montant_lettres, comptable, daf, directeur_provincial, date_feuille, titre, cod) VALUES " + ($values -join ",`n") + ";"
    
    # Envoyer via stdin pour éviter les problèmes de taille de commande
    $result = $sql | docker exec -i $containerName psql -U postgres -d postgres 2>&1
    
    if ($result -match "INSERT") {
        $count = [int]($result -replace "INSERT 0 ", "")
        $imported += $count
    } else {
        $errors++
        Write-Host "  Erreur lot $([Math]::Floor($i / $batchSize) + 1): $result" -ForegroundColor Red
    }
    
    $pct = [Math]::Round(($i + $batch.Count) / $total * 100)
    Write-Host "`r  Import: $imported / $total ($pct%)" -NoNewline -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Import terminé ===" -ForegroundColor Cyan
Write-Host "  Importés: $imported" -ForegroundColor Green
Write-Host "  Erreurs lots: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })

# Vérification
$check = docker exec -i $containerName psql -U postgres -d postgres -c "SELECT COUNT(*) as total, COUNT(DISTINCT annee) as annees, COUNT(DISTINCT categorie) as categories FROM resultats;" 2>&1
Write-Host "`nVérification:" -ForegroundColor Cyan
Write-Host $check
