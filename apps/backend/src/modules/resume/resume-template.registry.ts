import { RESUME_TEMPLATE_DEFINITIONS, RESUME_TEMPLATE_IDS, type ResumeTemplateId } from '@resumax/shared-types';

export type ResumeTemplateDefinition = {
    id: ResumeTemplateId;
    name: string;
    version: number;
};

export const resumeTemplateRegistry = new Map(
    RESUME_TEMPLATE_DEFINITIONS.map((definition) => [definition.id, definition] as const),
);

export function resolveResumeTemplate(templateId: string): ResumeTemplateDefinition | null {
    if (!RESUME_TEMPLATE_IDS.includes(templateId as ResumeTemplateId)) return null;
    return resumeTemplateRegistry.get(templateId as ResumeTemplateId) ?? null;
}
