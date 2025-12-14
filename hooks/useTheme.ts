"use client";

import { useTheme as useThemeContext, ThemeId } from "@/lib/theme";

export type ThemeMode = ThemeId;

export function useTheme() {
  const { themeId, setThemeId, toggleTheme, mounted } = useThemeContext();

  const setThemeMode = (newTheme: ThemeMode) => {
    setThemeId(newTheme);
  };

  return {
    theme: themeId,
    toggleTheme,
    setThemeMode,
    mounted,
  };
}
