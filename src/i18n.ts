import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./locales/de.json";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { de: { translation: de } },
    lng: "de",
    fallbackLng: "de",
    supportedLngs: ["de"],
    ns: ["translation"],
    defaultNS: "translation",
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });
}

export default i18n;
