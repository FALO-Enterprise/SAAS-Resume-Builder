import {
  DEFAULT_RESUME_CUSTOMIZATION,
  RESUME_SECTION_IDS,
  type ResumeContent,
  type ResumeCustomization,
  type ResumeSectionId,
} from '@shared-types/resume';

function hasSectionValue(value: unknown): boolean {
  if (typeof value === 'string') return Boolean(value.trim());
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some((item) => typeof item === 'string' && Boolean(item.trim()));
}

export function getVisibleSectionOrder(
  resume: ResumeContent,
  customization?: Partial<ResumeCustomization>,
): ResumeSectionId[] {
  const configuredOrder = customization?.sectionOrder ?? DEFAULT_RESUME_CUSTOMIZATION.sectionOrder;
  const hidden = new Set(customization?.hiddenSections ?? DEFAULT_RESUME_CUSTOMIZATION.hiddenSections);
  const ordered = [...configuredOrder, ...RESUME_SECTION_IDS].filter(
    (section, index, sections) => sections.indexOf(section) === index,
  );

  return ordered.filter((section) => !hidden.has(section) && resume[section].some(hasSectionValue));
}
