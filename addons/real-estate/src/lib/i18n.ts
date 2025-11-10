import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

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
  // Check if i18n is already initialized (from main app)
  if (i18n.isInitialized) {
    // Add addon translations to existing instance
    i18n.addResourceBundle("en", defaultNS, translationEn, true, false);
    i18n.addResourceBundle("fr", defaultNS, translationFr, true, false);
    return i18n;
  }

  // If not initialized, create a new instance (fallback for standalone mode)
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      defaultNS,
      fallbackLng: "en",
      supportedLngs: ["en", "fr"],
      load: "languageOnly",
      debug: false,

      interpolation: {
        escapeValue: false,
        prefix: "{",
        suffix: "}",
      },

      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "i18nextLng",
      },
    });

  return i18n;
}

export default i18n;
