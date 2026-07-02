import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_CUSTOM_ACCENT, DEFAULT_THEME_ID, THEME_PRESETS, type ThemePreset } from "@datacon/shared-types";

type ThemeId = ThemePreset["id"] | "custom";

interface ThemeContextValue {
  themeId: ThemeId;
  customAccent: string;
  setTheme: (id: ThemeId) => void;
  setCustomAccent: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_THEME = "datacon:theme";
const STORAGE_CUSTOM = "datacon:customAccent";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => (localStorage.getItem(STORAGE_THEME) as ThemeId) || DEFAULT_THEME_ID);
  const [customAccent, setCustomAccentState] = useState<string>(() => localStorage.getItem(STORAGE_CUSTOM) || DEFAULT_CUSTOM_ACCENT);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dc-theme-soft", "dc-theme-emerald", "dc-theme-sapphire", "dc-theme-sunset", "dc-theme-custom");
    root.classList.add("dc-theme", `dc-theme-${themeId}`);
    if (themeId === "custom") {
      root.style.setProperty("--ac", customAccent);
    } else {
      root.style.removeProperty("--ac");
    }
    localStorage.setItem(STORAGE_THEME, themeId);
    localStorage.setItem(STORAGE_CUSTOM, customAccent);
  }, [themeId, customAccent]);

  const setTheme = useCallback((id: ThemeId) => setThemeId(id), []);
  const setCustomAccent = useCallback((hex: string) => {
    setCustomAccentState(hex);
    setThemeId("custom");
  }, []);

  const value = useMemo(() => ({ themeId, customAccent, setTheme, setCustomAccent }), [themeId, customAccent, setTheme, setCustomAccent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { THEME_PRESETS };
