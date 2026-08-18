// Mirrors apps/web/tailwind.config.ts's design tokens 1:1 -- same fresh
// green/earth palette, same soft-shadow neumorphic-glass shadow specs --
// so AgroFlow feels like one product across web and mobile, not two
// different apps wearing the same logo. React Native has no Tailwind
// runtime, so these are plain JS objects consumed via StyleSheet.create.
export const colors = {
  leaf: {
    50: "#F1F8F1", 100: "#DCEFDD", 200: "#B5DFB8", 300: "#87C98E",
    400: "#57AC64", 500: "#348F45", 600: "#237236", 700: "#1B5A2C",
    800: "#164825", 900: "#0F3D28", 950: "#092719",
  },
  harvest: {
    50: "#FDF8EC", 100: "#FAEDC7", 200: "#F3D98A", 300: "#ECC257",
    400: "#E3A82E", 500: "#CE8E1B", 600: "#A96F16", 700: "#855417",
    800: "#6D4419", 900: "#5C3A1A",
  },
  soil: {
    50: "#F8F4F0", 100: "#EEE3D8", 200: "#DBC3AC", 300: "#C29E7C",
    400: "#A97D56", 500: "#8B5E3C", 600: "#704A2E", 700: "#5A3B26",
    800: "#493121", 900: "#3D2A1D",
  },
  rust: { 500: "#C1502E", 600: "#A3401F" },
  clay: { 500: "#2A8C82", 600: "#22706A" },
  white: "#FFFFFF",
};

export const radii = { md: 14, lg: 20, xl: 24, pill: 999 };

export const spacing = (n: number) => n * 4;

// expo-blur intensity + tint used everywhere a glass surface appears.
export const glass = {
  intensity: 40,
  tint: "light" as const,
  borderColor: "rgba(255,255,255,0.6)",
  surface: "rgba(255,255,255,0.55)",
  surfaceStrong: "rgba(255,255,255,0.72)",
};

export const shadow = {
  glass: {
    shadowColor: colors.leaf[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  neu: {
    shadowColor: colors.leaf[900],
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayMedium: "Fraunces_500Medium",
  sans: "Manrope_500Medium",
  sansSemibold: "Manrope_700Bold",
  mono: "IBMPlexMono_500Medium",
};
