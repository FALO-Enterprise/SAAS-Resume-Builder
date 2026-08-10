import type { ComponentType } from 'react';
import { RESUME_TEMPLATE_DEFINITIONS, type ResumeTemplateId } from '@shared-types/resume';
import { ProfessionalAtsTemplate, type ResumeTemplateProps } from './ProfessionalAtsTemplate';

export interface TemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  version: number;
  component: ComponentType<ResumeTemplateProps>;
}

const templateDefinitions: readonly TemplateDefinition[] = RESUME_TEMPLATE_DEFINITIONS.map(
  (definition) => ({ ...definition, component: ProfessionalAtsTemplate }),
);

export const resumeTemplateRegistry = new Map(
  templateDefinitions.map((template) => [template.id, template] as const),
);

export function resolveResumeTemplate(templateId: string): TemplateDefinition | null {
  return resumeTemplateRegistry.get(templateId as ResumeTemplateId) ?? null;
}
