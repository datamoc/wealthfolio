# Release Process

This document describes how to create and publish releases for Wealthfolio.

## Overview

A Wealthfolio release consists of:
1. **Desktop Application** - Platform-specific installer (`.msi`, `.dmg`, `.deb`, etc.)
2. **Addons** - Collection of official addons in zip format

The release is packaged as a single zip file containing the application installer and an `addons/` subdirectory with all addon zips.

## Prerequisites

- Node.js and pnpm installed
- Rust and Tauri CLI installed
- GitHub CLI (`gh`) installed (optional, for automated release creation)
- All changes committed and pushed to the main branch

## Release Workflow

### Step 1: Update Version Number

Update the version in `src-tauri/tauri.conf.json`:

```json
{
  "version": "2.0.0-alpha.1"
}
```

For pre-releases, use semantic versioning with pre-release identifiers:
- Alpha: `2.0.0-alpha.1`, `2.0.0-alpha.2`, etc.
- Beta: `2.0.0-beta.1`, `2.0.0-beta.2`, etc.
- RC: `2.0.0-rc.1`, `2.0.0-rc.2`, etc.

### Step 2: Build and Package Addons

Run the addon packaging script:

```bash
pnpm run release:package
# or
node scripts/package-release.mjs
```

This script will:
- Clean the `release-package/` directory
- Build all addons in the `addons/` directory
- Package each addon as a zip file
- Place addon zips in `release-package/addons/`

### Step 3: Build Tauri Application

Build the desktop application for your platform:

```bash
pnpm tauri build
```

This will create platform-specific installers in:
- **Windows**: `src-tauri/target/release/bundle/msi/` or `bundle/nsis/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` or `bundle/macos/`
- **Linux**: `src-tauri/target/release/bundle/deb/`, `bundle/appimage/`, or `bundle/rpm/`

**Note**: Copy the appropriate installer to the `release-package/` directory:

```bash
# Example for Linux
cp src-tauri/target/release/bundle/deb/*.deb release-package/

# Example for macOS
cp src-tauri/target/release/bundle/dmg/*.dmg release-package/

# Example for Windows
cp src-tauri/target/release/bundle/msi/*.msi release-package/
```

### Step 4: Create Release Package

Run the release creation script:

```bash
# For pre-release
pnpm run release:create -- --prerelease

# For stable release
pnpm run release:create
```

Or with explicit version:

```bash
node scripts/create-github-release.mjs 2.0.0-alpha.1 --prerelease
```

This script will:
- Verify all components are present
- Create a README.md for the release
- Generate release notes template
- Create a zip archive (e.g., `wealthfolio-2.0.0-alpha.1-linux.zip`)

### Step 5: Create GitHub Release

#### Option A: Using GitHub CLI (Recommended)

```bash
gh release create v2.0.0-alpha.1 wealthfolio-2.0.0-alpha.1-linux.zip \
  --title "Wealthfolio v2.0.0-alpha.1" \
  --notes-file release-package/RELEASE_NOTES.md \
  --prerelease
```

Remove `--prerelease` for stable releases.

#### Option B: Using GitHub Web Interface

1. Go to https://github.com/afadil/wealthfolio/releases/new
2. Set tag: `v2.0.0-alpha.1`
3. Set title: `Wealthfolio v2.0.0-alpha.1`
4. Upload the zip file: `wealthfolio-2.0.0-alpha.1-linux.zip`
5. Copy release notes from `release-package/RELEASE_NOTES.md`
6. For pre-releases: Check "This is a pre-release"
7. Click "Publish release"

### Step 6: Update Release Notes

Edit the release notes to include:
- **What's New**: Key features and improvements
- **Bug Fixes**: Important fixes
- **Known Issues**: Any known problems
- **Breaking Changes**: For major versions

## Multi-Platform Releases

To create releases for multiple platforms:

1. Build on each platform separately (or use CI/CD)
2. Create platform-specific zip files
3. Upload all platform zips to the same GitHub release

Example release assets:
- `wealthfolio-2.0.0-linux.zip`
- `wealthfolio-2.0.0-macos.zip`
- `wealthfolio-2.0.0-windows.zip`

## Automated Releases with CI/CD

For automated releases, consider setting up GitHub Actions:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    strategy:
      matrix:
        platform: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install
      - name: Build addons
        run: pnpm run release:package
      - name: Build Tauri app
        run: pnpm tauri build
      - name: Create release package
        run: pnpm run release:create
      - name: Upload to release
        uses: softprops/action-gh-release@v1
        with:
          files: wealthfolio-*.zip
          prerelease: ${{ contains(github.ref, 'alpha') || contains(github.ref, 'beta') || contains(github.ref, 'rc') }}
```

## Troubleshooting

### Addons Not Building

If addon builds fail:
1. Ensure all dependencies are installed: `pnpm install`
2. Try building addons individually:
   ```bash
   cd addons/goal-progress-tracker
   pnpm run bundle
   ```

### Tauri Build Fails

If Tauri build fails:
1. Check Rust installation: `rustc --version`
2. Update Tauri CLI: `cargo install tauri-cli@^2.0.0`
3. Check platform-specific requirements in Tauri docs

### Zip Creation Fails

If zip creation fails:
1. Ensure `zip` command is available (or `tar` as fallback)
2. Manually create zip:
   ```bash
   cd release-package
   zip -r ../wealthfolio-2.0.0-alpha.1-linux.zip .
   ```

## Version Management

### Semantic Versioning

Wealthfolio follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (2.0.0): Breaking changes
- **MINOR** (2.1.0): New features, backward compatible
- **PATCH** (2.0.1): Bug fixes, backward compatible

### Pre-release Versioning

- **Alpha**: Early testing, may have bugs, API unstable
- **Beta**: Feature complete, API stable, testing for bugs
- **RC**: Release candidate, final testing before stable

## Checklist

Before creating a release:

- [ ] All tests passing (`pnpm test`)
- [ ] Linting clean (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Version updated in `src-tauri/tauri.conf.json`
- [ ] CHANGELOG updated with changes
- [ ] All changes committed and pushed
- [ ] Documentation updated if needed
- [ ] Tested on target platforms

## Support

For questions or issues with the release process, please:
- Check Tauri documentation: https://tauri.app/
- Open an issue: https://github.com/afadil/wealthfolio/issues
- Contact the maintainers

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| Package addons | `pnpm run release:package` | Build and package all addons |
| Create release | `pnpm run release:create` | Create final release zip |
| Create pre-release | `pnpm run release:create -- --prerelease` | Create pre-release zip |
| Build Tauri | `pnpm tauri build` | Build desktop application |
