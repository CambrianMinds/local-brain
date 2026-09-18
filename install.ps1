# ==============================================================================
# Local Brain — Master Installer (PowerShell One-Liner)
# Usage: irm https://cambrianminds.github.io/local-brain/install.ps1 | iex
# ==============================================================================

param(
    [switch]$Full,
    [switch]$Minimal
)

$ErrorActionPreference = "Stop"

Write-Host @"

  ██╗      ██████╗  ██████╗ █████╗ ██╗     ██████╗ ██████╗  █████╗ ██╗███╗   ██╗
  ██║     ██╔═══██╗██╔════╝██╔══██╗██║     ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║
  ██║     ██║   ██║██║     ███████║██║     ██████╔╝██████╔╝███████║██║██╔██╗ ██║
  ██║     ██║   ██║██║     ██╔══██║██║     ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║
  ███████╗╚██████╔╝╚██████╗██║  ██║███████╗██████╔╝██║  ██║██║  ██║██║██║ ╚████║
  ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
               Sovereign On-Device Document Intelligence & Vector Vault

"@ -ForegroundColor Cyan

# Determine Edition
$SelectedEdition = $null

if ($Full) {
    $SelectedEdition = "full"
} elseif ($Minimal) {
    $SelectedEdition = "minimal"
} elseif ($env:LOCAL_BRAIN_EDITION -eq "full") {
    $SelectedEdition = "full"
} elseif ($env:LOCAL_BRAIN_EDITION -eq "minimal") {
    $SelectedEdition = "minimal"
} else {
    Write-Host "Select installation edition:" -ForegroundColor Yellow
    Write-Host "  [1] Full Edition    (~3.6 GB) - Bundled Gemma-4 E2B weights (Batteries Included)" -ForegroundColor Magenta
    Write-Host "  [2] Minimal Edition (~85 MB)  - Lightweight runtime (Bring Your Own GGUF)" -ForegroundColor Cyan
    Write-Host ""
    $choice = Read-Host "Enter selection [1 or 2, default: 1]"
    if ($choice -eq "2") {
        $SelectedEdition = "minimal"
    } else {
        $SelectedEdition = "full"
    }
}

if ($SelectedEdition -eq "full") {
    Write-Host "[*] Launching Full Edition Installer..." -ForegroundColor Magenta
    $ScriptUrl = "https://cambrianminds.github.io/local-brain/install-full.ps1"
    & ([scriptblock]::Create((Invoke-RestMethod -Uri $ScriptUrl -UseBasicParsing)))
} else {
    Write-Host "[*] Launching Minimal Edition Installer..." -ForegroundColor Cyan
    $ScriptUrl = "https://cambrianminds.github.io/local-brain/install-minimal.ps1"
    & ([scriptblock]::Create((Invoke-RestMethod -Uri $ScriptUrl -UseBasicParsing)))
}
