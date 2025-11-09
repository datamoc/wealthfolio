export default {
  // Location of translation files
  locales: ['en', 'fr'],
  output: 'src/locales/$LOCALE/$NAMESPACE.json',

  // Input files to scan
  input: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/lib/i18n*.ts',
  ],

  // Default namespace
  defaultNamespace: 'common',

  // Use i18next-scanner to find translation keys
  useKeysAsDefaultValue: false,

  // Keep the keys sorted alphabetically
  sort: true,

  // Keep existing translations and add new keys
  keepRemoved: false,

  // Interpolation settings to match your i18n config
  prefix: '{',
  suffix: '}',

  // Namespaces to use
  defaultValue: (locale, namespace, key) => {
    // Return empty string as default value for missing keys
    return '';
  },

  // Set to true to create missing files
  createOldCatalogs: false,

  // Indentation of the JSON files
  indentation: 2,

  // Line ending style
  lineEnding: 'auto',

  // Fail if there are missing keys
  failOnWarnings: false,
  failOnUpdate: false,

  // Custom lexers (optional - for advanced parsing)
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
  },

  // Namespaces configuration
  // This helps organize translations by feature/page
  namespaceSeparator: ':',
  keySeparator: '.',
};
