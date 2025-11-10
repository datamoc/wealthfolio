# Building the Real Estate Addon

This document explains how to build and package the Real Estate addon for distribution.

## Prerequisites

Before building the addon, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **zip** utility (for bash script on Linux/macOS)

## Quick Start

### On Windows (PowerShell)

```powershell
.\build-addon.ps1
```

### On Linux/macOS (Bash)

```bash
./build-addon.sh
```

This will:
1. Install dependencies
2. Build the addon
3. Create a ZIP file in the `dist/` directory

## Build Scripts

Two build scripts are provided for cross-platform compatibility:

### PowerShell Script (`build-addon.ps1`)

Works on Windows, Linux, and macOS with PowerShell Core installed.

**Basic usage:**
```powershell
.\build-addon.ps1
```

**Options:**
- `-Clean` - Remove the dist directory before building
- `-SkipInstall` - Skip dependency installation (faster if dependencies are already installed)

**Examples:**
```powershell
# Clean build
.\build-addon.ps1 -Clean

# Quick rebuild (skip dependency installation)
.\build-addon.ps1 -SkipInstall

# Clean build without installing dependencies
.\build-addon.ps1 -Clean -SkipInstall
```

### Bash Script (`build-addon.sh`)

Works on Linux and macOS (and Windows with WSL or Git Bash).

**Basic usage:**
```bash
./build-addon.sh
```

**Options:**
- `--clean` - Remove the dist directory before building
- `--skip-install` - Skip dependency installation
- `-h, --help` - Show help message

**Examples:**
```bash
# Clean build
./build-addon.sh --clean

# Quick rebuild
./build-addon.sh --skip-install

# Clean build without installing dependencies
./build-addon.sh --clean --skip-install
```

## Output

After a successful build, you'll find:

```
dist/
  ├── real-estate-addon-1.0.0.zip  # Distributable package
  ├── addon.js                      # Compiled JavaScript
  └── addon.css                     # Compiled styles
```

The ZIP file contains:
- `manifest.json` - Addon metadata and configuration
- `README.md` - User documentation
- `addon.js` - Main addon bundle
- `addon.css` - Styles (if present)

## Manual Build

If you prefer to build manually without the scripts:

```bash
# Install dependencies
pnpm install

# Build the addon
pnpm run build

# Create package manually
cd dist
zip -r ../real-estate-addon-1.0.0.zip ../manifest.json ../README.md addon.js addon.css
```

## Troubleshooting

### "pnpm: command not found"

Install pnpm globally:
```bash
npm install -g pnpm
```

### "zip: command not found" (Linux/macOS bash script)

**Ubuntu/Debian:**
```bash
sudo apt-get install zip
```

**macOS:**
```bash
brew install zip
```

**Or use the PowerShell script instead** (works without zip utility).

### Build fails with TypeScript errors

Run type checking to see all errors:
```bash
pnpm run type-check
```

Fix any TypeScript errors before building.

### Permission denied (Linux/macOS)

Make the script executable:
```bash
chmod +x build-addon.sh
```

## Development

For development with hot reload:

```bash
pnpm run dev
```

This watches for file changes and rebuilds automatically (doesn't create ZIP).

## Installation

Once built, install the addon in Wealthfolio:

1. Open Wealthfolio
2. Navigate to **Settings** → **Addons**
3. Click **Install Addon**
4. Select the ZIP file from `dist/real-estate-addon-1.0.0.zip`
5. Follow the permission prompts
6. The addon will appear in your Wealthfolio sidebar

## Version Management

To release a new version:

1. Update the version in `package.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. Update the `CHANGELOG.md` (if present)

3. Build with the scripts - the version number will be included in the ZIP filename

4. Tag the release:
   ```bash
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git push origin v1.1.0
   ```

## Continuous Integration

For CI/CD pipelines, use the scripts with the skip install option:

```yaml
# GitHub Actions example
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build addon
  run: ./build-addon.sh --skip-install
  working-directory: addons/real-estate
```

## Additional Resources

- [Wealthfolio Addon Documentation](../../docs/addons/)
- [Addon SDK Reference](../../packages/addon-sdk/)
- [Real Estate Addon README](./README.md)
