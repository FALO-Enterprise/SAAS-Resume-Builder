import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import AuthModal from "@/components/auth/AuthModal";
import HtmlDirSync from "@/components/ui/HtmlDirSync";
import { Toaster } from "sonner";
import RouteNotification from "@/components/ui/Notifications";
import Providers from "@/app/providers";

export const metadata: Metadata = {
  title: "Resumax AI — Trusted. Global. Effortless.",
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
    <Providers>
      <NextIntlClientProvider messages={messages}>
        <HtmlDirSync />
        <ThemeProvider>
          <AuthProvider>
            <PreferencesProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  classNames: {
                    toast:
                      "rounded-lg! border! border-edge-strong! bg-elevated! text-primary! shadow-(--lp-shadow)! font-sans!",
                    description: "text-secondary!",
                    success: "border-s-4! border-s-pass!",
                    error: "border-s-4! border-s-flag!",
                    warning: "border-s-4! border-s-accent!",
                    info: "border-s-4! border-s-accent!",
                    actionButton: "rounded-lg! bg-lp-tag! text-lp-on-tag!",
                    closeButton: "border-edge-strong! bg-elevated! text-primary!",
                  },
                }}
                closeButton
              />
              <Suspense fallback={null}>
                <RouteNotification />
              </Suspense>
              {children}
              <AuthModal />
            </PreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </Providers>
  );
}
