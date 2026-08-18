// Design tokens -- the single source of truth for AgroFlow's visual
// identity. Palette: fresh green/earth (agriculture-forward), built
// around real growth-cycle colors -- new-leaf green through to harvest
// gold and soil brown -- rather than a generic SaaS blue.
//
// Every feature reuses these tokens via Tailwind classes or the
// glass/neu utilities in src/styles/globals.css. Never hardcode a hex
// value in a component -- add it here if it's missing.
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // Leaf -- primary. New-growth green, deep enough to hold its
        // own against white/glass surfaces at 900, bright enough at
        // 400/500 to read as "alive" for primary actions.
        leaf: {
          50: "#F1F8F1",
          100: "#DCEFDD",
          200: "#B5DFB8",
          300: "#87C98E",
          400: "#57AC64",
          500: "#348F45",
          600: "#237236",
          700: "#1B5A2C",
          800: "#164825",
          900: "#0F3D28",
          950: "#092719",
        },
        // Harvest -- accent. Ripe-grain gold for CTAs, highlights,
        // active states -- the warmth against leaf's coolness.
        harvest: {
          50: "#FDF8EC",
          100: "#FAEDC7",
          200: "#F3D98A",
          300: "#ECC257",
          400: "#E3A82E",
          500: "#CE8E1B",
          600: "#A96F16",
          700: "#855417",
          800: "#6D4419",
          900: "#5C3A1A",
        },
        // Soil -- secondary/earth. Grounding neutral-warm brown, used
        // sparingly for borders, icon accents, and dark-on-cream text.
        soil: {
          50: "#F8F4F0",
          100: "#EEE3D8",
          200: "#DBC3AC",
          300: "#C29E7C",
          400: "#A97D56",
          500: "#8B5E3C",
          600: "#704A2E",
          700: "#5A3B26",
          800: "#493121",
          900: "#3D2A1D",
        },
        // Semantic
        rust: { 500: "#C1502E", 600: "#A3401F" }, // danger/error -- warm, not clinical red
        clay: { 500: "#2A8C82", 600: "#22706A" }, // info -- muted teal, reads as "water"
      },
      borderRadius: {
        xl2: "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        // Soft-shadow neumorphic-glass: a diffuse dark shadow plus a
        // faint light "lift" on the opposite edge, tuned low-contrast
        // so it reads as pressed-glass rather than harsh skeuomorphism.
        "glass-sm": "0 1px 2px 0 rgba(15,61,40,0.06), 0 1px 1px 0 rgba(255,255,255,0.4) inset",
        glass: "0 8px 32px -4px rgba(15,61,40,0.18), 0 1px 0 0 rgba(255,255,255,0.5) inset",
        "glass-lg": "0 20px 60px -12px rgba(15,61,40,0.28), 0 1px 0 0 rgba(255,255,255,0.55) inset",
        neu: "6px 6px 16px rgba(15,61,40,0.14), -6px -6px 16px rgba(255,255,255,0.65)",
        "neu-inset": "inset 3px 3px 8px rgba(15,61,40,0.12), inset -3px -3px 8px rgba(255,255,255,0.6)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glass-shine": {
          "0%": { transform: "translateX(-120%) rotate(8deg)" },
          "100%": { transform: "translateX(220%) rotate(8deg)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "glass-shine": "glass-shine 1.4s ease-in-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
