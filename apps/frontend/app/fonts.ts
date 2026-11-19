import {
  Noto_Kufi_Arabic,
  Bricolage_Grotesque,
  Martian_Mono,
} from "next/font/google";

export const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--ff-arabic",
  fallback: ["sans-serif"],
});

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-bricolage",
});

export const martianMono = Martian_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--ff-martian",
});

export const FONT_VARIABLES = `${notoKufiArabic.variable} ${bricolage.variable} ${martianMono.variable}`;
