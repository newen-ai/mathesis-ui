"use client";

import { useEffect, useState } from "react";
import { getMyPreferences, updateMyPreferences } from "@/lib/api/profile";
import {
  ThemeMode,
  applyThemeToDocument,
  normalizeTheme,
  persistTheme,
  readStoredTheme,
  readThemeFromDocument,
} from "@/lib/theme/theme-preference";

export type { ThemeMode } from "@/lib/theme/theme-preference";

function getInitialTheme(): ThemeMode {
  return readThemeFromDocument() ?? readStoredTheme() ?? "light";
}

export function useUiTheme() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const applyTheme = async () => {
      const prefs = await getMyPreferences();
      const backendTheme = normalizeTheme(prefs?.themePreference);

      if (!backendTheme) {
        return;
      }

      setTheme(backendTheme);
      applyThemeToDocument(backendTheme);
      persistTheme(backendTheme);
    };

    void applyTheme();
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
    persistTheme(theme);
  }, [theme]);

  const toggleTheme = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    // Save to backend
    try {
      await updateMyPreferences(nextTheme);
    } catch {
      // Silently fail - theme is already updated in localStorage
    }
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}