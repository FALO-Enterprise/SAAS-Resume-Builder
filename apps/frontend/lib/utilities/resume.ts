import type {
  CertItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  SkillGroupItem,
} from '../types/dashboard.types';

export const emptyRole = (): ExperienceItem => ({
  id: crypto.randomUUID(),
  jobTitle: '', company: '', location: '', current: false,
  startMonth: '', startYear: '', endMonth: '', endYear: '', description: '',
});

export const emptyEdu = (): EducationItem => ({
  id: crypto.randomUUID(),
  institution: '', degree: '', field: '', gradYear: '', location: '', country: '',
  startMonth: '', startYear: '', endMonth: '', endYear: '', current: false,
});

export const emptyCert = (): CertItem => ({
  id: crypto.randomUUID(),
  name: '', org: '',
});

export const emptyProject = (): ProjectItem => ({
  id: crypto.randomUUID(),
  name: '', technologies: [], link: '', startMonth: '', startYear: '', description: '',
});

export const emptySkillGroup = (label = ''): SkillGroupItem => ({
  id: crypto.randomUUID(),
  label,
  skills: [],
});

export const defaultSkillGroups = (): SkillGroupItem[] => [
  emptySkillGroup('Frontend'),
  emptySkillGroup('Backend'),
  emptySkillGroup('Tools'),
  emptySkillGroup('Other Skills'),
];
