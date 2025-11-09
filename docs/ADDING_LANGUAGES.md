# Adding a New Language to Wealthfolio

This guide walks you through the process of adding a new language to Wealthfolio's multilanguage support system.

## Table of Contents

- [Quick Start](#quick-start)
- [Manual Process](#manual-process)
- [Translation Guidelines](#translation-guidelines)
- [Testing Translations](#testing-translations)
- [Pluralization](#pluralization)
- [Common Issues](#common-issues)

## Quick Start

The easiest way to add a new language is using our automated script:

### Option 1: Quick Scaffold (Non-Interactive)

```bash
# Create language structure with English templates
pnpm run i18n:add-language es
```

This will:
1. Create the language directory structure
2. Copy English translation files as templates
3. Create a translation guide (README.md)
4. Show you the code changes needed

### Option 2: Interactive Mode with Auto-Suggestions (Recommended)

```bash
# Interactive mode with automatic translation suggestions
pnpm run i18n:add-language es -i -t

# Or interactive mode without auto-suggestions
pnpm run i18n:add-language es -i
```

**Interactive mode features:**
- Shows English text for each translation key
- Displays existing translations in **bright green** (easy to identify defaults)
- Edit existing translations with `e` command (no need to retype everything)
- Auto-suggests translations using LibreTranslate API (with `-t` flag)
- Press **Enter** to accept green defaults
- Press **Ctrl+C** or **Escape twice** to exit safely (progress auto-saved)
- Progress tracking through all files

**Interactive commands:**
- `y` or `Enter` - Keep current/default translation (shown in green)
- `e` - Edit existing translation
- `n` - Enter completely new translation
- `s` - Skip this key

**Example interactive workflow:**
```
🔑 welcome_message
   EN: Welcome to Wealthfolio
   Current: Bienvenue à Wealthfolio
   [y]keep / [e]dit / [n]ew / [s]kip: e
   Edit (current: Bienvenue à Wealthfolio)
   New value: Bienvenue sur Wealthfolio
   ✓ Updated

🔑 new_feature
   EN: Portfolio Analysis
   Fetching suggestion... ✓
   Default: Analyse du Portefeuille
   Translation [Enter=use default]: [press Enter]
   ✓ Using default
```

### Supported Language Codes

Common ISO 639-1 language codes:
- `es` - Spanish / Español
- `de` - German / Deutsch
- `it` - Italian / Italiano
- `pt` - Portuguese / Português
- `nl` - Dutch / Nederlands
- `pl` - Polish / Polski
- `ru` - Russian / Русский
- `ja` - Japanese / 日本語
- `ko` - Korean / 한국어
- `zh` - Chinese / 中文
- `ar` - Arabic / العربية
- And many more...

## Manual Process

If you prefer to add a language manually, follow these steps:

### Step 1: Create Language Directory

Create a new directory in `src/locales/` with your language code:

```bash
mkdir src/locales/es
```

### Step 2: Copy Translation Files

Copy all JSON files from English as templates:

```bash
cp src/locales/en/*.json src/locales/es/
```

You should have these files:
- `common.json` - Common UI elements
- `settings.json` - Settings page
- `dashboard.json` - Dashboard
- `activity.json` - Activities and import
- `holdings.json` - Holdings and insights
- `performance.json` - Performance page
- `account.json` - Account management
- `goals.json` - Goals and limits
- `income.json` - Income tracking

### Step 3: Update i18n Configuration

Edit `src/lib/i18n.ts` and add imports for your language:

```typescript
// Add imports (example for Spanish 'es')
import commonEs from "@/locales/es/common.json";
import settingsEs from "@/locales/es/settings.json";
import dashboardEs from "@/locales/es/dashboard.json";
import activityEs from "@/locales/es/activity.json";
import holdingsEs from "@/locales/es/holdings.json";
import performanceEs from "@/locales/es/performance.json";
import accountEs from "@/locales/es/account.json";
import goalsEs from "@/locales/es/goals.json";
import incomeEs from "@/locales/es/income.json";
```

Add your language to the resources object:

```typescript
export const resources = {
  en: { /* ... */ },
  fr: { /* ... */ },
  es: {
    common: commonEs,
    settings: settingsEs,
    dashboard: dashboardEs,
    activity: activityEs,
    holdings: holdingsEs,
    performance: performanceEs,
    account: accountEs,
    goals: goalsEs,
    income: incomeEs,
  },
} as const;
```

Update the supported languages:

```typescript
i18n.init({
  // ...
  supportedLngs: ["en", "fr", "es"], // Add your language code
  // ...
});
```

### Step 4: Add Language Selector Option

Edit `src/pages/settings/general/language-settings.tsx` to add your language to the dropdown:

```typescript
const languages = [
  { value: "en", label: "English", nativeName: "English" },
  { value: "fr", label: "French", nativeName: "Français" },
  { value: "es", label: "Spanish", nativeName: "Español" }, // Add this
];
```

### Step 5: Translate

Now translate all the JSON files in your language directory. Remember to:
- Only translate the **values** (right side)
- Keep the **keys** (left side) unchanged
- Preserve **interpolation variables** like `{count}`, `{value}`, `{name}`
- Maintain proper **pluralization** forms

## Translation Guidelines

### Key Principles

1. **Natural Language**: Translate for meaning, not word-for-word
2. **Consistency**: Use the same terms throughout for the same concepts
3. **Context**: Consider where the text appears in the UI
4. **Brevity**: Keep translations concise to fit UI constraints
5. **Cultural Adaptation**: Adapt idioms and expressions appropriately

### Interpolation Variables

Variables in curly braces must be preserved exactly:

```json
{
  "welcome_message": "Welcome, {username}!",
  "total_value": "Total: {value}",
  "updated_at": "Updated {timeAgo}"
}
```

### Pluralization

Use proper plural rules for your language. i18next uses these suffixes:

- `_zero` - Zero form (some languages)
- `_one` - Singular form
- `_two` - Dual form (some languages)
- `_few` - Few form (some languages)
- `_many` - Many form (some languages)
- `_other` - Default plural form

Example for English:
```json
{
  "accounts_count_one": "You have {count} account",
  "accounts_count_other": "You have {count} accounts"
}
```

Example for French:
```json
{
  "accounts_count_one": "Vous avez {count} compte",
  "accounts_count_other": "Vous avez {count} comptes"
}
```

Example for Russian (with _few and _many):
```json
{
  "accounts_count_one": "У вас {count} счёт",
  "accounts_count_few": "У вас {count} счёта",
  "accounts_count_many": "У вас {count} счётов"
}
```

Refer to [i18next pluralization docs](https://www.i18next.com/translation-function/plurals) for language-specific plural rules.

### Special Characters

Some languages require special typography:

**French**: Use narrow non-breaking spaces before certain punctuation:
- `!` → ` !` (narrow nbsp before exclamation)
- `?` → ` ?` (narrow nbsp before question mark)
- `:` → ` :` (narrow nbsp before colon)
- `;` → ` ;` (narrow nbsp before semicolon)

**Quotes**:
- English: "text"
- French: « text »
- German: „text"

## Testing Translations

### 1. Visual Testing

```bash
# Run the development build
pnpm tauri dev

# Change language in: Settings > General > Language
# Navigate through all pages to verify translations
```

### 2. Validation Testing

```bash
# Extract and validate all translation keys
pnpm run i18n:extract

# Lint translations (ensures keys match code)
pnpm run lint:i18n
```

### 3. Check Coverage

Verify all pages and features:
- [ ] Dashboard
- [ ] Holdings page
- [ ] Activity page & import workflow
- [ ] Performance page
- [ ] Income page
- [ ] Account details
- [ ] Settings (all tabs)
- [ ] Goals & contribution limits
- [ ] Error messages
- [ ] Form validations
- [ ] Tooltips and help text

## Updating Existing Translations

If you need to update or improve existing translations:

### Using Interactive Mode

```bash
# Review and update existing translations
pnpm run i18n:add-language es -i -t
```

The script will:
1. Load existing translations from `src/locales/es/`
2. Show you each current translation
3. Ask if you want to keep, change, or skip it
4. Provide auto-suggestions for untranslated keys

**Interactive prompts:**
- `y` or `Enter` - Keep the current translation
- `n` - Enter a new translation
- `skip` - Skip this key (keeps current value)

### Batch Update from English

If English translations have been updated and you want to sync:

```bash
# Extract new keys (keeps existing translations)
pnpm run i18n:extract

# Then update manually or use interactive mode
pnpm run i18n:add-language es -i
```

## Common Issues

### Issue: Keys are being deleted

**Cause**: Running `i18n:extract` removes keys not found in code
**Solution**: Ensure you're using `t('key')` in your components

### Issue: Pluralization not working

**Cause**: Incorrect plural suffix for your language
**Solution**: Check [i18next plural rules](https://www.i18next.com/translation-function/plurals) for your language

### Issue: Special characters display incorrectly

**Cause**: File encoding issue
**Solution**: Ensure JSON files are saved as UTF-8

### Issue: Translation not appearing

**Checklist**:
1. Is the language added to `supportedLngs` in `i18n.ts`?
2. Are all imports added correctly?
3. Is the namespace imported in the component?
4. Is the translation key spelled correctly?
5. Did you restart the dev server after changes?

## Translation Tools

### Built-in Auto-Translation

Our language tool includes automatic translation suggestions via LibreTranslate:

```bash
# Enable auto-suggestions with -t flag
pnpm run i18n:add-language es -i -t

# Use custom LibreTranslate instance
pnpm run i18n:add-language es -i -t --api-url https://your-libretranslate.com
```

**Features:**
- Free and open-source translation API
- No API key required
- Works offline if you host your own instance
- Skips strings with variables (e.g., `{count}`) to avoid breaking interpolation

**Limitations:**
- Translations are suggestions only - always review carefully
- Quality varies by language pair
- May not handle financial/technical terms well
- Best for getting a quick first draft

**Best practices:**
- Use suggestions as a starting point
- Review every translation for accuracy and naturalness
- Adapt to your language's cultural context
- Test with actual data in the application

### External Translation Tools

- **DeepL**: High-quality machine translation (better than Google Translate)
- **Crowdin**: Translation management platform
- **i18n Ally**: VS Code extension for translation management

### Translation Management Platforms

Consider using professional translation platforms:
- **Crowdin** - https://crowdin.com
- **Lokalise** - https://lokalise.com
- **POEditor** - https://poeditor.com

These tools can:
- Provide translation memory
- Enable collaboration with multiple translators
- Offer context-aware translation suggestions
- Track translation progress and completeness
- Integrate with your development workflow

## Contributing

### Before Submitting

1. Test thoroughly in the actual application
2. Run `pnpm run lint:i18n` to validate
3. Check for console errors
4. Verify special characters display correctly
5. Test pluralization with different counts

### Pull Request

Include in your PR:
- Language code and name
- Translation completion percentage
- Any notes about cultural adaptations
- Screenshots showing the translation in use (optional)

### Translation Quality

Good translations should be:
- ✓ Natural sounding to native speakers
- ✓ Consistent in terminology
- ✓ Appropriate for financial context
- ✓ Technically accurate
- ✓ Properly formatted

## Resources

- **i18next Documentation**: https://www.i18next.com
- **react-i18next Documentation**: https://react.i18next.com
- **Unicode CLDR Plural Rules**: http://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html
- **ISO 639-1 Language Codes**: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

## Getting Help

- Check existing translations in `src/locales/en/` and `src/locales/fr/`
- Review the `TRANSLATION_IMPLEMENTATION.md` document
- Ask questions in GitHub discussions or issues

Thank you for helping make Wealthfolio accessible to more users worldwide! 🌍
