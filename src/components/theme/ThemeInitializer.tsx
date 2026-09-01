"use client";

import { useEffect } from "react";
import { getMyPreferences } from "@/lib/api/profile";
import {
  applyThemeToDocument,
  normalizeTheme,
  persistTheme,
  readThemeFromDocument,
} from "@/lib/theme/theme-preference";

export function ThemeInitializer() {
  useEffect(() => {
    let isActive = true;

    const applyTheme = async () => {
      const preferences = await getMyPreferences();

      if (!isActive || !preferences?.themePreference) {
        return;
      }

      const nextTheme = normalizeTheme(preferences.themePreference);
      if (!nextTheme) {
        return;
      }

      const currentTheme = readThemeFromDocument();
      if (currentTheme !== nextTheme) {
        applyThemeToDocument(nextTheme);
      }

      persistTheme(nextTheme);
    };

    void applyTheme();

    return () => {
      isActive = false;
    };
  }, []);

  return null;
}
