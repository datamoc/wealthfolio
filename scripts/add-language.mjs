#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Language name mappings for common language codes
const languageNames = {
  es: 'Spanish / Español',
  de: 'German / Deutsch',
  it: 'Italian / Italiano',
  pt: 'Portuguese / Português',
  nl: 'Dutch / Nederlands',
  pl: 'Polish / Polski',
  ru: 'Russian / Русский',
  ja: 'Japanese / 日本語',
  ko: 'Korean / 한국어',
  zh: 'Chinese / 中文',
  ar: 'Arabic / العربية',
  hi: 'Hindi / हिन्दी',
  tr: 'Turkish / Türkçe',
  sv: 'Swedish / Svenska',
  da: 'Danish / Dansk',
  no: 'Norwegian / Norsk',
  fi: 'Finnish / Suomi',
  cs: 'Czech / Čeština',
  el: 'Greek / Ελληνικά',
  he: 'Hebrew / עברית',
};

function getLanguageCode() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    error('Please provide a language code (e.g., es, de, pt)');
    console.log('\nUsage: pnpm run i18n:add-language <language-code>\n');
    console.log('Common language codes:');
    Object.entries(languageNames).forEach(([code, name]) => {
      console.log(`  ${code.padEnd(4)} - ${name}`);
    });
    process.exit(1);
  }
  return args[0].toLowerCase();
}

function validateLanguageCode(langCode) {
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(langCode)) {
    error(`Invalid language code: ${langCode}`);
    info('Language codes should be 2-3 lowercase letters (e.g., en, es, pt, zh-CN)');
    process.exit(1);
  }
}

function checkIfLanguageExists(localesDir, langCode) {
  const langDir = path.join(localesDir, langCode);
  if (fs.existsSync(langDir)) {
    error(`Language '${langCode}' already exists at ${langDir}`);
    process.exit(1);
  }
}

function createLanguageDirectory(localesDir, langCode) {
  const langDir = path.join(localesDir, langCode);
  fs.mkdirSync(langDir, { recursive: true });
  success(`Created directory: ${langDir}`);
  return langDir;
}

function copyTranslationFiles(sourceDir, targetDir) {
  const files = fs.readdirSync(sourceDir);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));

  if (jsonFiles.length === 0) {
    error('No translation files found in source directory');
    process.exit(1);
  }

  jsonFiles.forEach((file) => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    // Read the source file
    const content = fs.readFileSync(sourcePath, 'utf8');
    const translations = JSON.parse(content);

    // Write to target with a comment indicating it needs translation
    fs.writeFileSync(targetPath, JSON.stringify(translations, null, 2) + '\n');
    success(`Created: ${file}`);
  });

  return jsonFiles.length;
}

function generateI18nCodeSnippet(langCode) {
  const namespaces = [
    'common',
    'settings',
    'dashboard',
    'activity',
    'holdings',
    'performance',
    'account',
    'goals',
    'income',
  ];

  const imports = namespaces
    .map((ns) => {
      const varName = `${ns}${langCode.charAt(0).toUpperCase() + langCode.slice(1)}`;
      return `import ${varName} from "@/locales/${langCode}/${ns}.json";`;
    })
    .join('\n');

  const resourceEntries = namespaces
    .map((ns) => {
      const varName = `${ns}${langCode.charAt(0).toUpperCase() + langCode.slice(1)}`;
      return `    ${ns}: ${varName},`;
    })
    .join('\n');

  return `
// 1. Add these imports near the top of src/lib/i18n.ts:
${imports}

// 2. Add this entry to the resources object in src/lib/i18n.ts:
  ${langCode}: {
${resourceEntries}
  },

// 3. Update the supportedLngs array:
  supportedLngs: ["en", "fr", "${langCode}"],
`;
}

function generateReadmeInstructions(langCode, langName) {
  return `# Translation Guide for ${langName}

This directory contains translation files for ${langName} (${langCode}).

## Files

Each JSON file represents a namespace for organizing translations:

- \`common.json\` - Common UI elements (buttons, labels, navigation)
- \`settings.json\` - Settings page translations
- \`dashboard.json\` - Dashboard-specific translations
- \`activity.json\` - Activity page and import workflow
- \`holdings.json\` - Holdings and insights page
- \`performance.json\` - Performance analysis page
- \`account.json\` - Account management
- \`goals.json\` - Goals and contribution limits
- \`income.json\` - Income tracking (dividends, interest)

## Translation Guidelines

1. **Keep interpolation variables**: Text like \`{count}\`, \`{value}\`, \`{name}\` should remain unchanged
2. **Respect pluralization**: For plural forms, use appropriate plural rules for your language
3. **Maintain formatting**: Keep line breaks and formatting intact
4. **Cultural adaptation**: Adapt phrases to be natural in your language, not just literal translations
5. **Date/number formats**: Consider locale-specific formatting preferences
6. **Consistency**: Use consistent terminology throughout the app

## How to Translate

1. Open each JSON file
2. Translate the values (right side of \`:\`) while keeping the keys (left side) unchanged
3. Test your translations by running the app: \`pnpm tauri dev\`
4. Run translation validation: \`pnpm run lint:i18n\`

## Example

English (\`common.json\`):
\`\`\`json
{
  "welcome": "Welcome to Wealthfolio",
  "accounts_count": "You have {count} account",
  "accounts_count_plural": "You have {count} accounts"
}
\`\`\`

Your translation should look like:
\`\`\`json
{
  "welcome": "[Your translation here]",
  "accounts_count": "[Your singular form with {count}]",
  "accounts_count_plural": "[Your plural form with {count}]"
}
\`\`\`

## Need Help?

- Review existing translations in \`locales/en/\` and \`locales/fr/\` for reference
- Check the main documentation: \`docs/ADDING_LANGUAGES.md\`
- Test frequently to ensure quality

Thank you for contributing to Wealthfolio! 🌍
`;
}

function main() {
  log('\n🌍 Wealthfolio Language Addition Tool\n', 'bright');

  // Get and validate language code
  const langCode = getLanguageCode();
  validateLanguageCode(langCode);

  const langName = languageNames[langCode] || langCode.toUpperCase();
  info(`Adding language: ${langName} (${langCode})\n`);

  // Set up paths
  const projectRoot = path.resolve(__dirname, '..');
  const localesDir = path.join(projectRoot, 'src', 'locales');
  const sourceDir = path.join(localesDir, 'en'); // Use English as template

  // Verify source directory exists
  if (!fs.existsSync(sourceDir)) {
    error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  // Check if language already exists
  checkIfLanguageExists(localesDir, langCode);

  // Create language directory
  const targetDir = createLanguageDirectory(localesDir, langCode);

  // Copy translation files
  info('\nCopying translation files from English templates...');
  const fileCount = copyTranslationFiles(sourceDir, targetDir);
  success(`\nCreated ${fileCount} translation files\n`);

  // Create README for translators
  const readmePath = path.join(targetDir, 'README.md');
  fs.writeFileSync(readmePath, generateReadmeInstructions(langCode, langName));
  success(`Created translation guide: README.md\n`);

  // Print next steps
  log('━'.repeat(60), 'bright');
  log('\n📋 Next Steps:\n', 'bright');

  warning('1. Update src/lib/i18n.ts with the following code:');
  console.log(generateI18nCodeSnippet(langCode));

  warning('\n2. Translate the files in src/locales/' + langCode + '/');
  info('   - Open each .json file');
  info('   - Translate the values while keeping keys unchanged');
  info('   - Preserve interpolation variables like {count}, {value}, etc.');

  warning('\n3. Test your translations:');
  info('   - Run: pnpm tauri dev');
  info('   - Change language in Settings > General > Language');

  warning('\n4. Validate translations:');
  info('   - Run: pnpm run lint:i18n');

  warning('\n5. Add language selector option (if needed):');
  info('   - Update src/pages/settings/general/language-settings.tsx');
  info('   - Add entry to the languages array');

  log('\n━'.repeat(60), 'bright');
  success('\n✨ Language scaffold created successfully!\n');
  info('For detailed guidance, see: docs/ADDING_LANGUAGES.md\n');
}

main();
