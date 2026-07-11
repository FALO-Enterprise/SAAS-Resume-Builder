export type StepId = 'contact' | 'experience' | 'education' | 'skills';

export type ContactData = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

export type ExperienceItem = {
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
}

export type EducationItem = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  gradYear: string;
}

export type CertItem = {
  id: string;
  name: string;
  org: string;
}