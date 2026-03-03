# ========================================
# SCRIPT DE DEMARRAGE AUTOMATIQUE WINDOWS
# ========================================
# Ce script demarre automatiquement tous les services
# au demarrage de Windows et ouvre l'application
# ========================================

# Configurer l'encodage et les preferences
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

# Fonction pour ecrire dans un fichier log
$logFile = Join-Path $PSScriptRoot "demarrage-auto.log"
function Write-Log {
    param([string]$Message, [string]$Type = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Type] $Message"
    Add-Content -Path $logFile -Value $logMessage
    
    switch ($Type) {
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        default { Write-Host $Message -ForegroundColor Cyan }
    }
}

# Demarrer le log
Write-Log "========================================" "INFO"
Write-Log "DEMARRAGE AUTOMATIQUE DE L'APPLICATION" "INFO"
Write-Log "========================================" "INFO"

# Se deplacer dans le repertoire du projet
$projectPath = $PSScriptRoot
Set-Location $projectPath
Write-Log "Repertoire de travail : $projectPath" "INFO"

# Attendre que le reseau soit disponible
Write-Log "Attente de la disponibilite du reseau..." "INFO"
$maxWaitTime = 30
$waitedTime = 0
while (-not (Test-Connection -ComputerName 127.0.0.1 -Count 1 -Quiet) -and $waitedTime -lt $maxWaitTime) {
    Start-Sleep -Seconds 2
    $waitedTime += 2
}

if ($waitedTime -lt $maxWaitTime) {
    Write-Log "[OK] Reseau disponible" "SUCCESS"
} else {
    Write-Log "[WARN] Timeout reseau, continuation..." "WARNING"
}

# Fonction pour verifier si un port est utilise
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
        return $connection
    } catch {
        return $false
    }
}

# Fonction pour attendre qu'un port soit disponible
function Wait-ForPort {
    param([int]$Port, [int]$MaxSeconds = 60)
    
    $elapsed = 0
    while (-not (Test-Port -Port $Port) -and $elapsed -lt $MaxSeconds) {
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    
    return (Test-Port -Port $Port)
}

# 1. DEMARRAGE DE SUPABASE
Write-Log "========================================" "INFO"
Write-Log "1. Demarrage de Supabase" "INFO"
Write-Log "========================================" "INFO"

$supabaseRunning = Test-Port -Port 54321

if ($supabaseRunning) {
    Write-Log "[OK] Supabase est deja en cours d'execution" "SUCCESS"
} else {
    Write-Log "Demarrage de Supabase en arriere-plan..." "INFO"
    
    try {
        # Demarrer Supabase en arriere-plan
        $supabaseProcess = Start-Process powershell -ArgumentList @(
            "-NoExit",
            "-NoProfile",
            "-Command",
            "cd '$projectPath'; npx supabase start; Write-Host 'Supabase demarre - Ne fermez pas cette fenetre'; Read-Host 'Appuyez sur Entree pour arreter Supabase'"
        ) -PassThru -WindowStyle Minimized
        
        Write-Log "Attente du demarrage de Supabase..." "INFO"
        
        if (Wait-ForPort -Port 54321 -MaxSeconds 90) {
            Write-Log "[OK] Supabase demarre avec succes (PID: $($supabaseProcess.Id))" "SUCCESS"
            Write-Log "  - API: http://192.168.0.32:54321" "INFO"
            Write-Log "  - Studio: http://127.0.0.1:54323" "INFO"
            Write-Log "  - PostgreSQL: 192.168.0.32:54322" "INFO"
        } else {
            Write-Log "[ERROR] Timeout lors du demarrage de Supabase" "ERROR"
            Write-Log "Verifiez la fenetre Supabase pour plus de details" "WARNING"
        }
    } catch {
        Write-Log "[ERROR] Erreur lors du demarrage de Supabase: $($_.Exception.Message)" "ERROR"
    }
}

# Attendre un peu pour que Supabase soit stable
Start-Sleep -Seconds 3

# 2. DEMARRAGE DU SERVEUR VITE
Write-Log "========================================" "INFO"
Write-Log "2. Demarrage du serveur Vite" "INFO"
Write-Log "========================================" "INFO"

$viteRunning = Test-Port -Port 8081

if ($viteRunning) {
    Write-Log "[OK] Serveur Vite deja en cours d'execution" "SUCCESS"
} else {
    Write-Log "Demarrage du serveur Vite..." "INFO"
    
    try {
        # Demarrer le serveur Vite en arriere-plan
        $viteProcess = Start-Process powershell -ArgumentList @(
            "-NoExit",
            "-NoProfile",
            "-Command",
            "cd '$projectPath'; npm run dev; Read-Host 'Appuyez sur Entree pour arreter le serveur'"
        ) -PassThru -WindowStyle Minimized
        
        Write-Log "Attente du demarrage du serveur Vite..." "INFO"
        
        if (Wait-ForPort -Port 8081 -MaxSeconds 60) {
            Write-Log "[OK] Serveur Vite demarre avec succes (PID: $($viteProcess.Id))" "SUCCESS"
            Write-Log "  - Local: http://localhost:8081" "INFO"
            Write-Log "  - Reseau: http://192.168.0.32:8081" "INFO"
        } else {
            Write-Log "[ERROR] Timeout lors du demarrage du serveur Vite" "ERROR"
        }
    } catch {
        Write-Log "[ERROR] Erreur lors du demarrage du serveur Vite: $($_.Exception.Message)" "ERROR"
    }
}

# 3. OUVERTURE DE L'APPLICATION DANS LE NAVIGATEUR
Write-Log "========================================" "INFO"
Write-Log "3. Ouverture de l'application" "INFO"
Write-Log "========================================" "INFO"

# Attendre que le serveur soit vraiment pret
Start-Sleep -Seconds 5

if (Test-Port -Port 8081) {
    Write-Log "Ouverture de l'application dans le navigateur..." "INFO"
    
    try {
        # Ouvrir l'application dans le navigateur par defaut
        Start-Process "http://localhost:8081"
        Write-Log "[OK] Application ouverte dans le navigateur" "SUCCESS"
    } catch {
        Write-Log "[ERROR] Erreur lors de l'ouverture du navigateur: $($_.Exception.Message)" "ERROR"
    }
} else {
    Write-Log "[ERROR] Le serveur n'est pas accessible, ouverture annulee" "ERROR"
}

# 4. RESUME FINAL
Write-Log "========================================" "INFO"
Write-Log "RESUME DES SERVICES" "INFO"
Write-Log "========================================" "INFO"

$allOk = $true

if (Test-Port -Port 54321) {
    Write-Log "[OK] Supabase (API + BDD)" "SUCCESS"
} else {
    Write-Log "[ERROR] Supabase (API + BDD)" "ERROR"
    $allOk = $false
}

if (Test-Port -Port 8081) {
    Write-Log "[OK] Serveur Vite (Application Web)" "SUCCESS"
} else {
    Write-Log "[ERROR] Serveur Vite (Application Web)" "ERROR"
    $allOk = $false
}

Write-Log "========================================" "INFO"

if ($allOk) {
    Write-Log "[OK] Tous les services sont operationnels !" "SUCCESS"
    Write-Log "Accedez a l'application : http://localhost:8081" "INFO"
} else {
    Write-Log "[WARN] Certains services n'ont pas demarre correctement" "WARNING"
    Write-Log "Consultez le fichier log : $logFile" "INFO"
}

Write-Log "========================================" "INFO"
Write-Log "Script termine - Les services continuent en arriere-plan" "INFO"
Write-Log "========================================" "INFO"

# Le script se termine mais les services continuent en arriere-plan
