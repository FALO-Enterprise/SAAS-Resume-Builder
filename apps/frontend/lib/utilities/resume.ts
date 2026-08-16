import type {
  ExperienceItem,
  EducationItem,
  CertItem,
  ProjectItem,
  SkillGroupItem,
} from '../types/dashboard.types';

export const emptyRole = (): ExperienceItem => ({
  id: crypto.randomUUID(),
  jobTitle: '',
  company: '',
  location: '',
  current: false,
  startMonth: '',
  startYear: '',
  endMonth: '',
  endYear: '',
  description: '',
});

export const emptyEdu = (): EducationItem => ({
  id: crypto.randomUUID(),
  institution: '',
  degree: '',
  field: '',
  location: '',
  country: '',
  startMonth: '',
  startYear: '',
  endMonth: '',
  endYear: '',
  current: false,
  gradYear: '',
});

export const emptyCert = (): CertItem => ({
  id: crypto.randomUUID(),
  name: '',
  org: '',
});

export const emptyProject = (): ProjectItem => ({
  id: crypto.randomUUID(),
  name: '',
  technologies: [],
  link: '',
  startMonth: '',
  startYear: '',
  description: '',
});

export const emptySkillGroup = (label: string = ''): SkillGroupItem => ({
  id: crypto.randomUUID(),
  label,
  skills: [],
});

export const defaultSkillGroups = (): SkillGroupItem[] => [
  emptySkillGroup('Technical Skills'),
  emptySkillGroup('Soft Skills'),
];