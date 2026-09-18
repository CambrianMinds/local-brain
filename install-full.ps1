# ==============================================================================
# Local Brain — Full Edition Installer (PowerShell One-Liner)
# Usage: irm https://cambrianminds.github.io/local-brain/install-full.ps1 | iex
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host @"

  ██╗      ██████╗  ██████╗ █████╗ ██╗     ██████╗ ██████╗  █████╗ ██╗███╗   ██╗
  ██║     ██╔═══██╗██╔════╝██╔══██╗██║     ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║
  ██║     ██║   ██║██║     ███████║██║     ██████╔╝██████╔╝███████║██║██╔██╗ ██║
  ██║     ██║   ██║██║     ██╔══██║██║     ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║
  ███████╗╚██████╔╝╚██████╗██║  ██║███████╗██████╔╝██║  ██║██║  ██║██║██║ ╚████║
  ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
          FULL EDITION (~3.6 GB — GEMMA-4 E2B WEIGHTS EMBEDDED)
               Air-Gapped Sovereign Document Intelligence

"@ -ForegroundColor Magenta

# 1. Environment & Architecture Check
Write-Host "[*] Checking system architecture and prerequisites..." -ForegroundColor DarkGray
if ($env:OS -notlike "*Windows*") {
    Write-Error "Local Brain Windows Installer only supports Windows 10/11 64-bit."
    exit 1
}

$InstallDir = "$env:LOCALAPPDATA\Programs\Local Brain Full"
$ExePath    = "$InstallDir\Local Brain Full.exe"

# 2. Check Disk Space (Require at least 8 GB free on system drive)
$SystemDrive = Get-PSDrive ($env:SystemDrive.Replace(":", ""))
$FreeSpaceGB = [math]::Round($SystemDrive.Free / 1GB, 1)
if ($FreeSpaceGB -lt 8) {
    Write-Warning "Low disk space detected: only $FreeSpaceGB GB available. Full edition requires ~6 GB."
} else {
    Write-Host "[*] Disk space verified: $FreeSpaceGB GB available." -ForegroundColor Green
}

# 3. Installation Source Resolution
$LocalCandidate = "D:\tools\local-brain\dist\installer-full\win-unpacked"
$InstalledCandidate = "$env:LOCALAPPDATA\Programs\Local Brain Full"

if ((Test-Path "$LocalCandidate\Local Brain Full.exe")) {
    Write-Host "[*] Local build found at: $LocalCandidate" -ForegroundColor Green
    Write-Host "[*] Synchronizing application files with robocopy..." -ForegroundColor Cyan
    if (!(Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
    robocopy "$LocalCandidate" "$InstallDir" /E /MT:8 /R:1 /W:1 | Out-Null
} elseif (Test-Path "$ExePath") {
    Write-Host "[*] Local Brain Full is already installed at: $InstallDir" -ForegroundColor Green
} else {
    Write-Host "[*] Downloading Local Brain Full release archive..." -ForegroundColor Yellow
    $ZipUrl = "https://github.com/CambrianMinds/local-brain/releases/latest/download/Local-Brain-Full-Win64.zip"
    $TempZip = "$env:TEMP\Local-Brain-Full-Win64.zip"
    Write-Host "    Source: $ZipUrl" -ForegroundColor DarkGray
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $ZipUrl -OutFile $TempZip -UseBasicParsing
        Write-Host "[*] Extracting package to $InstallDir..." -ForegroundColor Cyan
        Expand-Archive -Path $TempZip -DestinationPath $InstallDir -Force
        Remove-Item -Path $TempZip -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Warning "Could not fetch remote archive directly ($($_.Exception.Message))."
        Write-Host "[!] Build locally from source:" -ForegroundColor Yellow
        Write-Host "    git clone https://github.com/CambrianMinds/local-brain.git" -ForegroundColor Cyan
        Write-Host "    npm install; npm run build:dist:full" -ForegroundColor Cyan
        exit 1
    }
}

# 4. Create Desktop and Start Menu Shortcuts
Write-Host "[*] Registering Windows shortcuts..." -ForegroundColor DarkGray
$wsh = New-Object -ComObject WScript.Shell

# Desktop Shortcut
$desktopLnk = "$env:USERPROFILE\Desktop\Local Brain Full.lnk"
$sc1 = $wsh.CreateShortcut($desktopLnk)
$sc1.TargetPath = $ExePath
$sc1.WorkingDirectory = $InstallDir
$sc1.Description = "Local Brain Full — Sovereign On-Device Document Intelligence"
$sc1.Save()

# Start Menu Shortcut
$startMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$startMenuLnk = "$startMenuDir\Local Brain Full.lnk"
$sc2 = $wsh.CreateShortcut($startMenuLnk)
$sc2.TargetPath = $ExePath
$sc2.WorkingDirectory = $InstallDir
$sc2.Description = "Local Brain Full — Sovereign On-Device Document Intelligence"
$sc2.Save()

Write-Host @"

  ✔ Local Brain Full successfully installed!
  -------------------------------------------------------------
  • Install Location: $InstallDir
  • Embedded Model:   Gemma-4 E2B (Q4_K_M) + Multimodal Projector
  • Desktop Shortcut: $desktopLnk
  • Start Menu:       $startMenuLnk

  Zero cloud egress. 100% private. Ready for immediate use.
"@ -ForegroundColor Green

# 5. Launch Prompt
$response = Read-Host "Launch Local Brain Full now? (Y/n)"
if ($response -eq "" -or $response -match "^[yY]") {
    Start-Process -FilePath $ExePath -WorkingDirectory $InstallDir
}
