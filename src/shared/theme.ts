import { ThemeMode } from "./types";

export const palettes = {
  light: {
    bg: "#FDF8F5",
    surface: "#FFFCFA",
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
    border: "#EAD9D2",
    borderStrong: "#DFA0AE",
    danger: "#B84A4A",
    deep: "#2C1810",
    cream: "#FAF6F2",
    blush: "#F2C4CE",
    rose: "#D4607A",
    sage: "#8BAF8E",
    turmeric: "#E8A830"
  },
  dark: {
    bg: "#181111",
    surface: "#241B1B",
    surfaceAlt: "#302323",
    surfaceGlow: "#3A2C20",
    text: "#FFF8F5",
    muted: "#D0B6AE",
    primary: "#FF96AC",
    primarySoft: "#55313A",
    secondary: "#9DD0A1",
    secondarySoft: "#243B2B",
    accent: "#F2C36D",
    accentSoft: "#4B3820",
    border: "#4D3B38",
    borderStrong: "#9D6572",
    danger: "#FF9696",
    deep: "#140C0A",
    cream: "#211717",
    blush: "#6A3B47",
    rose: "#FF96AC",
    sage: "#9DD0A1",
    turmeric: "#F2C36D"
  }
} satisfies Record<ThemeMode, Record<string, string>>;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};
