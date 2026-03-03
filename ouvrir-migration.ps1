# Script pour ouvrir Supabase Studio et afficher les instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION BASE DE DONNEES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Je vais ouvrir Supabase Studio dans votre navigateur" -ForegroundColor White
Write-Host "2. Cliquez sur SQL Editor dans le menu de gauche" -ForegroundColor White
Write-Host "3. Le SQL est copie dans votre presse-papiers" -ForegroundColor White
Write-Host "4. Appuyez Ctrl+V pour le coller" -ForegroundColor White
Write-Host "5. Cliquez Run (bouton vert)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  CODE SQL A EXECUTER" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$sqlCode = @"
ALTER TABLE public.recettes 
ADD COLUMN IF NOT EXISTS imp VARCHAR(20),
ADD COLUMN IF NOT EXISTS libelle TEXT;

UPDATE public.recettes 
SET libelle = motif 
WHERE libelle IS NULL;

ALTER TABLE public.depenses
ADD COLUMN IF NOT EXISTS imp VARCHAR(20),
ADD COLUMN IF NOT EXISTS libelle TEXT;

UPDATE public.depenses 
SET libelle = motif 
WHERE libelle IS NULL;
"@

Write-Host $sqlCode -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Copier le SQL dans le presse-papiers
$sqlCode | Set-Clipboard
Write-Host "Le code SQL a ete copie dans votre presse-papiers !" -ForegroundColor Green
Write-Host "Utilisez Ctrl+V pour le coller dans Supabase Studio" -ForegroundColor Gray
Write-Host ""

# Ouvrir Supabase Studio
Write-Host "Ouverture de Supabase Studio..." -ForegroundColor Cyan
Start-Process "http://127.0.0.1:54323"

Write-Host ""
Write-Host "Attendez que Supabase Studio s ouvre..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "RAPPEL DES ETAPES:" -ForegroundColor Yellow
Write-Host "  1. Dans Supabase Studio, cliquez SQL Editor" -ForegroundColor White
Write-Host "  2. Appuyez Ctrl+V pour coller le SQL" -ForegroundColor White
Write-Host "  3. Cliquez Run" -ForegroundColor White
Write-Host "  4. Attendez le message Success" -ForegroundColor White
Write-Host "  5. Rechargez l application (F5)" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche quand c est termine..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
