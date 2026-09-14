import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import VerifiedRouteGuard from "@/components/auth/VerifiedRouteGuard";

export default async function DraftsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await verifySession();

  if (!session) {
    redirect(`/${locale}?message=login-required-drafts`);
  }

  return <VerifiedRouteGuard area="drafts">{children}</VerifiedRouteGuard>;
}
