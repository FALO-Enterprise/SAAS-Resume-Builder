import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveResumeTemplate } from './resume-template.registry';
import { resumeExportSchema } from './resume-export.schema';

test('resolves the stable Professional ATS template definition', () => {
    assert.deepEqual(resolveResumeTemplate('minimal'), {
        id: 'minimal',
        name: 'Professional ATS',
        version: 1,
    });
});

test('returns null for an invalid template id', () => {
    assert.equal(resolveResumeTemplate('not-a-template'), null);
    assert.equal(resumeExportSchema.safeParse({ templateId: 'not-a-template' }).success, false);
});
