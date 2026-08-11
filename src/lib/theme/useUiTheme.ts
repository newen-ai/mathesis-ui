"use client";

import { useEffect, useState } from "react";
import { getMyPreferences, updateMyPreferences } from "@/lib/api/profile";

export type ThemeMode = "light" | "dark";

export const UI_THEME_STORAGE_KEY = "mathesis-ui-theme";

export function useUiTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem(UI_THEME_STORAGE_KEY);
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    // Load theme preference from backend on mount
    const loadThemeFromBackend = async () => {
      try {
        const prefs = await getMyPreferences();
        if (prefs?.themePreference) {
          const backendTheme = prefs.themePreference as ThemeMode;
          setTheme(backendTheme);
        }
      } catch {
        // Silently fail - use localStorage fallback
      }
    };

    loadThemeFromBackend();
  }, []);

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