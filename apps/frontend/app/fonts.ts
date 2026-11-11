import { Playfair_Display, Libre_Franklin, Noto_Kufi_Arabic } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-playfair",
  fallback: ["Georgia", "serif"],
});

export const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-franklin",
  fallback: ["system-ui", "sans-serif"],
});

export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--ff-arabic",
  fallback: ["sans-serif"],
});

export const FONT_VARIABLES = `${playfair.variable} ${libreFranklin.variable} ${notoKufiArabic.variable}`;
