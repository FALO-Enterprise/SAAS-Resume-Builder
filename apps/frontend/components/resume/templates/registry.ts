import type { ComponentType } from 'react';
import { RESUME_TEMPLATE_DEFINITIONS, type ResumeTemplateId } from '@shared-types/resume';
import { ProfessionalAtsTemplate, type ResumeTemplateProps } from './ProfessionalAtsTemplate';
import { ExecutiveTealTemplate } from './ExecutiveTealTemplate';
import { DeveloperSidebarTemplate } from './DeveloperSidebarTemplate';
import { CreativeDirectorTemplate } from './CreativeDirectorTemplate';
import { AcademicCvTemplate } from './AcademicCvTemplate';
import { GlobalProfessionalTemplate } from './GlobalProfessionalTemplate';

export interface TemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  version: number;
  component: ComponentType<ResumeTemplateProps>;
}

const templateComponents: Record<ResumeTemplateId, ComponentType<ResumeTemplateProps>> = {
  executive: ExecutiveTealTemplate,
  developer: DeveloperSidebarTemplate,
  director: CreativeDirectorTemplate,
  minimal: ProfessionalAtsTemplate,
  academic: AcademicCvTemplate,
  global: GlobalProfessionalTemplate,
};

export const resumeTemplateDefinitions: readonly TemplateDefinition[] =
  RESUME_TEMPLATE_DEFINITIONS.map((definition) => ({
    ...definition,
    component: templateComponents[definition.id],
  }));

export const resumeTemplateRegistry = new Map(
  resumeTemplateDefinitions.map((template) => [template.id, template] as const),
);

export function resolveResumeTemplate(templateId: string): TemplateDefinition | null {
  return resumeTemplateRegistry.get(templateId as ResumeTemplateId) ?? null;
}
