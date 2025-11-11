#!/usr/bin/env bash
#
# Build and package the Real Estate addon for Wealthfolio
#
# This script builds the Real Estate addon, compiles TypeScript to JavaScript,
# and packages everything into a distributable ZIP file.
#
# Usage:
#   ./build-addon.sh [OPTIONS]
#
# Options:
#   --clean         Clean dist directory before building
#   --skip-install  Skip dependency installation
#   --skip-deps     Skip building workspace dependencies
#   -h, --help      Show this help message
#
# Requirements: Node.js, pnpm, zip
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}$*${NC}"; }
print_info() { echo -e "${CYAN}$*${NC}"; }
print_error() { echo -e "${RED}$*${NC}"; }
print_warning() { echo -e "${YELLOW}$*${NC}"; }

# Parse command line arguments
CLEAN=false
SKIP_INSTALL=false
SKIP_DEPS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        -h|--help)
            grep '^#' "$0" | tail -n +2 | sed 's/^# \?//'
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Get script directory (addon root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Get addon name and version from package.json
ADDON_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
OUTPUT_ZIP="${ADDON_NAME}-${VERSION}.zip"

print_info "=========================================="
print_info "Building Real Estate Addon v${VERSION}"
print_info "=========================================="
echo ""

# Check for required commands
command -v node >/dev/null 2>&1 || { print_error "Error: node is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { print_error "Error: pnpm is required but not installed."; exit 1; }
command -v zip >/dev/null 2>&1 || { print_error "Error: zip is required but not installed."; exit 1; }

# Clean dist directory if requested
if [ "$CLEAN" = true ] && [ -d "dist" ]; then
    print_info "Cleaning dist directory..."
    rm -rf dist
    print_success "✓ Cleaned"
    echo ""
fi

# Build workspace dependencies first
if [ "$SKIP_DEPS" = false ]; then
    print_info "Building workspace dependencies..."
    cd ../..
    pnpm run build:types
    cd "$SCRIPT_DIR"
    print_success "✓ Dependencies built"
    echo ""
fi

# Install dependencies
if [ "$SKIP_INSTALL" = false ]; then
    print_info "Installing dependencies..."
    pnpm install
    print_success "✓ Dependencies installed"
    echo ""
fi

# Build the addon
print_info "Building addon..."
pnpm run build
print_success "✓ Build completed"
echo ""

# Verify dist directory exists
if [ ! -f "dist/addon.js" ]; then
    print_error "Build failed: dist/addon.js not found"
    exit 1
fi

# Create temporary directory for packaging
TEMP_DIR="dist/temp-package"
mkdir -p "$TEMP_DIR"

print_info "Packaging addon..."

# Copy required files to temp directory
cp manifest.json "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"
cp dist/addon.js "$TEMP_DIR/"
[ -f "dist/addon.css" ] && cp dist/addon.css "$TEMP_DIR/" || true

# Create ZIP file
ZIP_PATH="dist/$OUTPUT_ZIP"

# Remove existing ZIP if it exists
[ -f "$ZIP_PATH" ] && rm -f "$ZIP_PATH"

# Create ZIP (using -j to junk paths, so files are at root of zip)
cd "$TEMP_DIR"
zip -q -r "../../$ZIP_PATH" ./*
cd "$SCRIPT_DIR"

# Clean up temp directory
rm -rf "$TEMP_DIR"

print_success "✓ Packaged successfully"
echo ""

# Display results
FILE_SIZE=$(du -h "$ZIP_PATH" | cut -f1)

print_info "=========================================="
print_success "Build Complete!"
print_info "=========================================="
echo ""
echo -e "Package:  $(print_success "$OUTPUT_ZIP")"
echo -e "Location: $(print_success "dist/$OUTPUT_ZIP")"
echo -e "Size:     $(print_success "$FILE_SIZE")"
echo ""
print_info "To install this addon:"
echo "  1. Open Wealthfolio"
echo "  2. Go to Settings > Addons"
echo "  3. Click 'Install Addon'"
echo "  4. Select the ZIP file"
echo ""
