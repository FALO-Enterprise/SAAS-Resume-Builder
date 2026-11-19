import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import VerifiedRouteGuard from "@/components/auth/VerifiedRouteGuard";
import { DashboardSkeleton } from "@/components/ui/Skeletons";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await verifySession();

  if (!session) {
    redirect(`/${locale}?message=login-required-dashboard`);
  }

  // The session cookie proves a login, not a verified account — the JWT
  // carries no `isVerified` claim, so that half of the gate runs on the client.
  return (
    <VerifiedRouteGuard area="dashboard" fallback={<DashboardSkeleton />}>
      {children}
    </VerifiedRouteGuard>
  );
}
