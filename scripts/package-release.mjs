#!/usr/bin/env node

/**
 * Release Packaging Script for Wealthfolio
 *
 * This script packages Wealthfolio and its addons for GitHub releases.
 *
 * Usage:
 *   node scripts/package-release.mjs [version]
 *
 * Example:
 *   node scripts/package-release.mjs 2.0.0-alpha.1
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  log(`> ${command}`, colors.blue);
  try {
    execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options,
    });
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    throw error;
  }
}

function getVersion() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    return args[0];
  }

  // Read version from tauri.conf.json
  const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
  return tauriConf.version;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  log(`  Copied: ${path.basename(src)}`, colors.green);
}

async function main() {
  const version = getVersion();
  const releaseDir = path.join(rootDir, 'release-package');
  const addonsDir = path.join(releaseDir, 'addons');

  log('\n════════════════════════════════════════════════════', colors.bright);
  log('  Wealthfolio Release Packaging Script', colors.bright);
  log(`  Version: ${version}`, colors.bright);
  log('════════════════════════════════════════════════════\n', colors.bright);

  // Step 1: Clean previous release package
  log('\n[1/3] Cleaning previous release package...', colors.yellow);
  if (fs.existsSync(releaseDir)) {
    fs.rmSync(releaseDir, { recursive: true });
    log('  Removed old release-package directory', colors.green);
  }
  ensureDir(releaseDir);
  ensureDir(addonsDir);
  log('  Created fresh release-package directory', colors.green);

  // Step 2: Install dependencies first
  log('\n[2/4] Installing dependencies...', colors.yellow);
  try {
    exec('pnpm install', { stdio: 'pipe' });
    log('  ✓ Dependencies installed', colors.green);
  } catch (error) {
    log('  ✗ Failed to install dependencies', colors.red);
    log('  Please run: pnpm install', colors.yellow);
    throw error;
  }

  // Step 3: Build and package addons
  log('\n[3/4] Building and packaging addons...', colors.yellow);
  const addonDirs = ['goal-progress-tracker', 'investment-fees-tracker', 'real-estate', 'swingfolio-addon'];

  for (const addon of addonDirs) {
    const addonPath = path.join(rootDir, 'addons', addon);
    if (!fs.existsSync(addonPath)) {
      log(`  Warning: Addon directory not found: ${addon}`, colors.red);
      continue;
    }

    log(`\n  Building ${addon}...`, colors.blue);

    // Determine filter name based on addon directory structure
    const addonPackageJsonPath = path.join(addonPath, 'package.json');
    let filterName = `${addon}-addon`;

    if (fs.existsSync(addonPackageJsonPath)) {
      const addonPackageJson = JSON.parse(fs.readFileSync(addonPackageJsonPath, 'utf-8'));
      filterName = addonPackageJson.name;
    }

    // Run bundle script (clean + build + package)
    try {
      exec(`pnpm --filter ${filterName} run bundle`, { stdio: 'pipe' });

      // Find the generated zip file
      const addonDistDir = path.join(addonPath, 'dist');
      if (!fs.existsSync(addonDistDir)) {
        log(`  ✗ Dist directory not found for ${addon}`, colors.red);
        continue;
      }

      const zipFiles = fs.readdirSync(addonDistDir).filter(f => f.endsWith('.zip'));

      if (zipFiles.length > 0) {
        const zipFile = zipFiles[0];
        const srcZip = path.join(addonDistDir, zipFile);
        const destZip = path.join(addonsDir, zipFile);
        copyFile(srcZip, destZip);
        log(`  ✓ Packaged: ${zipFile}`, colors.green);
      } else {
        log(`  ✗ No zip file found for ${addon}`, colors.red);
      }
    } catch (error) {
      log(`  ✗ Failed to build ${addon}`, colors.red);
      // Don't show full error stack, just the message
      log(`    ${error.message.split('\n')[0]}`, colors.red);
    }
  }

  // Step 4: Instructions for Tauri build
  log('\n[4/4] Tauri Application Build Instructions', colors.yellow);
  log('\n  To complete the release package, you need to build the Tauri application:', colors.bright);
  log('\n  1. Build the Tauri application:', colors.blue);
  log('     pnpm tauri build', colors.blue);
  log('\n  2. The build artifacts will be in:', colors.blue);
  log('     src-tauri/target/release/bundle/', colors.blue);
  log('\n  3. Copy the appropriate installer/bundle to release-package/', colors.blue);
  log('     - Windows: .msi or .exe from bundle/msi/ or bundle/nsis/', colors.blue);
  log('     - macOS: .dmg or .app from bundle/dmg/ or bundle/macos/', colors.blue);
  log('     - Linux: .deb, .AppImage, or .rpm from bundle/deb/, bundle/appimage/, or bundle/rpm/', colors.blue);

  // Step 4: Summary
  log('\n════════════════════════════════════════════════════', colors.bright);
  log('  Addon Packaging Complete!', colors.green);
  log('════════════════════════════════════════════════════', colors.bright);
  log(`\n  Release directory: ${releaseDir}`, colors.green);
  log(`  Addons directory: ${addonsDir}`, colors.green);

  const addonZips = fs.readdirSync(addonsDir).filter(f => f.endsWith('.zip'));
  log(`\n  Packaged addons (${addonZips.length}):`, colors.green);
  addonZips.forEach(zip => log(`    - ${zip}`, colors.green));

  log('\n  Next steps:', colors.yellow);
  log('    1. Run: pnpm tauri build', colors.blue);
  log('    2. Copy installer to release-package/', colors.blue);
  log('    3. Create zip of release-package/', colors.blue);
  log('    4. Create GitHub release and upload the zip', colors.blue);
  log('\n');
}

main().catch((error) => {
  log('\nError during packaging:', colors.red);
  console.error(error);
  process.exit(1);
});
