export const RESUME_TEMPLATE_IDS = ["minimal"] as const;

export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export const RESUME_TEMPLATE_DEFINITIONS = [
  { id: 'minimal', name: 'Professional ATS', version: 1 },
] as const satisfies ReadonlyArray<{
  id: ResumeTemplateId;
  name: string;
  version: number;
}>;

export const RESUME_SECTION_IDS = [
  "experience",
  "education",
  "certifications",
  "skills",
] as const;

export type ResumeSectionId = (typeof RESUME_SECTION_IDS)[number];

export type ResumeContact = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
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
  gradYear: string;
};

export type ResumeCertification = {
  id: string;
  name: string;
  org: string;
};

/** The existing dashboard draft is the application's resume content contract. */
export type ResumeContent = {
  contact: ResumeContact;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  skills: string[];
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
};

export const DEFAULT_RESUME_CUSTOMIZATION: ResumeCustomization = {
  sectionOrder: [...RESUME_SECTION_IDS],
  hiddenSections: [],
  accentColor: "#1f4e79",
  fontScale: 1,
};
