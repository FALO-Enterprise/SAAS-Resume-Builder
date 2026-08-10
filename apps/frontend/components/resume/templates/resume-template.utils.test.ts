import test from 'node:test';
import assert from 'node:assert/strict';
import type { ResumeContent } from '@shared-types/resume';
import { getVisibleSectionOrder } from './resume-template.utils';

const realisticResume: ResumeContent = {
  contact: {
    fullName: 'Alexandra Morgan-Santiago',
    title: 'Senior Platform Engineering and Reliability Lead',
    email: 'alexandra.morgan@example.com',
    phone: '',
    location: 'Washington, DC',
    linkedin: 'https://www.linkedin.com/in/alexandra-morgan-santiago-with-a-very-long-profile-url',
  },
  experience: [
    { id: 'exp-1', jobTitle: 'Senior Platform Engineer', company: 'Example Corporation', location: 'Remote', current: true, startMonth: 'January', startYear: '2021', endMonth: '', endYear: '', description: 'Long accomplishment text. '.repeat(60) },
    { id: 'exp-2', jobTitle: 'Software Engineer', company: 'Previous Company', location: '', current: false, startMonth: 'June', startYear: '2017', endMonth: 'December', endYear: '2020', description: 'Additional multi-page fixture content. '.repeat(50) },
  ],
  education: [
    { id: 'edu-1', institution: 'State University', degree: 'Master of Science', field: 'Computer Science', gradYear: '2017' },
    { id: 'edu-2', institution: 'City College', degree: 'Bachelor of Science', field: 'Information Systems', gradYear: '2015' },
  ],
  certifications: [],
  skills: ['TypeScript', 'Distributed Systems', 'Technical Leadership'],
};

test('missing optional resume sections are omitted', () => {
  assert.deepEqual(getVisibleSectionOrder({ ...realisticResume, experience: [], education: [], certifications: [], skills: [] }), []);
});

test('hidden sections are not included in the rendered section sequence', () => {
  assert.deepEqual(
    getVisibleSectionOrder(realisticResume, { hiddenSections: ['experience'] }),
    ['education', 'skills'],
  );
});

test('configured section order is preserved while empty sections stay hidden', () => {
  assert.deepEqual(
    getVisibleSectionOrder(realisticResume, { sectionOrder: ['skills', 'education', 'certifications', 'experience'] }),
    ['skills', 'education', 'experience'],
  );
});
