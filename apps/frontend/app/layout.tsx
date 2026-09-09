import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { FONT_VARIABLES } from "@/app/fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { PREFERENCES_INIT_SCRIPT } from "@/lib/preferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResuMax — Trusted. Global. Effortless.",
  description: "Build world-class resumes & CVs that follow global standards.",
};

const BOOT_SCRIPT = `${THEME_INIT_SCRIPT}${PREFERENCES_INIT_SCRIPT}`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const isArabic = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`scroll-smooth ${FONT_VARIABLES}`}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }}
        />
      </head>
      <body className={isArabic ? "font-arabic" : ""}>{children}</body>
    </html>
  );
}
