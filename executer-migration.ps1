# Script pour exécuter la migration SQL via Supabase
Write-Host "🔄 Exécution de la migration SQL..." -ForegroundColor Cyan

# Lire le contenu du fichier SQL
$sqlContent = Get-Content -Path "MIGRATION-MANUELLE.sql" -Raw

# Se connecter à PostgreSQL via npx supabase
Write-Host "📦 Connexion à la base de données..." -ForegroundColor Yellow

# Créer un fichier temporaire pour la migration
$tempFile = "temp-migration.sql"
$sqlContent | Out-File -FilePath $tempFile -Encoding UTF8

try {
    # Exécuter via docker exec (Supabase local utilise Docker)
    $result = docker exec supabase_db_gestionfondsdgdadpkv-main psql -U postgres -d postgres -f /temp-migration.sql 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration exécutée avec succès !" -ForegroundColor Green
        Write-Host $result
    } else {
        Write-Host "⚠️ Docker non disponible, tentative alternative..." -ForegroundColor Yellow
        
        # Alternative : Utiliser l'API REST de Supabase
        $headers = @{
            "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
            "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
            "Content-Type" = "application/json"
        }
        
        # Exécuter chaque commande SQL séparément
        $commands = @(
            "ALTER TABLE public.recettes ADD COLUMN IF NOT EXISTS numero_beo VARCHAR(4), ADD COLUMN IF NOT EXISTS libelle TEXT, ADD COLUMN IF NOT EXISTS imp VARCHAR(20);",
            "UPDATE public.recettes SET libelle = motif WHERE libelle IS NULL AND motif IS NOT NULL;",
            "ALTER TABLE public.depenses ADD COLUMN IF NOT EXISTS numero_beo VARCHAR(4), ADD COLUMN IF NOT EXISTS imp VARCHAR(20), ADD COLUMN IF NOT EXISTS libelle TEXT;",
            "UPDATE public.depenses SET libelle = motif WHERE libelle IS NULL AND motif IS NOT NULL;"
        )
        
        foreach ($cmd in $commands) {
            Write-Host "Exécution: $cmd" -ForegroundColor Gray
            $body = @{ query = $cmd } | ConvertTo-Json
            
            try {
                $response = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/rpc" -Method POST -Headers $headers -Body $body
                Write-Host "✓ Commande exécutée" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ Erreur: $_" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "⚠️ Veuillez exécuter la migration manuellement via Supabase Studio:" -ForegroundColor Yellow
        Write-Host "1. Ouvrez http://127.0.0.1:54323" -ForegroundColor White
        Write-Host "2. Allez dans 'SQL Editor'" -ForegroundColor White
        Write-Host "3. Copiez le contenu de MIGRATION-MANUELLE.sql" -ForegroundColor White
        Write-Host "4. Cliquez 'Run'" -ForegroundColor White
    }
} finally {
    # Nettoyer le fichier temporaire
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
