import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  if (!session) {
    redirect("/en");
  }

  return <>{children}</>;
}
