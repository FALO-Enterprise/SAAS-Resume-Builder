export type SurveyPurpose =
  | ''
  | 'firstResume'
  | 'newJob'
  | 'internship'
  | 'careerChange';

export type ExperienceLevel = '' | 'none' | 'junior' | 'mid' | 'senior';

export type CareerField =
  | ''
  | 'technology'
  | 'design'
  | 'business'
  | 'finance'
  | 'health'
  | 'education'
  | 'engineering'
  | 'other';

export type ResumeTemplateChoice =
  | ''
  | 'minimal'
  | 'global'
  | 'executive'
  | 'academic'
  | 'developer'
  | 'director';

export type EducationLevel =
  | ''
  | 'highSchool'
  | 'diploma'
  | 'bachelor'
  | 'master'
  | 'doctorate';

export type OnboardingData = {
  purpose: SurveyPurpose;
  experienceLevel: ExperienceLevel;
  field: CareerField;
  targetRole: string;
  customTargetRole: string;
  educationLevel: EducationLevel;
  skills: string[];
  template: ResumeTemplateChoice;
};
