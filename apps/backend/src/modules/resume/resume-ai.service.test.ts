import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { DEFAULT_RESUME_CUSTOMIZATION } from '@resumax/shared-types';
import type { DashboardDraftDTO } from '../dashboard/dashboard.schema';
import type { ResumeAiGenerator } from './ai/resume-ai-generator';
import { ResumeAiGenerationError, ResumeAiService } from './resume-ai.service';
import { ResumeController } from './resume.controller';
import { GeminiAiProviderError } from './ai/gemini-resume-ai.generator';

const draft: DashboardDraftDTO = {
    template: 'minimal',
    currentStep: 'skills',
    completedSteps: ['contact', 'experience', 'education', 'skills'],
    sectionOrder: [...DEFAULT_RESUME_CUSTOMIZATION.sectionOrder],
    contact: {
        fullName: 'Alexandra Morgan',
        title: 'Developer',
        email: 'alexandra@example.com',
        phone: '+1 202 555 0199',
        location: 'Washington, DC',
        linkedin: 'https://www.linkedin.com/in/alexandra-morgan',
        github: 'https://github.com/alexandra-morgan',
        portfolio: 'https://alexandra.example.com',
    },
    summary: 'Platform engineer focused on reliable services.',
    skillGroups: [{ id: 'skill-group-1', label: 'Languages', skills: ['TypeScript'] }],
    experience: [{
        id: 'experience-1',
        jobTitle: 'Platform Engineer',
        company: 'Example Corporation',
        location: 'Remote',
        current: true,
        startMonth: 'January',
        startYear: '2021',
        endMonth: '',
        endYear: '',
        description: 'Built services.',
    }],
    education: [{
        id: 'education-1',
        institution: 'State University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        location: 'Washington, DC',
        country: 'United States',
        startMonth: 'September',
        startYear: '2016',
        endMonth: 'May',
        endYear: '2020',
        current: false,
        gradYear: '2020',
    }],
    projects: [{
        id: 'project-1',
        name: 'Reliability Dashboard',
        technologies: ['TypeScript'],
        link: 'https://example.com/reliability-dashboard',
        startMonth: 'March',
        startYear: '2020',
        description: 'Visualized service health.',
    }],
    certifications: [{ id: 'certification-1', name: 'Cloud Certification', org: 'Example Org' }],
    skills: ['TypeScript'],
};

function createService(options?: { missingDraft?: boolean; generatorError?: Error }) {
    let savedDraft: DashboardDraftDTO | undefined;
    let requestedUserId = '';
    let generatedUserId = '';

    const dashboardRepository = {
        async findByUserId(userId: string) {
            requestedUserId = userId;
            return options?.missingDraft ? null : structuredClone(draft);
        },
        async upsert(_userId: string, nextDraft: DashboardDraftDTO) {
            savedDraft = structuredClone(nextDraft);
            return nextDraft;
        },
    };
    const resumeRepository = {
        async upsertForUser(title: string, templateId: string, _templateName: string, userId: string) {
            return { id: 'resume-1', title, templateId, userId, createdAt: new Date(), updatedAt: new Date() };
        },
    };
    const generator: ResumeAiGenerator = {
        async enhance(_content, userId) {
            generatedUserId = userId;
            if (options?.generatorError) throw options.generatorError;
            return {
                professionalTitle: 'Senior Platform Engineer',
                experiences: [
                    { id: 'experience-1', description: 'Built reliable TypeScript services.' },
                    { id: 'unknown-id', description: 'This must not be merged.' },
                ],
                skills: ['TypeScript', ' Distributed Systems ', 'typescript'],
            };
        },
    };

    return {
        service: new ResumeAiService(dashboardRepository, resumeRepository, generator),
        getSavedDraft: () => savedDraft,
        getRequestedUserId: () => requestedUserId,
        getGeneratedUserId: () => generatedUserId,
    };
}

test('enhances supported resume text while preserving factual dashboard data', async () => {
    const fixture = createService();
    const resume = await fixture.service.generate('owner-1', { title: 'Alexandra Resume', templateId: 'minimal' });
    const saved = fixture.getSavedDraft();

    assert.equal(resume.id, 'resume-1');
    assert.equal(saved?.contact.title, 'Senior Platform Engineer');
    assert.equal(saved?.experience[0]?.description, 'Built reliable TypeScript services.');
    assert.deepEqual(saved?.skills, ['TypeScript', 'Distributed Systems']);
    assert.equal(saved?.contact.fullName, draft.contact.fullName);
    assert.equal(saved?.experience[0]?.company, draft.experience[0]?.company);
    assert.equal(saved?.summary, draft.summary);
    assert.deepEqual(saved?.skillGroups, draft.skillGroups);
    assert.deepEqual(saved?.projects, draft.projects);
    assert.equal(saved?.contact.github, draft.contact.github);
    assert.equal(saved?.contact.portfolio, draft.contact.portfolio);
    assert.deepEqual(saved?.education, draft.education);
    assert.deepEqual(saved?.certifications, draft.certifications);
    assert.deepEqual(saved?.sectionOrder, draft.sectionOrder);
    assert.equal(fixture.getRequestedUserId(), 'owner-1');
    assert.equal(fixture.getGeneratedUserId(), 'owner-1');
});

test('does not create a resume when the authenticated user has no dashboard draft', async () => {
    const fixture = createService({ missingDraft: true });
    await assert.rejects(
        fixture.service.generate('other-user', { title: 'Resume', templateId: 'minimal' }),
        (error: unknown) => error instanceof ResumeAiGenerationError && error.code === 'DRAFT_NOT_FOUND',
    );
    assert.equal(fixture.getRequestedUserId(), 'other-user');
    assert.equal(fixture.getSavedDraft(), undefined);
});

test('sanitizes AI provider failures and leaves the saved draft unchanged', async () => {
    const fixture = createService({ generatorError: new Error('provider secret detail') });
    await assert.rejects(
        fixture.service.generate('owner-1', { title: 'Resume', templateId: 'minimal' }),
        (error: unknown) => error instanceof ResumeAiGenerationError
            && error.code === 'AI_FAILED'
            && !error.message.includes('provider secret detail'),
    );
    assert.equal(fixture.getSavedDraft(), undefined);
});

test('returns an actionable sanitized error for an invalid Gemini API key', async () => {
    const fixture = createService({
        generatorError: new GeminiAiProviderError('Gemini authentication failed', 'AUTH_FAILED'),
    });
    await assert.rejects(
        fixture.service.generate('owner-1', { title: 'Resume', templateId: 'minimal' }),
        (error: unknown) => error instanceof ResumeAiGenerationError
            && error.code === 'AI_AUTH_FAILED'
            && error.message.includes('GEMINI_API_KEY'),
    );
    assert.equal(fixture.getSavedDraft(), undefined);
});

test('generation controller uses the authenticated user and rejects an invalid template id', async () => {
    let generatedFor = '';
    const exportService = {
        createSnapshot: async () => { throw new Error('unused'); },
        generatePdf: async () => { throw new Error('unused'); },
        generateJpg: async () => { throw new Error('unused'); },
    };
    const aiService = {
        generate: async (userId: string) => {
            generatedFor = userId;
            return { id: 'resume-1', title: 'Resume', templateId: 'minimal', userId, createdAt: new Date(), updatedAt: new Date() };
        },
    };
    const controller = new ResumeController(exportService, aiService);
    let responseData: object | undefined;
    let responseError: { statusCode: number; message: string } | undefined;
    const response = {
        ok(data: object) { responseData = data; return this; },
        error(error: { statusCode: number; message: string }) { responseError = error; return this; },
    } as unknown as Response;

    await controller.generateCurrentResume({
        user: { id: 'owner-42' },
        body: { title: 'Resume', templateId: 'minimal' },
    } as unknown as Request, response);
    assert.equal(generatedFor, 'owner-42');
    assert.equal((responseData as { id?: string })?.id, 'resume-1');

    responseData = undefined;
    await controller.generateCurrentResume({
        user: { id: 'owner-42' },
        body: { title: 'Resume', templateId: 'not-a-template' },
    } as unknown as Request, response);
    assert.equal(responseData, undefined);
    assert.equal(responseError?.statusCode, 400);
});
