import { GhostInkPage } from "./GhostInkPage";

// Studio page registry — maps studio slug → { page | theme, cardTheme }.
// Studios NOT listed here use the standard StudioProfilePage and default card styling.
//
// page:      a studio's own page component (rendered with { slug }) — wins over theme
// theme:     passed to ThemedStudioPage — controls the full studio page look
// cardTheme: passed to PublicStudioCard — controls catalog card gradient + badge colors
//
// All theme fields are optional; missing fields fall back on DEFAULT_THEME in ThemedStudioPage.jsx.
//
// ⚠️ Every `page` is one more copy of the studio page. Changes meant for ALL studio
// pages must go into StudioProfilePage, ThemedStudioPage and each `page` component.
//
// To add a new customer:
//   1. Add an entry below with their slug
//   2. Set theme colors/fonts to match their website
//   3. Set cardTheme.gradient to match their brand color for the catalog card

export const studioRegistry = {
  // Kontot är dolt i CRM:et tills vidare — GhostInkPage visar då samma fel som
  // för vilken dold studio som helst.
  "ghost-ink": {
    page: GhostInkPage,
    cardTheme: {
      // Near-black over the photo, sand badge — the beige/black brand
      gradient: "linear-gradient(135deg, rgba(17,17,17,0.9) 0%, rgba(17,17,17,0.55) 100%)",
      badgeBg: "#C8B8A3",
      badgeText: "#111111",
      ctaBg: "#111111",
      ctaText: "#F7F5F1",
    },
  },
  royalkave: {
    theme: {
      bg: "#ffffff",
      bgAlt: "#f2f2f2",
      bgDark: "#0d0d0d",
      text: "#111111",
      textLight: "#ffffff",
      textMuted: "#555555",
      accent: "#111111",
      accentText: "#ffffff",
      heroOverlay:
        "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)",
      fontHeading: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
      fontBody: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      googleFonts:
        "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Inter:wght@400;500&display=swap",
      headingTransform: "uppercase",
      headingWeight: 900,
      borderRadius: 999,
    },
    cardTheme: {
      // Black/white gradient to match their monochrome brand
      gradient: "linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(30,30,30,0.75) 100%)",
      badgeBg: "#111111",
      badgeText: "#ffffff",
      ctaBg: "#111111",
      ctaText: "#ffffff",
    },
  },
};
