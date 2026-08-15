import { redirect } from "next/navigation";

export default async function LegacyGetStartedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale === "ar" ? "ar" : "en"}/createaccount`);
}
