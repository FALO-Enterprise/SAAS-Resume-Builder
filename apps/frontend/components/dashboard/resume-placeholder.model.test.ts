import assert from 'node:assert/strict';
import test from 'node:test';
import type { StepId } from '@/lib/types/dashboard.types';
import {
  getResumePlaceholderSections,
  RESUME_PLACEHOLDER_SECTION_IDS,
} from './resume-placeholder.model';

const expectedSections: StepId[] = [
  'contact',
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
];

test('resume placeholder includes every dashboard section in document order', () => {
  assert.deepEqual([...RESUME_PLACEHOLDER_SECTION_IDS], expectedSections);
});

for (const currentStep of expectedSections) {
  test(`resume placeholder highlights only the ${currentStep} section`, () => {
    const sections = getResumePlaceholderSections(currentStep);
    const activeSections = sections.filter((section) => section.active);

    assert.equal(sections.length, expectedSections.length);
    assert.deepEqual(activeSections, [{ id: currentStep, active: true }]);
  });
}
