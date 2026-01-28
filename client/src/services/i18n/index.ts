import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import vi from "./locales/vi";

const resources = {
  vi: {
    translation: vi,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "vi", // Default to Vietnamese
  fallbackLng: "vi",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
