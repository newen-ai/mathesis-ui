import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import esAuth from "@/lib/i18n/locales/es/auth.json";
import enAuth from "@/lib/i18n/locales/en/auth.json";
import esCommon from "@/lib/i18n/locales/es/common.json";
import enCommon from "@/lib/i18n/locales/en/common.json";

const resources = {
  es: {
    auth: esAuth,
    common: esCommon,
  },
  en: {
    auth: enAuth,
    common: enCommon,
  },
} as const;

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: "es",
    fallbackLng: "es",
    ns: ["common", "auth"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18next;
