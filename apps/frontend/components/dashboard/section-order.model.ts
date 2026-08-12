import {
  DEFAULT_RESUME_CUSTOMIZATION,
  type ResumeSectionId,
} from '@shared-types/resume';

export const RESUME_STEP_IDS = [
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
] as const;

export type ResumeStepId = (typeof RESUME_STEP_IDS)[number];

const RESUME_STEP_ID_SET = new Set<string>(RESUME_STEP_IDS);

export function getResumeStepOrder(
  sectionOrder: readonly ResumeSectionId[] | null | undefined,
): ResumeStepId[] {
  const ordered = (sectionOrder ?? DEFAULT_RESUME_CUSTOMIZATION.sectionOrder)
    .filter((section): section is ResumeStepId => RESUME_STEP_ID_SET.has(section));

  return [...ordered, ...RESUME_STEP_IDS].filter(
    (section, index, sections) => sections.indexOf(section) === index,
  );
}

export function getResumeSectionOrder(
  stepOrder: readonly ResumeStepId[],
): ResumeSectionId[] {
  return getResumeStepOrder(stepOrder).flatMap((section) =>
    section === 'education' ? ['education', 'certifications'] : [section],
  );
}

export function moveResumeStep(
  stepOrder: readonly ResumeStepId[],
  section: ResumeStepId,
  destinationIndex: number,
): ResumeStepId[] {
  const ordered = getResumeStepOrder(stepOrder);
  const currentIndex = ordered.indexOf(section);
  const nextIndex = Math.max(0, Math.min(destinationIndex, ordered.length - 1));

  if (currentIndex === -1 || currentIndex === nextIndex) return ordered;

  const next = [...ordered];
  next.splice(currentIndex, 1);
  next.splice(nextIndex, 0, section);
  return next;
}
