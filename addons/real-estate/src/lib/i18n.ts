import i18n from "i18next";

// Import translation files
import translationEn from "../locales/en/translation.json";
import translationFr from "../locales/fr/translation.json";

export const defaultNS = "real-estate";
export const resources = {
  en: {
    "real-estate": translationEn,
  },
  fr: {
    "real-estate": translationFr,
  },
} as const;

// Initialize i18n for the addon
// This will work with the main app's i18n instance
export function initAddonI18n() {
  console.log("🌐 Initializing real-estate addon i18n...");
  console.log("i18n instance:", i18n);
  console.log("i18n.isInitialized:", i18n.isInitialized);
  console.log("i18n.language:", i18n.language);
  console.log("Translation data EN:", translationEn);
  console.log("Translation data FR:", translationFr);

  // Check if i18n is already initialized (from main app)
  if (i18n.isInitialized) {
    console.log("✅ i18n is initialized, adding resource bundles...");

    // Add addon translations to existing instance
    i18n.addResourceBundle("en", defaultNS, translationEn, true, false);
    i18n.addResourceBundle("fr", defaultNS, translationFr, true, false);

    console.log("Resource bundles added for en and fr");

    // Reload the current language to make the new translations active
    const currentLanguage = i18n.language;
    if (currentLanguage) {
      console.log(`Reloading resources for language: ${currentLanguage}`);
      i18n.reloadResources(currentLanguage, defaultNS);
    }

    // Test translation
    const testTranslation = i18n.t("real-estate:pageTitle");
    console.log("Test translation for 'pageTitle':", testTranslation);
  } else {
    console.error("❌ i18n is NOT initialized! Addon translations will not work.");
  }

  return i18n;
}
