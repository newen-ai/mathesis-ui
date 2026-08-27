"use client";

import { useEffect, useState } from "react";
import { getMyPreferences, updateMyPreferences } from "@/lib/api/profile";

export type ThemeMode = "light" | "dark";

export function useUiTheme() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const applyTheme = async () => {
      const prefs = await getMyPreferences();
      const backendTheme = prefs?.themePreference;

      if (backendTheme !== "light" && backendTheme !== "dark") {
        return;
      }

      setTheme(backendTheme);
      document.documentElement.setAttribute("data-theme", backendTheme);
    };

    void applyTheme();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
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