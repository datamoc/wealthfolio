#!/usr/bin/env node

/**
 * GitHub Release Creation Script for Wealthfolio
 *
 * This script creates a complete release zip and provides instructions
 * for creating a GitHub release.
 *
 * Prerequisites:
 *   - Addons must be built (run package-release.mjs first)
 *   - Tauri app must be built (run pnpm tauri build)
 *
 * Usage:
 *   node scripts/create-github-release.mjs [version] [--prerelease]
 *
 * Example:
 *   node scripts/create-github-release.mjs 2.0.0-alpha.1 --prerelease
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      cwd: rootDir,
      encoding: 'utf-8',
      ...options,
    });
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    throw error;
  }
}

function getVersion() {
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  if (args.length > 0) {
    return args[0];
  }

  // Read version from tauri.conf.json
  const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
  return tauriConf.version;
}

function isPrerelease() {
  return process.argv.includes('--prerelease');
}

function detectPlatform() {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  return 'linux';
}

function findTauriArtifacts() {
  const bundleDir = path.join(rootDir, 'src-tauri', 'target', 'release', 'bundle');

  if (!fs.existsSync(bundleDir)) {
    return [];
  }

  const artifacts = [];
  const platform = detectPlatform();

  const searchDirs = {
    windows: ['msi', 'nsis'],
    macos: ['dmg', 'macos'],
    linux: ['deb', 'appimage', 'rpm'],
  };

  const dirs = searchDirs[platform] || [];

  for (const dir of dirs) {
    const fullPath = path.join(bundleDir, dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      files.forEach(file => {
        const filePath = path.join(fullPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          artifacts.push({
            name: file,
            path: filePath,
            size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          });
        }
      });
    }
  }

  return artifacts;
}

function createReleaseNotes(version, isPrerelease) {
  const preReleaseNote = isPrerelease
    ? `
⚠️ **This is a pre-release version** - It may contain bugs and is intended for testing purposes.
`
    : '';

  return `# Wealthfolio ${version}

${preReleaseNote}

## 📦 Installation

### Desktop Application
Download the appropriate installer for your platform:
- **Windows**: Download the \`.msi\` or \`.exe\` file
- **macOS**: Download the \`.dmg\` file
- **Linux**: Download the \`.deb\`, \`.AppImage\`, or \`.rpm\` file

### Addons
The release includes the following addons in the \`addons/\` directory:
- **Goal Progress Tracker** - Track investment progress towards target amounts
- **Investment Fees Tracker** - Monitor and analyze investment fees
- **Real Estate** - Manage real estate investments
- **Swingfolio** - Trading swing analysis tool

## 🔧 Installing Addons

1. Launch Wealthfolio
2. Go to Settings > Addons
3. Click "Install Addon"
4. Select the addon zip file from the \`addons/\` directory
5. Review and accept permissions
6. The addon will be installed and ready to use

## 📝 What's New

<!-- Add your changelog items here -->

## 🐛 Known Issues

<!-- List any known issues here -->

## 📚 Documentation

- [User Guide](https://github.com/afadil/wealthfolio/wiki)
- [Addon Development](https://github.com/afadil/wealthfolio/tree/main/docs/addons)

## 🤝 Support

If you encounter any issues, please [open an issue](https://github.com/afadil/wealthfolio/issues) on GitHub.
`;
}

async function main() {
  const version = getVersion();
  const prerelease = isPrerelease();
  const releaseDir = path.join(rootDir, 'release-package');
  const addonsDir = path.join(releaseDir, 'addons');

  log('\n════════════════════════════════════════════════════', colors.bright);
  log('  Wealthfolio GitHub Release Creator', colors.bright);
  log(`  Version: ${version}`, colors.bright);
  log(`  Type: ${prerelease ? 'Pre-release' : 'Release'}`, colors.bright);
  log('════════════════════════════════════════════════════\n', colors.bright);

  // Check if release-package exists
  if (!fs.existsSync(releaseDir)) {
    log('Error: release-package directory not found!', colors.red);
    log('Please run: node scripts/package-release.mjs first', colors.yellow);
    process.exit(1);
  }

  // Check if addons exist
  if (!fs.existsSync(addonsDir) || fs.readdirSync(addonsDir).length === 0) {
    log('Warning: No addons found in release-package/addons/', colors.yellow);
  }

  // Find Tauri artifacts
  log('[1/4] Checking for Tauri build artifacts...', colors.yellow);
  const artifacts = findTauriArtifacts();

  if (artifacts.length === 0) {
    log('  ⚠ No Tauri build artifacts found!', colors.red);
    log('  Please run: pnpm tauri build', colors.yellow);
    log('  Then copy the installer to release-package/', colors.yellow);
  } else {
    log(`  ✓ Found ${artifacts.length} artifact(s):`, colors.green);
    artifacts.forEach(artifact => {
      log(`    - ${artifact.name} (${artifact.size})`, colors.cyan);
    });
  }

  // Create README for release package
  log('\n[2/4] Creating release README...', colors.yellow);
  const readmePath = path.join(releaseDir, 'README.md');
  const readmeContent = `# Wealthfolio ${version} ${prerelease ? '(Pre-release)' : ''}

## Contents

- **Wealthfolio Application**: Main desktop application installer
- **addons/**: Collection of official addons for Wealthfolio

## Installation

1. Install the Wealthfolio application using the installer for your platform
2. Launch Wealthfolio
3. Install addons from the \`addons/\` directory through Settings > Addons

## Addons Included

${fs.existsSync(addonsDir) ? fs.readdirSync(addonsDir).filter(f => f.endsWith('.zip')).map(f => `- ${f}`).join('\n') : 'No addons included'}

## Support

For issues and support, visit: https://github.com/afadil/wealthfolio/issues
`;

  fs.writeFileSync(readmePath, readmeContent);
  log('  ✓ Created README.md', colors.green);

  // Create release notes
  log('\n[3/4] Creating release notes template...', colors.yellow);
  const releaseNotesPath = path.join(releaseDir, 'RELEASE_NOTES.md');
  const releaseNotes = createReleaseNotes(version, prerelease);
  fs.writeFileSync(releaseNotesPath, releaseNotes);
  log('  ✓ Created RELEASE_NOTES.md', colors.green);

  // Create final zip
  log('\n[4/4] Creating release zip archive...', colors.yellow);
  const zipName = `wealthfolio-${version}-${detectPlatform()}.zip`;
  const zipPath = path.join(rootDir, zipName);

  // Remove old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Use archiver for cross-platform zip creation
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2);
      log(`  ✓ Created ${zipName} (${sizeKB} KB)`, colors.green);
      resolve();
    });

    archive.on('error', (err) => {
      log('  ✗ Failed to create zip', colors.red);
      log(`    Error: ${err.message}`, colors.red);
      reject(err);
    });

    archive.pipe(output);

    // Add all files from release-package directory
    archive.directory(releaseDir, false);

    archive.finalize();
  });

  // Summary
  log('\n════════════════════════════════════════════════════', colors.bright);
  log('  Release Package Ready!', colors.green);
  log('════════════════════════════════════════════════════', colors.bright);

  log('\n📦 Release Contents:', colors.cyan);
  log(`  - Version: ${version}`, colors.cyan);
  log(`  - Type: ${prerelease ? 'Pre-release' : 'Release'}`, colors.cyan);
  log(`  - Package: ${zipName}`, colors.cyan);

  if (fs.existsSync(zipPath)) {
    const zipStats = fs.statSync(zipPath);
    log(`  - Size: ${(zipStats.size / 1024 / 1024).toFixed(2)} MB`, colors.cyan);
  }

  log('\n📝 Next Steps:', colors.yellow);
  log('\n  1. Review the release notes:', colors.blue);
  log(`     cat release-package/RELEASE_NOTES.md`, colors.blue);

  log('\n  2. Create a GitHub release:', colors.blue);
  log(`     gh release create v${version} ${zipName} \\`, colors.blue);
  log(`       --title "Wealthfolio v${version}" \\`, colors.blue);
  log(`       --notes-file release-package/RELEASE_NOTES.md \\`, colors.blue);
  log(`       ${prerelease ? '--prerelease' : ''}`, colors.blue);

  log('\n  3. Or manually create the release:', colors.blue);
  log(`     - Go to: https://github.com/afadil/wealthfolio/releases/new`, colors.blue);
  log(`     - Tag: v${version}`, colors.blue);
  log(`     - Upload: ${zipName}`, colors.blue);
  log(`     - Use release notes from RELEASE_NOTES.md`, colors.blue);
  log(`     - ${prerelease ? 'Check "This is a pre-release"' : ''}`, colors.blue);

  log('\n✅ Done!\n', colors.green);
}

main().catch((error) => {
  log('\nError during release creation:', colors.red);
  console.error(error);
  process.exit(1);
});
