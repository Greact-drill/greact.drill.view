import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, type ThemeContextValue, type ThemeMode } from "./themeContext";

const THEME_STORAGE_KEY = "greact.theme";

const getInitialTheme = (): ThemeMode => {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((value: ThemeMode) => {
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isLight: theme === "light",
      toggleTheme,
      setTheme
    }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
