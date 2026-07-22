import type { ExperienceItem, EducationItem, CertItem } from '../types/dashborad.types';

export const emptyRole = (): ExperienceItem => ({
  id: crypto.randomUUID(),
  jobTitle: '', company: '', location: '', current: false,
  startMonth: '', startYear: '', endMonth: '', endYear: '', description: '',
});

export const emptyEdu = (): EducationItem => ({
  id: crypto.randomUUID(),
  institution: '', degree: '', field: '', gradYear: '',
});

export const emptyCert = (): CertItem => ({
  id: crypto.randomUUID(),
  name: '', org: '',
});