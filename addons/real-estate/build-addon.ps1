#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build and package the Real Estate addon for Wealthfolio

.DESCRIPTION
    This script builds the Real Estate addon, compiles TypeScript to JavaScript,
    and packages everything into a distributable ZIP file.

.EXAMPLE
    .\build-addon.ps1
    Builds the addon and creates a ZIP file in the dist directory

.NOTES
    Requires: Node.js, pnpm
#>

param(
    [switch]$Clean = $false,
    [switch]$SkipInstall = $false,
    [switch]$SkipDeps = $false
)

# Enable strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Get script directory (addon root)
$ADDON_DIR = $PSScriptRoot
$ADDON_NAME = "real-estate-addon"
$VERSION = (Get-Content "$ADDON_DIR/package.json" | ConvertFrom-Json).version
$OUTPUT_ZIP = "$ADDON_NAME-$VERSION.zip"

Write-Info "=========================================="
Write-Info "Building Real Estate Addon v$VERSION"
Write-Info "=========================================="
Write-Host ""

# Navigate to addon directory
Push-Location $ADDON_DIR

try {
    # Clean dist directory if requested
    if ($Clean -and (Test-Path "dist")) {
        Write-Info "Cleaning dist directory..."
        Remove-Item -Path "dist" -Recurse -Force
        Write-Success "✓ Cleaned"
        Write-Host ""
    }

    # Build workspace dependencies first
    if (-not $SkipDeps) {
        Write-Info "Building workspace dependencies..."
        Push-Location ../..
        pnpm run build:types
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to build workspace dependencies"
        }
        Pop-Location
        Write-Success "✓ Dependencies built"
        Write-Host ""
    }

    # Install dependencies
    if (-not $SkipInstall) {
        Write-Info "Installing dependencies..."
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install dependencies"
        }
        Write-Success "✓ Dependencies installed"
        Write-Host ""
    }

    # Build the addon
    Write-Info "Building addon..."
    pnpm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build addon"
    }
    Write-Success "✓ Build completed"
    Write-Host ""

    # Verify dist directory exists
    if (-not (Test-Path "dist/addon.js")) {
        throw "Build failed: dist/addon.js not found"
    }

    # Create temporary directory for packaging
    $TEMP_DIR = New-Item -ItemType Directory -Path "dist/temp-package" -Force

    Write-Info "Packaging addon..."

    # Copy required files to temp directory
    Copy-Item "manifest.json" -Destination $TEMP_DIR
    Copy-Item "README.md" -Destination $TEMP_DIR
    Copy-Item "dist/addon.js" -Destination $TEMP_DIR
    Copy-Item "dist/addon.css" -Destination $TEMP_DIR -ErrorAction SilentlyContinue

    # Create ZIP file
    $ZIP_PATH = Join-Path $ADDON_DIR "dist" $OUTPUT_ZIP

    # Remove existing ZIP if it exists
    if (Test-Path $ZIP_PATH) {
        Remove-Item $ZIP_PATH -Force
    }

    # Create ZIP using PowerShell (works on Windows, Linux, macOS)
    Compress-Archive -Path "$TEMP_DIR/*" -DestinationPath $ZIP_PATH -CompressionLevel Optimal

    # Clean up temp directory
    Remove-Item $TEMP_DIR -Recurse -Force

    Write-Success "✓ Packaged successfully"
    Write-Host ""

    # Display results
    Write-Info "=========================================="
    Write-Success "Build Complete!"
    Write-Info "=========================================="
    Write-Host ""
    Write-Host "Package: " -NoNewline
    Write-Success $OUTPUT_ZIP
    Write-Host "Location: " -NoNewline
    Write-Success "dist/$OUTPUT_ZIP"
    Write-Host "Size: " -NoNewline
    Write-Success "$([math]::Round((Get-Item $ZIP_PATH).Length / 1KB, 2)) KB"
    Write-Host ""
    Write-Info "To install this addon:"
    Write-Host "  1. Open Wealthfolio"
    Write-Host "  2. Go to Settings > Addons"
    Write-Host "  3. Click 'Install Addon'"
    Write-Host "  4. Select the ZIP file"
    Write-Host ""

} catch {
    Write-Error "Build failed: $_"
    exit 1
} finally {
    # Return to original directory
    Pop-Location
}
