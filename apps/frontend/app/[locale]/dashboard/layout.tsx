import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

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
    redirect(`/${locale}`);
  }

  return <>{children}</>;
}
