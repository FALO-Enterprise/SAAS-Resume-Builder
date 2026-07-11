import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResuMax — Trusted. Global. Effortless.",
  description: "Build world-class resumes & CVs that follow global standards.",
};

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
    >
      <body className={isArabic ? "font-arabic" : ""}>{children}</body>
    </html>
  );
}
