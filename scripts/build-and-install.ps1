<#
.SYNOPSIS
    Build and install the Security Copilot Plugin Helper VS Code extension.

.DESCRIPTION
    This script compiles the TypeScript source, packages the extension as a .vsix,
    and optionally installs it into VS Code. Use it to distribute the extension to
    other developers for testing without publishing to the Marketplace.

.PARAMETER SkipInstall
    Build and package only — do not install into VS Code.

.PARAMETER Uninstall
    Remove the extension from VS Code.

.PARAMETER Clean
    Remove build artifacts (out/, *.vsix) before building.

.EXAMPLE
    .\build-and-install.ps1              # Build, package, and install
    .\build-and-install.ps1 -SkipInstall # Build and package only
    .\build-and-install.ps1 -Uninstall   # Remove the extension
    .\build-and-install.ps1 -Clean       # Clean build + package + install
#>

[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$Uninstall,
    [switch]$Clean
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Configuration ────────────────────────────────────────────────────────────
$ExtensionId   = 'security-copilot-community.security-copilot-helper'
$ProjectRoot   = Split-Path -Parent $PSScriptRoot   # one level up from scripts/
$PackageJson   = Join-Path $ProjectRoot 'package.json'

# ── Helpers ──────────────────────────────────────────────────────────────────
function Write-Step  { param([string]$Message) Write-Host "`n>> $Message" -ForegroundColor Cyan }
function Write-Ok    { param([string]$Message) Write-Host "   [OK] $Message" -ForegroundColor Green }
function Write-Warn  { param([string]$Message) Write-Host "   [!]  $Message" -ForegroundColor Yellow }
function Write-Fail  { param([string]$Message) Write-Host "   [X]  $Message" -ForegroundColor Red }

function Assert-Command {
    param([string]$Name, [string]$Hint)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Fail "'$Name' is not installed or not on PATH."
        if ($Hint) { Write-Host "        $Hint" -ForegroundColor DarkGray }
        exit 1
    }
    Write-Ok "$Name found"
}

# ── Uninstall mode ───────────────────────────────────────────────────────────
if ($Uninstall) {
    Write-Step 'Uninstalling extension from VS Code'
    $installed = & code --list-extensions 2>$null | Where-Object { $_ -eq $ExtensionId }
    if ($installed) {
        & code --uninstall-extension $ExtensionId
        Write-Ok "Extension '$ExtensionId' removed."
    } else {
        Write-Warn "Extension '$ExtensionId' is not currently installed."
    }
    exit 0
}

# ── Pre-flight checks ───────────────────────────────────────────────────────
Write-Step 'Checking prerequisites'
Assert-Command 'node'  'Install Node.js from https://nodejs.org'
Assert-Command 'npm'   'npm ships with Node.js — reinstall Node if missing'
Assert-Command 'code'  'Install VS Code and ensure "code" is on PATH (Shell Command: Install ''code'' command in PATH)'

$nodeVersion = (node -v) -replace '^v',''
Write-Ok "Node.js $nodeVersion"

# ── Navigate to project root ────────────────────────────────────────────────
Push-Location $ProjectRoot
try {

    # ── Read version from package.json ───────────────────────────────────────
    $pkg     = Get-Content $PackageJson -Raw | ConvertFrom-Json
    $version = $pkg.version
    $name    = $pkg.name
    $vsix    = "$name-$version.vsix"
    Write-Ok "Project: $name v$version"

    # ── Clean (optional) ────────────────────────────────────────────────────
    if ($Clean) {
        Write-Step 'Cleaning previous build artifacts'
        if (Test-Path 'out')   { Remove-Item 'out'   -Recurse -Force; Write-Ok 'Removed out/' }
        Get-ChildItem '*.vsix' | ForEach-Object { Remove-Item $_.FullName -Force; Write-Ok "Removed $($_.Name)" }
    }

    # ── Install dependencies ────────────────────────────────────────────────
    Write-Step 'Installing npm dependencies'
    npm install --silent 2>&1 | Out-Null
    Write-Ok 'npm install complete'

    # ── Compile TypeScript ──────────────────────────────────────────────────
    Write-Step 'Compiling TypeScript'
    npx tsc -p ./
    if ($LASTEXITCODE -ne 0) {
        Write-Fail 'TypeScript compilation failed. Fix errors above and re-run.'
        exit 1
    }
    Write-Ok 'Compilation succeeded (0 errors)'

    # ── Package as .vsix ────────────────────────────────────────────────────
    Write-Step "Packaging extension as $vsix"
    npx @vscode/vsce package --no-dependencies 2>&1 | Out-String | Write-Host
    if (-not (Test-Path $vsix)) {
        Write-Fail "Expected $vsix was not created."
        exit 1
    }
    $size = [math]::Round((Get-Item $vsix).Length / 1KB)
    Write-Ok "$vsix created (${size} KB)"

    # ── Install into VS Code ────────────────────────────────────────────────
    if (-not $SkipInstall) {
        Write-Step 'Installing extension into VS Code'
        & code --install-extension $vsix --force
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Extension installed. Reload VS Code to activate."
        } else {
            Write-Fail 'code --install-extension returned a non-zero exit code.'
            exit 1
        }
    } else {
        Write-Step 'Skipping install (use -SkipInstall was specified)'
    }

    # ── Done ────────────────────────────────────────────────────────────────
    Write-Host ''
    Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Cyan
    Write-Host "  Build complete: $vsix" -ForegroundColor White
    Write-Host ''
    Write-Host '  Share this file with other developers:' -ForegroundColor Gray
    Write-Host "    $(Join-Path $ProjectRoot $vsix)" -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  They can install it with:' -ForegroundColor Gray
    Write-Host "    code --install-extension $vsix" -ForegroundColor Yellow
    Write-Host '════════════════════════════════════════════════════════════' -ForegroundColor Cyan
    Write-Host ''

} finally {
    Pop-Location
}
