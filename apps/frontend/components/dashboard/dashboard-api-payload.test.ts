import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_RESUME_CUSTOMIZATION } from '@shared-types/resume';

import { createDashboardDraftPayload } from '@/lib/backend';
import type { DashboardDraftData } from '@/lib/types/dashboard.types';

test('dashboard save payload includes every field consumed by resume generation', () => {
  const draft: DashboardDraftData = {
    id: 'draft-1',
    template: 'developer',
    currentStep: 'education',
    completedSteps: ['contact', 'summary', 'skills', 'experience', 'projects', 'education'],
    sectionOrder: [...DEFAULT_RESUME_CUSTOMIZATION.sectionOrder].reverse(),
    contact: {
      fullName: 'Alex Morgan',
      title: 'Engineer',
      email: 'alex@example.com',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
    },
    summary: 'A focused professional summary.',
    skillGroups: [{ id: 'group-1', label: 'Languages', skills: ['TypeScript'] }],
    experience: [],
    projects: [{
      id: 'project-1',
      name: 'Resume Builder',
      technologies: ['Next.js'],
      link: '',
      startMonth: '',
      startYear: '',
      description: 'Built a resume application.',
    }],
    education: [],
    certifications: [],
    skills: ['TypeScript'],
    updatedAt: '2026-08-13T00:00:00.000Z',
  };

  const payload = createDashboardDraftPayload(draft);

  assert.deepEqual(payload.sectionOrder, draft.sectionOrder);
  assert.equal(payload.summary, draft.summary);
  assert.deepEqual(payload.skillGroups, draft.skillGroups);
  assert.deepEqual(payload.projects, draft.projects);
  assert.equal('id' in payload, false);
  assert.equal('updatedAt' in payload, false);
});
