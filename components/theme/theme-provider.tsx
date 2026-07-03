"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";
type Area = "site" | "admin";

type ThemeCtx = {
  theme: Theme;
  area: Area;
  toggle: () => void;
  setTheme: (t: Theme) => void;
};

const ThemeContext = React.createContext<ThemeCtx | null>(null);

function areaFor(pathname: string | null): Area {
  return pathname && pathname.startsWith("/admin") ? "admin" : "site";
}
function keyFor(area: Area) {
  return `alaridi-theme2:${area}`;
}
function defaultFor(area: Area): Theme {
  // Elegant dark on the storefront (matches the brand), light on /admin.
  return area === "admin" ? "light" : "dark";
}
function apply(theme: Theme) {
  const d = document.documentElement;
  d.classList.toggle("dark", theme === "dark");
  d.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const area = areaFor(pathname);
  const [theme, setThemeState] = React.useState<Theme>(() => defaultFor(area));

  // Re-apply whenever the area changes (storefront <-> admin), honoring the
  // saved per-area preference and falling back to the per-area default.
  React.useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(keyFor(area));
    } catch {
      saved = null;
    }
    const next: Theme =
      saved === "light" || saved === "dark" ? saved : defaultFor(area);
    setThemeState(next);
    apply(next);
  }, [area]);

  const setTheme = React.useCallback(
    (t: Theme) => {
      setThemeState(t);
      apply(t);
      try {
        localStorage.setItem(keyFor(area), t);
      } catch {
        /* ignore */
      }
    },
    [area]
  );

  const toggle = React.useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, area, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark",
      area: "site",
      toggle: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}
