#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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
  'zh-CN': 'Chinese Simplified / 简体中文',
  'zh-TW': 'Chinese Traditional / 繁體中文',
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

let rl;

function createReadlineInterface() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function closeReadlineInterface() {
  if (rl) {
    rl.close();
  }
}

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    interactive: false,
    translate: false,
    langCode: null,
    apiUrl: 'https://libretranslate.com',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--interactive' || arg === '-i') {
      flags.interactive = true;
    } else if (arg === '--translate' || arg === '-t') {
      flags.translate = true;
    } else if (arg === '--api-url') {
      flags.apiUrl = args[++i];
    } else if (!arg.startsWith('-')) {
      flags.langCode = arg.toLowerCase();
    }
  }

  return flags;
}

function showUsage() {
  console.log('\nUsage: pnpm run i18n:add-language <language-code> [options]\n');
  console.log('Options:');
  console.log('  -i, --interactive    Interactive mode with translation review');
  console.log('  -t, --translate      Auto-suggest translations using LibreTranslate');
  console.log('  --api-url <url>      Custom LibreTranslate API URL');
  console.log('');
  console.log('Common language codes:');
  Object.entries(languageNames).forEach(([code, name]) => {
    console.log(`  ${code.padEnd(6)} - ${name}`);
  });
  console.log('\nExamples:');
  console.log('  pnpm run i18n:add-language es              # Quick scaffold');
  console.log('  pnpm run i18n:add-language es -i           # Interactive mode');
  console.log('  pnpm run i18n:add-language es -i -t        # With translations');
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

async function translateText(text, targetLang, apiUrl) {
  try {
    const response = await fetch(`${apiUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.translatedText;
  } catch (err) {
    return null;
  }
}

async function translateJsonInteractive(
  sourceData,
  targetLang,
  existingData,
  fileName,
  useTranslate,
  apiUrl
) {
  const result = existingData ? { ...existingData } : {};
  const keys = Object.keys(sourceData);
  let translatedCount = 0;
  let skippedCount = 0;
  let keptCount = 0;

  log(`\n${'━'.repeat(60)}`, 'cyan');
  log(`📄 ${fileName}`, 'bright');
  log(`${'━'.repeat(60)}`, 'cyan');

  for (const key of keys) {
    const englishText = sourceData[key];
    const existingTranslation = result[key];

    // Skip if it's the same as English (not translated yet)
    if (existingTranslation && existingTranslation !== englishText) {
      log(`\n🔑 ${key}`, 'cyan');
      log(`   EN: ${colors.dim}${englishText}${colors.reset}`);
      log(`   Current: ${colors.green}${existingTranslation}${colors.reset}`);

      const answer = await question(
        `   ${colors.yellow}Keep this? (y/n/skip): ${colors.reset}`
      );

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === '') {
        keptCount++;
        continue;
      } else if (answer.toLowerCase() === 'skip') {
        skippedCount++;
        continue;
      }
    }

    // Need new translation
    log(`\n🔑 ${key}`, 'cyan');
    log(`   EN: ${colors.dim}${englishText}${colors.reset}`);

    let suggestion = null;
    if (useTranslate && !englishText.includes('{')) {
      // Don't auto-translate strings with variables
      process.stdout.write(`   Fetching suggestion... `);
      suggestion = await translateText(englishText, targetLang, apiUrl);
      if (suggestion) {
        process.stdout.write(`${colors.green}✓${colors.reset}\n`);
        log(`   Suggested: ${colors.magenta}${suggestion}${colors.reset}`);
      } else {
        process.stdout.write(`${colors.red}✗${colors.reset}\n`);
      }
    }

    const prompt = suggestion
      ? `   ${colors.yellow}Translation (Enter=accept, or type your own): ${colors.reset}`
      : `   ${colors.yellow}Translation: ${colors.reset}`;

    const answer = await question(prompt);

    if (answer.trim()) {
      result[key] = answer.trim();
      translatedCount++;
    } else if (suggestion) {
      result[key] = suggestion;
      translatedCount++;
    } else {
      result[key] = englishText; // Keep English as placeholder
      log(`   ${colors.dim}(keeping English as placeholder)${colors.reset}`);
    }
  }

  log(`\n${colors.green}✓${colors.reset} Done: ${translatedCount} translated, ${keptCount} kept, ${skippedCount} skipped`, 'green');
  return result;
}

async function processFileInteractive(
  sourceFile,
  targetFile,
  fileName,
  targetLang,
  useTranslate,
  apiUrl
) {
  const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  let existingData = null;

  if (fs.existsSync(targetFile)) {
    existingData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
  }

  const result = await translateJsonInteractive(
    sourceData,
    targetLang,
    existingData,
    fileName,
    useTranslate,
    apiUrl
  );

  fs.writeFileSync(targetFile, JSON.stringify(result, null, 2) + '\n');
}

async function interactiveMode(localesDir, langCode, useTranslate, apiUrl) {
  const sourceDir = path.join(localesDir, 'en');
  const targetDir = path.join(localesDir, langCode);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    success(`Created directory: ${targetDir}`);
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  log('\n📝 Starting interactive translation...\n', 'bright');
  if (useTranslate) {
    info(`Using LibreTranslate API: ${apiUrl}`);
    info('Note: Translations are suggestions only - please review carefully!\n');
  }

  for (const file of files) {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);

    await processFileInteractive(
      sourceFile,
      targetFile,
      file,
      langCode,
      useTranslate,
      apiUrl
    );
  }

  log(`\n${'━'.repeat(60)}`, 'bright');
  success('\n✨ All files processed!\n');
  info('Next steps:');
  info('  1. Review the translations');
  info('  2. Update src/lib/i18n.ts (run without -i for instructions)');
  info('  3. Test: pnpm tauri dev');
  info('  4. Validate: pnpm run lint:i18n\n');
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

    const content = fs.readFileSync(sourcePath, 'utf8');
    const translations = JSON.parse(content);

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
      const varName = `${ns}${langCode.charAt(0).toUpperCase() + langCode.slice(1).replace('-', '')}`;
      return `import ${varName} from "@/locales/${langCode}/${ns}.json";`;
    })
    .join('\n');

  const resourceEntries = namespaces
    .map((ns) => {
      const varName = `${ns}${langCode.charAt(0).toUpperCase() + langCode.slice(1).replace('-', '')}`;
      return `    ${ns}: ${varName},`;
    })
    .join('\n');

  return `
// 1. Add these imports near the top of src/lib/i18n.ts:
${imports}

// 2. Add this entry to the resources object in src/lib/i18n.ts:
  "${langCode}": {
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

### Option 1: Interactive Mode (Recommended)
\`\`\`bash
pnpm run i18n:add-language ${langCode} --interactive --translate
\`\`\`
This will guide you through each translation with auto-suggestions.

### Option 2: Manual Translation
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
- Use interactive mode: \`pnpm run i18n:add-language ${langCode} -i -t\`
- Test frequently to ensure quality

Thank you for contributing to Wealthfolio! 🌍
`;
}

async function main() {
  const flags = parseArgs();

  if (!flags.langCode) {
    log('\n🌍 Wealthfolio Language Addition Tool\n', 'bright');
    error('Please provide a language code (e.g., es, de, pt)');
    showUsage();
    process.exit(1);
  }

  log('\n🌍 Wealthfolio Language Addition Tool\n', 'bright');

  const langCode = flags.langCode;
  validateLanguageCode(langCode);

  const langName = languageNames[langCode] || langCode.toUpperCase();
  info(`Adding language: ${langName} (${langCode})\n`);

  const projectRoot = path.resolve(__dirname, '..');
  const localesDir = path.join(projectRoot, 'src', 'locales');
  const sourceDir = path.join(localesDir, 'en');

  if (!fs.existsSync(sourceDir)) {
    error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  checkIfLanguageExists(localesDir, langCode);

  if (flags.interactive) {
    createReadlineInterface();
    try {
      await interactiveMode(localesDir, langCode, flags.translate, flags.apiUrl);
    } finally {
      closeReadlineInterface();
    }
  } else {
    const targetDir = createLanguageDirectory(localesDir, langCode);

    info('\nCopying translation files from English templates...');
    const fileCount = copyTranslationFiles(sourceDir, targetDir);
    success(`\nCreated ${fileCount} translation files\n`);

    const readmePath = path.join(targetDir, 'README.md');
    fs.writeFileSync(readmePath, generateReadmeInstructions(langCode, langName));
    success(`Created translation guide: README.md\n`);

    log('━'.repeat(60), 'bright');
    log('\n📋 Next Steps:\n', 'bright');

    warning('1. Update src/lib/i18n.ts with the following code:');
    console.log(generateI18nCodeSnippet(langCode));

    warning('\n2. Translate the files in src/locales/' + langCode + '/');
    info('   - Use interactive mode: pnpm run i18n:add-language ' + langCode + ' -i -t');
    info('   - Or manually edit each .json file');
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
    info('Tip: Use --interactive flag for guided translation with auto-suggestions\n');
    info('For detailed guidance, see: docs/ADDING_LANGUAGES.md\n');
  }
}

main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
