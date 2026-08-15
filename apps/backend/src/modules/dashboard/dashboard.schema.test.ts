import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RESUME_CUSTOMIZATION } from '@resumax/shared-types';
import { dashboardDraftSchema } from './dashboard.schema';
import { toPersistenceData } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

const legacyDraft = {
    template: 'minimal',
    currentStep: 'skills',
    completedSteps: ['contact', 'experience', 'education', 'skills'],
    contact: {
        fullName: 'Legacy User',
        title: 'Developer',
        email: 'legacy@example.com',
        phone: '',
        location: 'Gaza',
        linkedin: '',
    },
    experience: [],
    education: [{
        id: 'education-1',
        institution: 'Example University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        gradYear: '2025',
    }],
    certifications: [],
    skills: ['TypeScript'],
};

test('normalizes legacy dashboard drafts with additive resume defaults', () => {
    const parsed = dashboardDraftSchema.parse(legacyDraft);

    assert.equal(parsed.summary, '');
    assert.deepEqual(parsed.skillGroups, []);
    assert.deepEqual(parsed.projects, []);
    assert.deepEqual(parsed.sectionOrder, DEFAULT_RESUME_CUSTOMIZATION.sectionOrder);
    assert.equal(parsed.contact.github, '');
    assert.equal(parsed.contact.portfolio, '');
    assert.deepEqual(parsed.education[0], {
        ...legacyDraft.education[0],
        location: '',
        country: '',
        startMonth: '',
        startYear: '',
        endMonth: '',
        endYear: '',
        current: false,
    });
    assert.deepEqual(parsed.skills, ['TypeScript']);
});

test('maps expanded resume content to dashboard persistence fields', () => {
    const parsed = dashboardDraftSchema.parse({
        ...legacyDraft,
        currentStep: 'projects',
        completedSteps: ['contact', 'summary', 'skills', 'experience', 'projects'],
        summary: 'Backend engineer focused on reliable web applications.',
        sectionOrder: ['experience', 'projects', 'skills', 'summary', 'education', 'certifications'],
        skillGroups: [{ id: 'group-1', label: 'Languages', skills: ['TypeScript', 'Python'] }],
        projects: [{
            id: 'project-1',
            name: 'ResuMax',
            technologies: ['Next.js', 'PostgreSQL'],
            link: 'https://example.com/resumax',
            startMonth: 'April',
            startYear: '2026',
            description: 'Built an ATS-friendly resume workflow.',
        }],
    });
    const persistence = toPersistenceData(parsed);

    assert.equal(persistence.currentStep, 'projects');
    assert.equal(persistence.summary, parsed.summary);
    assert.deepEqual(persistence.sectionOrder, parsed.sectionOrder);
    assert.deepEqual(persistence.skillGroups, parsed.skillGroups);
    assert.deepEqual(persistence.projects, parsed.projects);
});

test('normalizes persisted legacy drafts on read while preserving record metadata', async () => {
    const stored = {
        id: 'draft-1',
        userId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        ...legacyDraft,
    };
    const service = new DashboardService({
        async findByUserId() { return structuredClone(stored); },
        async upsert() { throw new Error('unused'); },
    });

    const result = await service.getDraft({ id: 'user-1', email: 'legacy@example.com' });

    assert.equal('id' in result ? result.id : undefined, 'draft-1');
    assert.equal(result.summary, '');
    assert.deepEqual(result.skillGroups, []);
    assert.deepEqual(result.projects, []);
    assert.deepEqual(result.sectionOrder, DEFAULT_RESUME_CUSTOMIZATION.sectionOrder);
    assert.equal(result.contact.github, '');
    assert.equal(result.education[0]?.location, '');
});

test('returns defaults when persisted dashboard draft cannot be validated', async () => {
    const stored = {
        id: 'draft-invalid',
        userId: 'user-2',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        template: 'minimal',
        currentStep: 'contact',
        completedSteps: ['contact'],
        sectionOrder: DEFAULT_RESUME_CUSTOMIZATION.sectionOrder,
        contact: {},
        summary: null,
        skillGroups: null,
        experience: null,
        projects: null,
        education: null,
        certifications: null,
        skills: null,
    } as any;
    const service = new DashboardService({
        async findByUserId() { return structuredClone(stored); },
        async upsert() { throw new Error('unused'); },
    });

    const result = await service.getDraft({ id: 'user-2', email: 'fallback@example.com' });

    assert.equal(result.contact.email, 'fallback@example.com');
    assert.deepEqual(result.experience, []);
    assert.deepEqual(result.projects, []);
    assert.deepEqual(result.education, []);
    assert.deepEqual(result.certifications, []);
    assert.deepEqual(result.skills, []);
});

test('rejects duplicate resume section ids', () => {
    const result = dashboardDraftSchema.safeParse({
        ...legacyDraft,
        sectionOrder: ['summary', 'summary'],
    });

    assert.equal(result.success, false);
});
