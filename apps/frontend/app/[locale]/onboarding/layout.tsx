import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await verifySession();

  if (!session) {
    const { locale } = await params;
    redirect(`/${locale === "ar" ? "ar" : "en"}`);
  }

  return <>{children}</>;
}
