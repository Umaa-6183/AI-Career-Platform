/**
 * CareerIQ Pro — Theme Configuration
 * ====================================
 * This is the SINGLE FILE to edit for rebranding.
 * Change colors, fonts, sizes here — everything updates automatically.
 *
 * HOW TO USE:
 *   import theme from './theme';
 *   <div style={{ background: theme.colors.primary }}>
 *
 * HOW TO SWITCH THEMES:
 *   Change: export default THEMES.dark;
 *   To:     export default THEMES.light;
 *   Or:     export default THEMES.purple;
 */

// ─── Color Palettes ──────────────────────────────────────────────────────────

export const THEMES = {

  /** Default — Electric Dark (current design) */
  dark: {
    name: "Electric Dark",
    colors: {
      // ── Primary Brand ─────────────────────────────────────────────────────
      primary:        "#1A6BFF",   // Electric Cobalt — buttons, active, scores
      primaryDark:    "#0047CC",   // Hover / pressed state
      primaryGlow:    "rgba(26, 107, 255, 0.18)",
      primaryBorder:  "rgba(26, 107, 255, 0.35)",

      // ── Accent Colors ─────────────────────────────────────────────────────
      alert:          "#FF6425",   // Sunset Orange — warnings, missing skills
      alertGlow:      "rgba(255, 100, 37, 0.18)",

      success:        "#AAFF00",   // Acid Lime — owned skills, advancement
      successGlow:    "rgba(170, 255, 0, 0.15)",
      successBorder:  "rgba(170, 255, 0, 0.30)",

      // ── Backgrounds ───────────────────────────────────────────────────────
      bg:             "#141420",   // Page background (darkest)
      bgCard:         "#1C1C2A",   // Card surface
      bgInput:        "#252535",   // Input / interactive surface
      bgDeep:         "#0D0D18",   // Sidebar / modal overlay

      // ── Text ──────────────────────────────────────────────────────────────
      text:           "#EEEEF8",   // Primary text
      textMuted:      "#7777AA",   // Labels, secondary info
      textDim:        "#44445A",   // Placeholder, disabled

      // ── Borders ───────────────────────────────────────────────────────────
      border:         "rgba(255, 255, 255, 0.07)",
      borderActive:   "rgba(26, 107, 255, 0.35)",
    },
    fonts: {
      heading:   "'Syne', sans-serif",
      mono:      "'JetBrains Mono', monospace",
      body:      "'Inter', sans-serif",
    },
    fontSizes: {
      xs:   "11px",
      sm:   "13px",
      md:   "15px",
      lg:   "18px",
      xl:   "22px",
      "2xl": "28px",
      "3xl": "36px",
    },
    radii: {
      sm:  "6px",
      md:  "10px",
      lg:  "14px",
      xl:  "20px",
      pill:"999px",
    },
    shadows: {
      card:    "0 2px 24px rgba(0,0,0,0.35)",
      glow:    "0 0 20px rgba(26, 107, 255, 0.25)",
      limeGlow:"0 0 16px rgba(170, 255, 0, 0.20)",
    },
    transition: "all 0.18s ease",
  },

  /** Light Mode */
  light: {
    name: "Clean Light",
    colors: {
      primary:        "#1A6BFF",
      primaryDark:    "#0047CC",
      primaryGlow:    "rgba(26, 107, 255, 0.10)",
      primaryBorder:  "rgba(26, 107, 255, 0.25)",

      alert:          "#E55A00",
      alertGlow:      "rgba(229, 90, 0, 0.12)",

      success:        "#2D9F00",
      successGlow:    "rgba(45, 159, 0, 0.12)",
      successBorder:  "rgba(45, 159, 0, 0.25)",

      bg:             "#F2F4F7",
      bgCard:         "#FFFFFF",
      bgInput:        "#EAECF0",
      bgDeep:         "#E0E3EA",

      text:           "#111827",
      textMuted:      "#6B7280",
      textDim:        "#9CA3AF",

      border:         "rgba(0, 0, 0, 0.08)",
      borderActive:   "rgba(26, 107, 255, 0.30)",
    },
    fonts: {
      heading:   "'Syne', sans-serif",
      mono:      "'JetBrains Mono', monospace",
      body:      "'Inter', sans-serif",
    },
    fontSizes: {
      xs:   "11px",
      sm:   "13px",
      md:   "15px",
      lg:   "18px",
      xl:   "22px",
      "2xl": "28px",
      "3xl": "36px",
    },
    radii: {
      sm:  "6px",
      md:  "10px",
      lg:  "14px",
      xl:  "20px",
      pill:"999px",
    },
    shadows: {
      card:    "0 2px 12px rgba(0,0,0,0.08)",
      glow:    "0 0 20px rgba(26, 107, 255, 0.12)",
      limeGlow:"0 0 16px rgba(45, 159, 0, 0.12)",
    },
    transition: "all 0.18s ease",
  },

  /** Purple Dark */
  purple: {
    name: "Deep Purple",
    colors: {
      primary:        "#7C3AED",
      primaryDark:    "#5B21B6",
      primaryGlow:    "rgba(124, 58, 237, 0.18)",
      primaryBorder:  "rgba(124, 58, 237, 0.35)",

      alert:          "#F59E0B",
      alertGlow:      "rgba(245, 158, 11, 0.18)",

      success:        "#10B981",
      successGlow:    "rgba(16, 185, 129, 0.15)",
      successBorder:  "rgba(16, 185, 129, 0.30)",

      bg:             "#0F0F1A",
      bgCard:         "#1A1A2E",
      bgInput:        "#252540",
      bgDeep:         "#080810",

      text:           "#F0F0FF",
      textMuted:      "#8888BB",
      textDim:        "#44444A",

      border:         "rgba(255, 255, 255, 0.07)",
      borderActive:   "rgba(124, 58, 237, 0.35)",
    },
    fonts: {
      heading:   "'Space Grotesk', sans-serif",
      mono:      "'Fira Code', monospace",
      body:      "'DM Sans', sans-serif",
    },
    fontSizes: {
      xs:   "11px",
      sm:   "13px",
      md:   "15px",
      lg:   "18px",
      xl:   "22px",
      "2xl": "28px",
      "3xl": "36px",
    },
    radii: {
      sm:  "6px",
      md:  "12px",
      lg:  "16px",
      xl:  "24px",
      pill:"999px",
    },
    shadows: {
      card:    "0 2px 24px rgba(0,0,0,0.45)",
      glow:    "0 0 20px rgba(124, 58, 237, 0.25)",
      limeGlow:"0 0 16px rgba(16, 185, 129, 0.20)",
    },
    transition: "all 0.18s ease",
  },

  /** Ocean Teal */
  ocean: {
    name: "Ocean Teal",
    colors: {
      primary:        "#0D9488",
      primaryDark:    "#0F766E",
      primaryGlow:    "rgba(13, 148, 136, 0.18)",
      primaryBorder:  "rgba(13, 148, 136, 0.35)",

      alert:          "#F97316",
      alertGlow:      "rgba(249, 115, 22, 0.18)",

      success:        "#84CC16",
      successGlow:    "rgba(132, 204, 22, 0.15)",
      successBorder:  "rgba(132, 204, 22, 0.30)",

      bg:             "#0A1628",
      bgCard:         "#112240",
      bgInput:        "#1D3557",
      bgDeep:         "#050D1A",

      text:           "#CCD6F6",
      textMuted:      "#8892B0",
      textDim:        "#4A5568",

      border:         "rgba(100, 255, 218, 0.07)",
      borderActive:   "rgba(13, 148, 136, 0.35)",
    },
    fonts: {
      heading:   "'Manrope', sans-serif",
      mono:      "'IBM Plex Mono', monospace",
      body:      "'Nunito', sans-serif",
    },
    fontSizes: {
      xs:   "11px",
      sm:   "13px",
      md:   "15px",
      lg:   "18px",
      xl:   "22px",
      "2xl": "28px",
      "3xl": "36px",
    },
    radii: {
      sm:  "4px",
      md:  "8px",
      lg:  "12px",
      xl:  "18px",
      pill:"999px",
    },
    shadows: {
      card:    "0 4px 32px rgba(0,0,0,0.40)",
      glow:    "0 0 24px rgba(13, 148, 136, 0.25)",
      limeGlow:"0 0 16px rgba(132, 204, 22, 0.20)",
    },
    transition: "all 0.20s ease",
  },
};

// ─── Active Theme ─────────────────────────────────────────────────────────────
// 🎨 CHANGE THIS LINE to switch the entire app's look:
//    THEMES.dark   → Default electric dark
//    THEMES.light  → Clean white/light mode
//    THEMES.purple → Deep purple dark
//    THEMES.ocean  → Ocean teal dark

const theme = THEMES.dark;

export default theme;


// ─── Google Fonts URL ─────────────────────────────────────────────────────────
// Update this when switching themes that use different fonts.
// Paste this URL into: frontend/src/index.css @import line
// And into:            frontend/public/index.html <link> tag

export const GOOGLE_FONTS_URLS = {
  dark:   "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap",
  light:  "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap",
  purple: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap",
  ocean:  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Nunito:wght@300;400;500;600&display=swap",
};
