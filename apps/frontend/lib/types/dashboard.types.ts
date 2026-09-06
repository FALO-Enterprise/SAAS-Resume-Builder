export type StepId = 'contact' | 'summary' | 'skills' | 'experience' | 'projects' | 'education';

import type {
  ResumeCertification,
  ResumeContact,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  ResumeSectionId,
  ResumeSkillGroup,
} from '@shared-types/resume';

export type ContactData = ResumeContact;
export type ExperienceItem = ResumeExperience;
export type EducationItem = ResumeEducation;
export type CertItem = ResumeCertification;
export type ProjectItem = ResumeProject;
export type SkillGroupItem = ResumeSkillGroup;

export type DashboardDraftData = {
  id?: string;
  template: string | null;
  purpose?: string;
  currentStep: StepId;
  completedSteps: StepId[];
  sectionOrder: ResumeSectionId[];
  contact: ContactData;
  summary: string;
  skillGroups: SkillGroupItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertItem[];
  skills: string[];
  updatedAt?: string;
}
