import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import esAuth from "@/lib/i18n/locales/es/auth.json";
import enAuth from "@/lib/i18n/locales/en/auth.json";
import esCommon from "@/lib/i18n/locales/es/common.json";
import enCommon from "@/lib/i18n/locales/en/common.json";
import esUi from "@/lib/i18n/locales/es/ui.json";
import enUi from "@/lib/i18n/locales/en/ui.json";
import esSettings from "@/lib/i18n/locales/es/settings.json";
import enSettings from "@/lib/i18n/locales/en/settings.json";
import esTopbar from "@/lib/i18n/locales/es/topbar.json";
import enTopbar from "@/lib/i18n/locales/en/topbar.json";
import esNotifications from "@/lib/i18n/locales/es/notifications.json";
import enNotifications from "@/lib/i18n/locales/en/notifications.json";
import esMessages from "@/lib/i18n/locales/es/messages.json";
import enMessages from "@/lib/i18n/locales/en/messages.json";
import esDirectory from "@/lib/i18n/locales/es/directory.json";
import enDirectory from "@/lib/i18n/locales/en/directory.json";
import esMyEnterprises from "@/lib/i18n/locales/es/my-enterprises.json";
import enMyEnterprises from "@/lib/i18n/locales/en/my-enterprises.json";
import esAteneo from "@/lib/i18n/locales/es/ateneo.json";
import enAteneo from "@/lib/i18n/locales/en/ateneo.json";
import esProfile from "@/lib/i18n/locales/es/profile.json";
import enProfile from "@/lib/i18n/locales/en/profile.json";

const LANGUAGE_STORAGE_KEY = "mathesis-ui-language";

function resolveInitialLanguage(): "es" | "en" {
  if (typeof window === "undefined") {
    return "es";
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && stored.trim().toLowerCase().startsWith("en")) {
    return "en";
  }

  return "es";
}

const resources = {
  es: {
    auth: esAuth,
    common: esCommon,
    ui: esUi,
    settings: esSettings,
    topbar: esTopbar,
    notifications: esNotifications,
    messages: esMessages,
    directory: esDirectory,
    myEnterprises: esMyEnterprises,
    ateneo: esAteneo,
    profile: esProfile,
  },
  "es-AR": {
    auth: esAuth,
    common: esCommon,
    ui: esUi,
    settings: esSettings,
    topbar: esTopbar,
    notifications: esNotifications,
    messages: esMessages,
    directory: esDirectory,
    myEnterprises: esMyEnterprises,
    ateneo: esAteneo,
    profile: esProfile,
  },
  en: {
    auth: enAuth,
    common: enCommon,
    ui: enUi,
    settings: enSettings,
    topbar: enTopbar,
    notifications: enNotifications,
    messages: enMessages,
    directory: enDirectory,
    myEnterprises: enMyEnterprises,
    ateneo: enAteneo,
    profile: enProfile,
  },
} as const;

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: resolveInitialLanguage(),
    fallbackLng: "es",
    supportedLngs: ["es", "es-AR", "en"],
    ns: ["common", "auth", "ui", "settings", "topbar", "notifications", "messages", "directory", "myEnterprises", "ateneo", "profile"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18next;
