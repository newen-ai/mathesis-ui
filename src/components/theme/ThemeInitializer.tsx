"use client";

import { useLayoutEffect } from "react";
import { getMyPreferences } from "@/lib/api/profile";

export function ThemeInitializer() {
  useLayoutEffect(() => {
    let isActive = true;

    const applyTheme = async () => {
      const preferences = await getMyPreferences();

      if (!isActive || !preferences?.themePreference) {
        return;
      }

      const nextTheme = preferences.themePreference;
      if (nextTheme !== "light" && nextTheme !== "dark") {
        return;
      }

      document.documentElement.setAttribute("data-theme", nextTheme);
    };

    void applyTheme();

    return () => {
      isActive = false;
    };
  }, []);

  return null;
}
