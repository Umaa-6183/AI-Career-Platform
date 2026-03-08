/**
 * CareerIQ Pro — ThemeSwitcher.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * A floating button + dropdown to switch themes at runtime.
 * Drop this anywhere in your JSX:
 *   import ThemeSwitcher from './components/ThemeSwitcher';
 *   <ThemeSwitcher />
 */

import { useState } from "react";
import { useTheme } from "./ThemeProvider";

const ICONS = {
  dark:   "🌑",
  light:  "☀️",
  purple: "🔮",
  ocean:  "🌊",
};

export default function ThemeSwitcher({ position = "bottom-right" }) {
  const { themeName, switchTheme, availableThemes } = useTheme();
  const [open, setOpen] = useState(false);

  const posStyle = {
    "bottom-right": { bottom: 24, right: 24 },
    "bottom-left":  { bottom: 24, left:  24 },
    "top-right":    { top:    24, right: 24 },
    "top-left":     { top:    24, left:  24 },
  }[position] || { bottom: 24, right: 24 };

  return (
    <div style={{ position: "fixed", zIndex: 9999, ...posStyle }}>
      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          bottom: 52,
          right: 0,
          background: "var(--color-bg-card, #1C1C2A)",
          border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
          borderRadius: "var(--radius-lg, 14px)",
          padding: "8px",
          minWidth: 180,
          boxShadow: "var(--shadow-card, 0 4px 24px rgba(0,0,0,0.4))",
        }}>
          <p style={{
            fontSize: 11,
            color: "var(--color-text-muted, #7777AA)",
            padding: "4px 10px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Theme
          </p>
          {availableThemes.map(({ key, name }) => (
            <button
              key={key}
              onClick={() => { switchTheme(key); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                borderRadius: "var(--radius-md, 10px)",
                border: "none",
                cursor: "pointer",
                background: key === themeName
                  ? "var(--color-primary-glow, rgba(26,107,255,0.15))"
                  : "transparent",
                color: key === themeName
                  ? "var(--color-primary, #1A6BFF)"
                  : "var(--color-text, #EEEEF8)",
                fontSize: 14,
                fontWeight: key === themeName ? 600 : 400,
                transition: "var(--transition, all 0.18s ease)",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 16 }}>{ICONS[key] || "🎨"}</span>
              {name}
              {key === themeName && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--color-primary, #1A6BFF)",
                }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Switch theme"
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
          background: "var(--color-bg-card, #1C1C2A)",
          cursor: "pointer",
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-card)",
          transition: "var(--transition)",
        }}
      >
        {ICONS[themeName] || "🎨"}
      </button>
    </div>
  );
}
