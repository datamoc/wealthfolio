#!/usr/bin/env node

/**
 * Cross-platform addon packaging script
 *
 * Usage: node scripts/package-addon.mjs [addon-dir]
 *
 * This script packages an addon by creating a zip file with the necessary files.
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get addon directory from command line or use current directory
const addonDir = process.argv[2] || process.cwd();
const addonPath = path.resolve(addonDir);

// Read package.json to get name and version
const packageJsonPath = path.join(addonPath, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found in', addonPath);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const { name, version } = packageJson;
const zipName = `${name}-${version}.zip`;
const distDir = path.join(addonPath, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const zipPath = path.join(distDir, zipName);

console.log(`Packaging ${name}@${version}...`);

// Create write stream for output
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for close event
output.on('close', () => {
  const sizeKB = (archive.pointer() / 1024).toFixed(2);
  console.log(`✓ Created ${zipName} (${sizeKB} KB)`);
  console.log(`  Location: ${zipPath}`);
});

// Handle errors
archive.on('error', (err) => {
  console.error('Error creating zip file:', err.message);
  process.exit(1);
});

// Pipe archive data to the file
archive.pipe(output);

// Add manifest.json
if (fs.existsSync(path.join(addonPath, 'manifest.json'))) {
  archive.file(path.join(addonPath, 'manifest.json'), { name: 'manifest.json' });
  console.log('  + manifest.json');
}

// Add dist/ directory (but not the zip files inside it)
const distContents = path.join(addonPath, 'dist');
if (fs.existsSync(distContents)) {
  const files = fs.readdirSync(distContents);
  files.forEach(file => {
    if (!file.endsWith('.zip')) {
      const filePath = path.join(distContents, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        archive.directory(filePath, `dist/${file}`);
        console.log(`  + dist/${file}/`);
      } else {
        archive.file(filePath, { name: `dist/${file}` });
        console.log(`  + dist/${file}`);
      }
    }
  });
}

// Add assets/ directory if it exists
if (fs.existsSync(path.join(addonPath, 'assets'))) {
  archive.directory(path.join(addonPath, 'assets'), 'assets');
  console.log('  + assets/');
}

// Add README.md
if (fs.existsSync(path.join(addonPath, 'README.md'))) {
  archive.file(path.join(addonPath, 'README.md'), { name: 'README.md' });
  console.log('  + README.md');
}

// Finalize the archive
archive.finalize();
