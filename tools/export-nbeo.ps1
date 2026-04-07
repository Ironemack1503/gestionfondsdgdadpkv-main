# Script pour exporter NBEO depuis DepensesF et mettre à jour la table depenses en PostgreSQL
# Approche: CSV -> table temp PostgreSQL -> UPDATE JOIN

$mdbFile = "C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\Gestion1_Caisse -06_10_16.mdb"
$csvFile = "C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\depensesf_nbeo.csv"
$connStr = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=`"$mdbFile`";"

Write-Host "=== Export NBEO depuis DepensesF ==="
Write-Host "Connexion au fichier Access..."
$conn = New-Object System.Data.OleDb.OleDbConnection($connStr)
$conn.Open()

Write-Host "Lecture de DepensesF (toutes lignes)..."
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT Num_BS_Caisse, NBEO FROM DepensesF"
$reader = $cmd.ExecuteReader()

$csvLines = @("num_bs_caisse,nbeo")
$count = 0
while ($reader.Read()) {
    $numBs = "$($reader.GetValue(0))".Trim()
    $nbeo  = "$($reader.GetValue(1))".Trim()
    if ($numBs -ne "" -and $numBs -ne "0" -and $null -ne $numBs) {
        # Échapper les virgules dans les valeurs
        $numBsCsv = $numBs.Replace('"', '""')
        $nbeoCsv  = if ($nbeo) { $nbeo.Replace('"', '""') } else { "" }
        $csvLines += "`"$numBsCsv`",`"$nbeoCsv`""
        $count++
    }
}
$reader.Close()
$conn.Close()

Write-Host "Lignes exportées: $count"
$csvLines | Set-Content -Path $csvFile -Encoding UTF8
Write-Host "CSV écrit: $csvFile"

# Copier le CSV dans Docker
Write-Host "Copie vers Docker..."
docker cp $csvFile supabase_db_fecwhtqugcxnvvvmcxif:/tmp/depensesf_nbeo.csv

# SQL: créer table temp, importer, UPDATE JOIN, vérifier
$sql = @"
BEGIN;

-- Table temporaire pour les données DepensesF
DROP TABLE IF EXISTS _tmp_depensesf_nbeo;
CREATE TEMP TABLE _tmp_depensesf_nbeo (
    num_bs_caisse text,
    nbeo text
);

-- Import CSV
COPY _tmp_depensesf_nbeo FROM '/tmp/depensesf_nbeo.csv' WITH (FORMAT csv, HEADER true);

-- Statistiques avant
SELECT 'Avant mise à jour:' as etape, COUNT(*) as sans_nbeo
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

-- Mise à jour NBEO dans depenses via Num_BS_Caisse
UPDATE depenses d
SET "NBEO" = t.nbeo
FROM _tmp_depensesf_nbeo t
WHERE d."Num_BS_Caisse" = t.num_bs_caisse
  AND t.nbeo IS NOT NULL
  AND t.nbeo != '';

-- Statistiques après
SELECT 'Après mise à jour:' as etape, COUNT(*) as avec_nbeo
FROM depenses WHERE "NBEO" IS NOT NULL AND "NBEO" != '';

SELECT 'Encore sans NBEO:' as etape, COUNT(*) as sans_nbeo
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

COMMIT;
"@

$sqlFile = "C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\update-nbeo.sql"
$sql | Set-Content -Path $sqlFile -Encoding UTF8

Write-Host "Exécution SQL dans Docker..."

# Étape 1: Créer la table temporaire
docker exec supabase_db_fecwhtqugcxnvvvmcxif psql -U postgres -d postgres -c "
DROP TABLE IF EXISTS _import_depensesf_nbeo;
CREATE TABLE _import_depensesf_nbeo (
    num_bs_caisse text,
    nbeo text
);
"

# Étape 2: Importer le CSV via stdin (contourne la restriction de permissions)
Write-Host "Import CSV via stdin..."
Get-Content $csvFile -Raw | docker exec -i supabase_db_fecwhtqugcxnvvvmcxif psql -U postgres -d postgres -c "\copy _import_depensesf_nbeo FROM STDIN WITH (FORMAT csv, HEADER true)"

# Étape 3: UPDATE JOIN + vérification
$sqlUpdate = @"
BEGIN;

-- Statistiques avant
SELECT 'Avant:' as etape, COUNT(*) as sans_nbeo
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

-- Mise à jour NBEO
UPDATE depenses d
SET "NBEO" = t.nbeo
FROM _import_depensesf_nbeo t
WHERE d."Num_BS_Caisse" = t.num_bs_caisse
  AND t.nbeo IS NOT NULL
  AND t.nbeo != '';

-- Statistiques après
SELECT 'Après - avec NBEO:' as etape, COUNT(*) as nb
FROM depenses WHERE "NBEO" IS NOT NULL AND "NBEO" != '';

SELECT 'Après - sans NBEO:' as etape, COUNT(*) as nb
FROM depenses WHERE "NBEO" IS NULL OR "NBEO" = '';

-- Exemples
SELECT "Num_BS_Caisse", "NBEO", motif FROM depenses
WHERE "NBEO" IS NOT NULL AND "NBEO" != ''
ORDER BY "Num_BS_Caisse"::int NULLS LAST
LIMIT 5;

COMMIT;

DROP TABLE IF EXISTS _import_depensesf_nbeo;
"@

$sqlUpdateFile = "C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\update-nbeo-step2.sql"
$sqlUpdate | Set-Content -Path $sqlUpdateFile -Encoding UTF8
docker cp $sqlUpdateFile supabase_db_fecwhtqugcxnvvvmcxif:/tmp/update-nbeo-step2.sql
docker exec supabase_db_fecwhtqugcxnvvvmcxif psql -U postgres -d postgres -f /tmp/update-nbeo-step2.sql

Write-Host "=== Terminé ===" 
