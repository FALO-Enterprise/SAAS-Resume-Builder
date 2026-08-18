import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { PREFERENCES_INIT_SCRIPT } from "@/lib/preferences";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResuMax — Trusted. Global. Effortless.",
  description: "Build world-class resumes & CVs that follow global standards.",
};

// Theme and reduce-motion both have to be on <html> before the first paint —
// one to avoid a flash of the wrong theme, the other to stop mount animations
// running for someone who asked not to see them.
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
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Must stay a plain inline script: next/script `beforeInteractive`
            defers through Next's bootstrap and runs too late to prevent the
            flash it is meant to avoid. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }}
        />
      </head>
      <body className={isArabic ? "font-arabic" : ""}>{children}</body>
    </html>
  );
}
