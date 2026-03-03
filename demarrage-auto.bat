@echo off
REM ========================================
REM DEMARRAGE AUTOMATIQUE - VERSION SIMPLIFIEE
REM ========================================
REM Ce fichier batch peut être placé dans le dossier
REM Démarrage de Windows pour un démarrage automatique
REM 
REM Dossier: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
REM ========================================

echo ========================================
echo   DEMARRAGE DE L'APPLICATION DGDA
echo ========================================
echo.

REM Se déplacer dans le répertoire du script
cd /d "%~dp0"

echo Repertoire de travail: %CD%
echo.

REM Attendre 30 secondes pour laisser le système démarrer
echo Attente du demarrage du systeme (30 secondes)...
timeout /t 30 /nobreak >nul

REM Démarrer le script PowerShell principal
echo Lancement du script de demarrage...
powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0demarrage-auto-windows.ps1"

echo.
echo Script de demarrage lance !
echo Les services demarrent en arriere-plan...
echo.

REM Fermer cette fenêtre après 5 secondes
timeout /t 5 >nul
exit
