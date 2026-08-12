import type { StepId } from '@/lib/types/dashborad.types';

export const RESUME_PLACEHOLDER_SECTION_IDS = [
  'contact',
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
] as const satisfies readonly StepId[];

export function getResumePlaceholderSections(currentStep: StepId) {
  return RESUME_PLACEHOLDER_SECTION_IDS.map((id) => ({
    id,
    active: id === currentStep,
  }));
}
