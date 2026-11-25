"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

const STORAGE_KEY = "subtext-theme-v2";
const ThemeContext = createContext({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const stored = localStorage.getItem(STORAGE_KEY) || "light";
    document.documentElement.classList.toggle("dark", stored === "dark");
    document.documentElement.classList.toggle("light", stored === "light");
    if (stored !== "light") {
      Promise.resolve().then(() => setTheme(stored));
    }
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);