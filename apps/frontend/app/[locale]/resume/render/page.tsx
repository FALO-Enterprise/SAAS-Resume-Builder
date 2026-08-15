import type { ResumeRenderSnapshot } from '@shared-types/resume';
import { resolveResumeTemplate } from '@/components/resume/templates/registry';

type RenderPageProps = {
  searchParams: Promise<{ token?: string }>;
};

async function loadSnapshot(token: string): Promise<ResumeRenderSnapshot> {
  const backendUrl = (process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001').replace(/\/$/, '');
  const response = await fetch(`${backendUrl}/api/resumes/render/${encodeURIComponent(token)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const payload: unknown = await response.json();
  if (!response.ok || !payload || typeof payload !== 'object' || !('success' in payload)) {
    throw new Error('Resume render snapshot is unavailable');
  }
  const result = payload as { success: boolean; data?: ResumeRenderSnapshot };
  if (!result.success || !result.data) throw new Error('Resume render snapshot is unavailable');
  return result.data;
}

export default async function ResumeRenderPage({ searchParams }: RenderPageProps) {
  const { token } = await searchParams;
  if (!token) throw new Error('Resume render token is required');

  const snapshot = await loadSnapshot(token);
  const template = resolveResumeTemplate(snapshot.templateId);
  if (!template || template.version !== snapshot.templateVersion) {
    throw new Error('Resume template is unavailable');
  }
  const Template = template.component;

  return (
    <main data-resume-render-ready="true">
      <Template resume={snapshot.content} customization={snapshot.customization} />
    </main>
  );
}
