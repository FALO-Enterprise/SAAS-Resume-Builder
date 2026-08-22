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
    namespace: LEGAL_MESSAGE_KEYS.terms,
  });

  const title = `${t("title")} — ResuMax`;
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${LEGAL_ROUTES.terms}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/${LEGAL_ROUTES.terms}`]),
      ),
    },
    openGraph: { title, description, type: "article" },
  };
}

export default async function TermsPage({ params }: Params) {
  const { locale } = await params;
  return <LegalDocumentPage slug="terms" locale={locale} />;
}
