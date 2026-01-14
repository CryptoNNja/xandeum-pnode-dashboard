"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useHydrated } from "@/hooks/useHydrated";

export type ThemeId = "light" | "dark";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readInitialTheme = (): ThemeId => {
  if (typeof window === "undefined") {
    return "dark";
  }
  const stored =
    window.localStorage.getItem("xandeum-theme") ||
    window.localStorage.getItem("xandeum-theme-id");
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return "dark";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with "dark" on server to avoid hydration mismatch
  const [themeId, setThemeIdState] = useState<ThemeId>("dark");
  const mounted = useHydrated();

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeIdState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  // Read stored theme after hydration (client-side only)
  useEffect(() => {
    const stored = readInitialTheme();
    if (stored !== "dark") {
      setThemeIdState(stored);
    }
  }, []);

  // Apply theme to DOM and persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("xandeum-theme-id", themeId);
    window.localStorage.setItem("xandeum-theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    
    // Add/remove dark class for Tailwind
    if (themeId === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
