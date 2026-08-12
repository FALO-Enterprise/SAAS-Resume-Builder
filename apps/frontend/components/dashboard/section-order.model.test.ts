import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_RESUME_CUSTOMIZATION } from '@shared-types/resume';
import {
  getResumeSectionOrder,
  getResumeStepOrder,
  moveResumeStep,
} from './section-order.model';

test('uses the default resume order when a legacy draft has no saved order', () => {
  assert.deepEqual(
    getResumeSectionOrder(getResumeStepOrder(undefined)),
    DEFAULT_RESUME_CUSTOMIZATION.sectionOrder,
  );
});

test('keeps certifications attached to education when cards are reordered', () => {
  assert.deepEqual(
    getResumeSectionOrder(['education', 'summary', 'experience', 'skills', 'projects']),
    ['education', 'certifications', 'summary', 'experience', 'skills', 'projects'],
  );
});

test('deduplicates saved values and restores missing resume steps', () => {
  assert.deepEqual(
    getResumeStepOrder(['projects', 'summary', 'projects']),
    ['projects', 'summary', 'skills', 'experience', 'education'],
  );
});

test('moves a card and clamps keyboard destinations to the list boundaries', () => {
  const order = ['summary', 'skills', 'experience', 'projects', 'education'] as const;

  assert.deepEqual(
    moveResumeStep(order, 'experience', 0),
    ['experience', 'summary', 'skills', 'projects', 'education'],
  );
  assert.deepEqual(
    moveResumeStep(order, 'summary', -1),
    [...order],
  );
  assert.deepEqual(
    moveResumeStep(order, 'summary', 99),
    ['skills', 'experience', 'projects', 'education', 'summary'],
  );
});
