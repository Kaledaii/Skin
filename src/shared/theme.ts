import { ThemeMode } from "./types";

export const palettes = {
  light: {
    bg: "#FDF8F5",
    surface: "#FFFFFF",
    surfaceAlt: "#F9EEF1",
    surfaceGlow: "#FDF4E3",
    text: "#3A2520",
    muted: "#9B7B72",
    primary: "#D4607A",
    primarySoft: "#F7DDE4",
    secondary: "#8BAF8E",
    secondarySoft: "#EAF2EB",
    accent: "#E8A830",
    accentSoft: "#FDF4E3",
    border: "rgba(212, 96, 122, 0.15)",
    borderStrong: "rgba(212, 96, 122, 0.25)",
    danger: "#B84A4A",
    deep: "#2C1810",
    cream: "#FAF6F2",
    blush: "#F2C4CE",
    rose: "#D4607A",
    sage: "#8BAF8E",
    turmeric: "#E8A830"
  },
  dark: {
    bg: "#120D0E",
    surface: "#1E1517",
    surfaceAlt: "#2A1B20",
    surfaceGlow: "#2A1B15",
    text: "#FFF8F5",
    muted: "#D9B8B1",
    primary: "#FF87A3",
    primarySoft: "#4A2530",
    secondary: "#A8CDAA",
    secondarySoft: "#1F3327",
    accent: "#F3C66C",
    accentSoft: "#3B2A14",
    border: "rgba(255, 135, 163, 0.18)",
    borderStrong: "rgba(255, 135, 163, 0.35)",
    danger: "#FF8A8A",
    deep: "#FFF8F5",
    cream: "#160F10",
    blush: "#6C3445",
    rose: "#FF87A3",
    sage: "#A8CDAA",
    turmeric: "#F3C66C"
  }
} satisfies Record<ThemeMode, Record<string, string>>;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};
