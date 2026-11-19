import {
  DEFAULT_RESUME_CUSTOMIZATION,
  RESUME_SECTION_IDS,
  type ResumeContent,
  type ResumeCustomization,
  type ResumeSectionId,
} from "@shared-types/resume";

function hasSectionValue(value: unknown): boolean {
  if (typeof value === "string") return Boolean(value.trim());
  if (Array.isArray(value)) return value.some(hasSectionValue);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some(hasSectionValue);
}

export function getVisibleSectionOrder(
  resume: ResumeContent,
  customization?: Partial<ResumeCustomization>,
): ResumeSectionId[] {
  const configuredOrder =
    customization?.sectionOrder ?? DEFAULT_RESUME_CUSTOMIZATION.sectionOrder;
  const hidden = new Set(
    customization?.hiddenSections ??
      DEFAULT_RESUME_CUSTOMIZATION.hiddenSections,
  );
  const ordered = [...configuredOrder, ...RESUME_SECTION_IDS].filter(
    (section, index, sections) => sections.indexOf(section) === index,
  );

  return ordered.filter((section) => {
    if (hidden.has(section)) return false;
    if (section === "skills") {
      return (
        hasSectionValue(resume.skillGroups) || hasSectionValue(resume.skills)
      );
    }
    return hasSectionValue(resume[section]);
  });
}

export function getDescriptionItems(description: string): string[] {
  return description
    .split(/\r?\n/)
    .map((line) =>
      line.replace(/^\s*(?:[-\u2013\u2014\u2022*]|\d+[.)])\s*/, "").trim(),
    )
    .filter(Boolean);
}
