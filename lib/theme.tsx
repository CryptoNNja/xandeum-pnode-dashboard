"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type ThemeId = "day" | "night";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("night");

  // Hydrate depuis le localStorage côté client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("xandeum-theme-id");
    if (stored === "day" || stored === "night") {
      setThemeIdState(stored);
    }
  }, []);

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("xandeum-theme-id", id);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
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
