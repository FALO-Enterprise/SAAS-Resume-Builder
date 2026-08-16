/**
 * Stable template identifiers shared by the dashboard, API validation,
 * preview renderer, and PDF/JPG export pipeline.
 *
 * Keep gallery identifiers here even while a layout is being rolled out so a
 * selection never becomes an API value that the backend cannot validate.
 */
export const RESUME_TEMPLATE_IDS = [
  "executive",
  "developer",
  "director",
  "minimal",
  "academic",
  "global",
] as const;

export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export const RESUME_TEMPLATE_DEFINITIONS = [
  { id: "executive", name: "Executive Teal", version: 1 },
  { id: "developer", name: "Developer Sidebar", version: 1 },
  { id: "director", name: "Creative Director", version: 1 },
  { id: "minimal", name: "Classic ATS", version: 3 },
  { id: "academic", name: "Academic CV", version: 1 },
  { id: "global", name: "Global Professional", version: 1 },
] as const satisfies ReadonlyArray<{
  id: ResumeTemplateId;
  name: string;
  version: number;
}>;

export const RESUME_SECTION_IDS = [
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
] as const;

export type ResumeSectionId = (typeof RESUME_SECTION_IDS)[number];

export type ResumeContact = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

export type ResumeExperience = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  current: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  description: string;
};

export type ResumeEducation = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  country: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  /** Retained for compatibility with existing dashboard drafts. */
  gradYear: string;
};

export type ResumeCertification = {
  id: string;
  name: string;
  org: string;
};

export type ResumeSkillGroup = {
  id: string;
  label: string;
  skills: string[];
};

export type ResumeProject = {
  id: string;
  name: string;
  technologies: string[];
  link: string;
  startMonth: string;
  startYear: string;
  description: string;
};

/** The existing dashboard draft is the application's resume content contract. */
export type ResumeContent = {
  contact: ResumeContact;
  summary: string;
  skillGroups: ResumeSkillGroup[];
  /** Retained as a flat fallback for existing dashboard drafts and AI output. */
  skills: string[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
};

export type ResumeCustomization = {
  sectionOrder: ResumeSectionId[];
  hiddenSections: ResumeSectionId[];
  accentColor: string;
  fontScale: number;
};

export type ResumeRenderSnapshot = {
  resumeId: string;
  title: string;
  templateId: ResumeTemplateId;
  templateVersion: number;
  content: ResumeContent;
  customization: ResumeCustomization;
  createdAt: string;
  hasWatermark?: boolean;
};

export const TEMPLATE_PLAN_CONFIG: Record<ResumeTemplateId, { requiredPlan: "FREE" | "PRO" | "ENTERPRISE"; badgeText: string; isFreeCompatible: boolean }> = {
  minimal: { requiredPlan: "FREE", badgeText: "Free & Pro", isFreeCompatible: true },
  developer: { requiredPlan: "PRO", badgeText: "Pro & Enterprise", isFreeCompatible: false },
  executive: { requiredPlan: "PRO", badgeText: "Pro & Enterprise", isFreeCompatible: false },
  director: { requiredPlan: "PRO", badgeText: "Pro & Enterprise", isFreeCompatible: false },
  academic: { requiredPlan: "PRO", badgeText: "Pro & Enterprise", isFreeCompatible: false },
  global: { requiredPlan: "PRO", badgeText: "Pro & Enterprise", isFreeCompatible: false },
};

export const DEFAULT_RESUME_CUSTOMIZATION: ResumeCustomization = {
  sectionOrder: [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
  ],
  hiddenSections: [],
  accentColor: "#0563c1",
  fontScale: 1,
};