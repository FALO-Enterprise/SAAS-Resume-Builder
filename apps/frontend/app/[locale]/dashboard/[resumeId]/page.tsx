import DashboardPage from "../page";

interface DashboardStandalonePageProps {
  params: Promise<{
    locale: string;
    resumeId: string;
  }>;
}

export default async function DashboardStandalonePage({
  params,
}: DashboardStandalonePageProps) {
  const { resumeId } = await params;
  return <DashboardPage resumeIdProp={resumeId} />;
}

