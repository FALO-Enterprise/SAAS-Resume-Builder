import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalDocumentPage from "@/components/ui/legal/LegalDocumentPage";
import { LEGAL_MESSAGE_KEYS, LEGAL_ROUTES } from "@/lib/legal";
import { routing } from "@/i18n/routing";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: LEGAL_MESSAGE_KEYS.privacy,
  });

  const title = `${t("title")} — ResuMax`;
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${LEGAL_ROUTES.privacy}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/${LEGAL_ROUTES.privacy}`]),
      ),
    },
    openGraph: { title, description, type: "article" },
  };
}

export default async function PrivacyPage({ params }: Params) {
  const { locale } = await params;
  return <LegalDocumentPage slug="privacy" locale={locale} />;
}
