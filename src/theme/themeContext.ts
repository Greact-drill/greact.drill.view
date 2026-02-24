import { createContext } from "react";

export type ThemeMode = "dark" | "light";

export interface ThemeContextValue {
  theme: ThemeMode;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
