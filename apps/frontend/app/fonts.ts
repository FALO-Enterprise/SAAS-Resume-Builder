import { Playfair_Display, Syne, Noto_Kufi_Arabic } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-playfair",
  fallback: ["Georgia", "serif"],
});

export const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-syne",
  fallback: ["system-ui", "sans-serif"],
});

export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--ff-arabic",
  fallback: ["sans-serif"],
});

export const FONT_VARIABLES = `${playfair.variable} ${syne.variable} ${notoKufiArabic.variable}`;
