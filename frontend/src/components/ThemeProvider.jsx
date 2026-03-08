/**
 * CareerIQ Pro — ThemeProvider.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Wraps the entire app. Reads from theme.js and applies CSS variables globally.
 * Supports hot-switching themes without page reload.
 *
 * Usage in App_Full.jsx (at the very top):
 *   import ThemeProvider from './components/ThemeProvider';
 *   export default function App() {
 *     return <ThemeProvider><AppShell /></ThemeProvider>;
 *   }
 */

import { createContext, useContext, useState, useEffect } from "react";
import { THEMES, GOOGLE_FONTS_URLS } from "../theme";

// ─── Theme Context ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

// ─── Load Google Fonts dynamically ────────────────────────────────────────────
function loadFonts(themeName) {
  const existing = document.getElementById("careeriq-fonts");
  if (existing) existing.remove();

  const link = document.createElement("link");
  link.id = "careeriq-fonts";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_URLS[themeName] || GOOGLE_FONTS_URLS.dark;
  document.head.appendChild(link);
}

// ─── Apply theme as CSS custom properties ─────────────────────────────────────
function applyThemeToCSSVars(theme) {
  const root = document.documentElement;
  const { colors, fonts, fontSizes, radii, shadows } = theme;

  // Colors
  Object.entries(colors).forEach(([key, val]) => {
    // camelCase → kebab-case
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(`--color-${cssKey}`, val);
  });

  // Fonts
  Object.entries(fonts).forEach(([key, val]) => {
    root.style.setProperty(`--font-${key}`, val);
  });

  // Font sizes
  Object.entries(fontSizes).forEach(([key, val]) => {
    root.style.setProperty(`--fs-${key}`, val);
  });

  // Border radii
  Object.entries(radii).forEach(([key, val]) => {
    root.style.setProperty(`--radius-${key}`, val);
  });

  // Shadows
  Object.entries(shadows).forEach(([key, val]) => {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(`--shadow-${cssKey}`, val);
  });

  // Transition
  root.style.setProperty("--transition", theme.transition);

  // Background (apply to body directly for instant effect)
  document.body.style.background = colors.bg;
  document.body.style.color = colors.text;
  document.body.style.fontFamily = fonts.body;
}

// ─── ThemeProvider Component ───────────────────────────────────────────────────
export default function ThemeProvider({ children, initialTheme = "dark" }) {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem("careeriq-theme") || initialTheme
  );

  const theme = THEMES[themeName] || THEMES.dark;

  useEffect(() => {
    applyThemeToCSSVars(theme);
    loadFonts(themeName);
    localStorage.setItem("careeriq-theme", themeName);
  }, [themeName, theme]);

  const switchTheme = (name) => {
    if (THEMES[name]) setThemeName(name);
  };

  const availableThemes = Object.keys(THEMES).map((key) => ({
    key,
    name: THEMES[key].name,
  }));

  return (
    <ThemeCtx.Provider value={{ theme, themeName, switchTheme, availableThemes }}>
      {/* Inject base CSS reset + CSS var usage */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: var(--color-bg, #141420);
          color: var(--color-text, #EEEEF8);
          font-family: var(--font-body, 'Inter', sans-serif);
          min-height: 100vh;
          overflow-x: hidden;
          transition: background 0.3s ease, color 0.3s ease;
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: var(--color-bg-deep, #0D0D18); }
        ::-webkit-scrollbar-thumb { background: var(--color-primary, #1A6BFF); border-radius: 3px; }
        ::selection { background: var(--color-primary-glow, rgba(26,107,255,0.3)); }
        input, textarea, select, button { font-family: inherit; }
        a { color: var(--color-primary, #1A6BFF); text-decoration: none; }
      `}</style>
      {children}
    </ThemeCtx.Provider>
  );
}
