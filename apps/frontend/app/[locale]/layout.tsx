import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthModal from "@/components/auth/AuthModal";
import HtmlDirSync from "@/components/ui/HtmlDirSync";

export const metadata: Metadata = {
  title: "ResuMax — Trusted. Global. Effortless.",
  description:
    "Build world-class resumes & CVs that follow global standards, trusted by professionals across every industry.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlDirSync />
      <ThemeProvider>
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
