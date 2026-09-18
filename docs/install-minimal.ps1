# ==============================================================================
# Local Brain — Minimal Edition Installer (PowerShell One-Liner)
# Usage: irm https://cambrianminds.github.io/local-brain/install-minimal.ps1 | iex
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host @"

  ██╗      ██████╗  ██████╗ █████╗ ██╗     ██████╗ ██████╗  █████╗ ██╗███╗   ██╗
  ██║     ██╔═══██╗██╔════╝██╔══██╗██║     ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║
  ██║     ██║   ██║██║     ███████║██║     ██████╔╝██████╔╝███████║██║██╔██╗ ██║
  ██║     ██║   ██║██║     ██╔══██║██║     ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║
  ███████╗╚██████╔╝╚██████╗██║  ██║███████╗██████╔╝██║  ██║██║  ██║██║██║ ╚████║
  ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
                      MINIMAL EDITION (~85 MB)
          Zero-Egress Private Document Intelligence & Vector Vault

"@ -ForegroundColor Cyan

# 1. System Pre-flight Checks
Write-Host "[*] Checking system environment..." -ForegroundColor DarkGray
if ($env:OS -notlike "*Windows*") {
    Write-Error "Local Brain Windows Installer only supports Windows 10/11 64-bit."
    exit 1
}

# 2. Resolve Installer Location
$RepoOwner = "CambrianMinds"
$RepoName  = "local-brain"
$ExeName   = "Local-Brain-Minimal-Setup-1.0.0.exe"
$ReleaseUrl = "https://github.com/$RepoOwner/$RepoName/releases/latest/download/$ExeName"
$TempInstaller = "$env:TEMP\$ExeName"

# Check local workspace cache first
$LocalCandidate = "D:\tools\local-brain\dist\installer-minimal\$ExeName"
if (Test-Path $LocalCandidate) {
    Write-Host "[*] Detected local installer cache: $LocalCandidate" -ForegroundColor Green
    Copy-Item -Path $LocalCandidate -Destination $TempInstaller -Force
} else {
    Write-Host "[*] Downloading Local Brain Minimal from GitHub Releases..." -ForegroundColor Yellow
    Write-Host "    Source: $ReleaseUrl" -ForegroundColor DarkGray
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $ReleaseUrl -OutFile $TempInstaller -UseBasicParsing
    } catch {
        Write-Warning "Could not reach remote GitHub Release directly ($($_.Exception.Message))."
        Write-Host "[!] If release is building, you can clone and build locally with:" -ForegroundColor Yellow
        Write-Host "    git clone https://github.com/$RepoOwner/$RepoName.git" -ForegroundColor Cyan
        Write-Host "    npm install; npm run build:dist:minimal" -ForegroundColor Cyan
        exit 1
    }
}

# 3. Execute Installer
Write-Host "[*] Launching Local Brain Minimal Setup..." -ForegroundColor Cyan
Start-Process -FilePath $TempInstaller -Wait

Write-Host @"

  ✔ Local Brain Minimal successfully installed!
  -------------------------------------------------------------
  To enable on-device local SLM inference:
  Place any .gguf model (Gemma, Llama, Qwen) in your models directory:
  %LOCALAPPDATA%\Programs\Local Brain\resources\models\llm\

  Launch Local Brain from your Start Menu or Desktop!
"@ -ForegroundColor Green
