"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "colorful";

export interface ThemeConfig {
  id: Theme;
  label: string;
  icon: string;
  description: string;
  preview: { bg: string; card: string; primary: string };
}

export const THEMES: ThemeConfig[] = [
  {
    id: "light",
    label: "Light",
    icon: "☀️",
    description: "Clean & minimal",
    preview: { bg: "#f0f4f8", card: "#ffffff", primary: "#0d9488" },
  },
  {
    id: "dark",
    label: "Dark",
    icon: "🌙",
    description: "Easy on the eyes",
    preview: { bg: "#0f172a", card: "#1e293b", primary: "#14b8a6" },
  },
  {
    id: "colorful",
    label: "Colorful",
    icon: "🎨",
    description: "Vibrant & playful",
    preview: { bg: "#faf5ff", card: "#ede9fe", primary: "#8b5cf6" },
  },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "colorful",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("colorful");

  useEffect(() => {
    // Sync React state with what the inline script already applied (DOM read, not a React state cycle)
    const applied = document.documentElement.getAttribute(
      "data-theme",
    ) as Theme;
    if (applied && ["light", "dark", "colorful"].includes(applied)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(applied);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("pawshield-theme", t);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
