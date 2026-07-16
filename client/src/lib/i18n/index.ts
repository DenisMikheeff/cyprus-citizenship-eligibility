import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/translation.json";
import ru from "@/locales/ru/translation.json";
import el from "@/locales/el/translation.json";

// No localStorage/cookies allowed in this app (sandboxed static hosting) —
// language choice lives only in React state for the session. i18next is
// initialized once at module load with English as the default/fallback.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    el: { translation: el },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "el", label: "Ελληνικά" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
