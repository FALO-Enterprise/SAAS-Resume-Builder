export type StepId = 'contact' | 'experience' | 'education' | 'skills';

import type {
  ResumeCertification,
  ResumeContact,
  ResumeEducation,
  ResumeExperience,
} from '@shared-types/resume';

export type ContactData = ResumeContact;
export type ExperienceItem = ResumeExperience;
export type EducationItem = ResumeEducation;
export type CertItem = ResumeCertification;

export type DashboardDraftData = {
  id?: string;
  template: string | null;
  currentStep: StepId;
  completedSteps: StepId[];
  contact: ContactData;
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertItem[];
  skills: string[];
  updatedAt?: string;
}
