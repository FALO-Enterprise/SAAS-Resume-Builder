import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
    DEFAULT_RESUME_CUSTOMIZATION,
    type ResumeRenderSnapshot,
    type ResumeSectionId,
} from '@resumax/shared-types';
import { ResumeController } from './resume.controller';
import { ResumeExportError, ResumeExportService } from './resume-export.service';

const draft = {
    contact: {
        fullName: 'Alexandra Morgan-Santiago',
        title: 'Senior Platform Engineering and Reliability Lead',
        email: 'alexandra.morgan@example.com',
        phone: '+1 202 555 0199',
        location: 'Washington, DC',
        linkedin: 'https://www.linkedin.com/in/alexandra-morgan-santiago-with-a-long-profile-address',
    },
    experience: [
        {
            id: 'experience-1', jobTitle: 'Senior Platform Engineer', company: 'Example Corporation', location: 'Remote', current: true,
            startMonth: 'January', startYear: '2021', endMonth: '', endYear: '',
            description: 'Led a multi-year reliability program across distributed services. '.repeat(20),
        },
        {
            id: 'experience-2', jobTitle: 'Software Engineer', company: 'Previous Company', location: 'New York, NY', current: false,
            startMonth: 'June', startYear: '2017', endMonth: 'December', endYear: '2020',
            description: 'Built accessible customer-facing applications and mentored engineers. '.repeat(15),
        },
    ],
    education: [
        { id: 'education-1', institution: 'State University', degree: 'Master of Science', field: 'Computer Science', gradYear: '2017' },
        { id: 'education-2', institution: 'City College', degree: 'Bachelor of Science', field: 'Information Systems', gradYear: '2015' },
    ],
    certifications: [],
    skills: ['TypeScript', 'Distributed Systems', 'Technical Leadership'],
};

function createService(options?: {
    owner?: boolean;
    templateId?: string;
    failPdf?: boolean;
    failJpg?: boolean;
    sectionOrder?: ResumeSectionId[];
}) {
    const resumeRepository = {
        findOwnedById: async (_resumeId: string, _userId: string) => options?.owner === false
            ? null
            : { id: 'resume-1', title: 'Alexandra Resume', templateId: options?.templateId ?? 'minimal', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    };
    const dashboardRepository = {
        findByUserId: async () => structuredClone({
            ...draft,
            ...(options?.sectionOrder ? { sectionOrder: options.sectionOrder } : {}),
        }),
    };
    const pdfGenerator = {
        generate: async (snapshot: ResumeRenderSnapshot) => {
            if (options?.failPdf) throw new Error('Chromium crashed');
            assert.equal(snapshot.content.contact.fullName, draft.contact.fullName);
            return Buffer.from('%PDF-test');
        },
        generateJpg: async (snapshot: ResumeRenderSnapshot) => {
            if (options?.failJpg) throw new Error('Chromium crashed');
            assert.equal(snapshot.content.contact.fullName, draft.contact.fullName);
            return Buffer.from('JPG-test');
        },
    };
    return new ResumeExportService(resumeRepository, dashboardRepository, pdfGenerator);
}

test('creates an immutable snapshot and delegates PDF generation', async () => {
    const service = createService();
    const pdf = await service.generatePdf('resume-1', 'user-1', {
        customization: { hiddenSections: ['certifications'], sectionOrder: ['skills', 'experience', 'education'] },
    });
    assert.equal(pdf.toString(), '%PDF-test');

    const snapshot = await service.createSnapshot('resume-1', 'user-1');
    assert.equal(snapshot.content.summary, '');
    assert.deepEqual(snapshot.content.skillGroups, []);
    assert.deepEqual(snapshot.content.projects, []);
    assert.equal(snapshot.content.contact.github, '');
    assert.equal(snapshot.content.contact.portfolio, '');
    assert.equal(snapshot.content.education[0]?.location, '');
    assert.deepEqual(snapshot.customization.sectionOrder, DEFAULT_RESUME_CUSTOMIZATION.sectionOrder);
    draft.contact.fullName = 'Changed after snapshot';
    assert.equal(snapshot.content.contact.fullName, 'Alexandra Morgan-Santiago');
    draft.contact.fullName = 'Alexandra Morgan-Santiago';
});

test('uses the persisted section order by default and allows an export override', async () => {
    const persistedOrder: ResumeSectionId[] = [
        'experience',
        'projects',
        'skills',
        'summary',
        'education',
        'certifications',
    ];
    const service = createService({ sectionOrder: persistedOrder });

    const snapshot = await service.createSnapshot('resume-1', 'user-1');
    assert.deepEqual(snapshot.customization.sectionOrder, persistedOrder);

    const override: ResumeSectionId[] = ['skills', 'experience', 'education'];
    const overriddenSnapshot = await service.createSnapshot('resume-1', 'user-1', {
        customization: { sectionOrder: override },
    });
    assert.deepEqual(overriddenSnapshot.customization.sectionOrder, override);
});

test('prevents another user from exporting a resume', async () => {
    const service = createService({ owner: false });
    await assert.rejects(
        service.generatePdf('resume-1', 'other-user'),
        (error: unknown) => error instanceof ResumeExportError && error.code === 'NOT_FOUND',
    );
});

test('rejects an invalid selected template id', async () => {
    const service = createService({ templateId: 'unknown-template' });
    await assert.rejects(
        service.createSnapshot('resume-1', 'user-1'),
        (error: unknown) => error instanceof ResumeExportError && error.code === 'INVALID_TEMPLATE',
    );
});

test('sanitizes PDF generator failures', async () => {
    const service = createService({ failPdf: true });
    await assert.rejects(
        service.generatePdf('resume-1', 'user-1'),
        (error: unknown) => error instanceof ResumeExportError && error.code === 'PDF_FAILED' && !error.message.includes('Chromium crashed'),
    );
});

test('delegates JPG generation through the same immutable snapshot pipeline', async () => {
    const service = createService();
    const jpg = await service.generateJpg('resume-1', 'user-1', {
        customization: { hiddenSections: ['certifications'] },
    });
    assert.equal(jpg.toString(), 'JPG-test');
});

test('sanitizes JPG generator failures', async () => {
    const service = createService({ failJpg: true });
    await assert.rejects(
        service.generateJpg('resume-1', 'user-1'),
        (error: unknown) => error instanceof ResumeExportError && error.code === 'JPG_FAILED' && !error.message.includes('Chromium crashed'),
    );
});

test('PDF controller returns safe download headers', async () => {
    const exportService = {
        createSnapshot: async () => { throw new Error('unused'); },
        generatePdf: async () => Buffer.from('%PDF-controller'),
        generateJpg: async () => Buffer.from('unused'),
    };
    const controller = new ResumeController(exportService);
    const headers: Record<string, string> = {};
    let statusCode = 0;
    let responseBody: Buffer | undefined;
    const response = {
        status(code: number) { statusCode = code; return this; },
        set(values: Record<string, string>) { Object.assign(headers, values); return this; },
        send(value: Buffer) { responseBody = value; return this; },
        error(error: unknown) { throw new Error(`Unexpected controller error: ${JSON.stringify(error)}`); },
    } as unknown as Response;
    const request = {
        params: { rid: 'resume-1' }, body: {}, user: { id: 'user-1' }, plan: { canExportPDF: true },
    } as unknown as Request<{ rid: string }, Buffer>;

    await controller.exportPdf(request, response);
    assert.equal(statusCode, 200);
    assert.equal(headers['Content-Type'], 'application/pdf');
    assert.match(headers['Content-Disposition'] ?? '', /^attachment; filename="resume-resume-1\.pdf"$/);
    assert.equal(responseBody?.toString(), '%PDF-controller');
});

test('JPG controller returns safe download headers', async () => {
    const exportService = {
        createSnapshot: async () => { throw new Error('unused'); },
        generatePdf: async () => Buffer.from('unused'),
        generateJpg: async () => Buffer.from('JPG-controller'),
    };
    const controller = new ResumeController(exportService);
    const headers: Record<string, string> = {};
    let statusCode = 0;
    let responseBody: Buffer | undefined;
    const response = {
        status(code: number) { statusCode = code; return this; },
        set(values: Record<string, string>) { Object.assign(headers, values); return this; },
        send(value: Buffer) { responseBody = value; return this; },
        error(error: unknown) { throw new Error(`Unexpected controller error: ${JSON.stringify(error)}`); },
    } as unknown as Response;
    const request = {
        params: { rid: 'resume-1' }, body: {}, user: { id: 'user-1' }, plan: { canExportPDF: true },
    } as unknown as Request<{ rid: string }, Buffer>;

    await controller.exportJpg(request, response);
    assert.equal(statusCode, 200);
    assert.equal(headers['Content-Type'], 'image/jpeg');
    assert.match(headers['Content-Disposition'] ?? '', /^attachment; filename="resume-resume-1\.jpg"$/);
    assert.equal(headers['Content-Length'], String(Buffer.byteLength('JPG-controller')));
    assert.equal(headers['Cache-Control'], 'private, no-store');
    assert.equal(headers['X-Content-Type-Options'], 'nosniff');
    assert.equal(responseBody?.toString(), 'JPG-controller');
});

test('JPG export preserves the existing plan entitlement check', async () => {
    let generated = false;
    let responseError: { message?: string; statusCode?: number } | undefined;
    const exportService = {
        createSnapshot: async () => { throw new Error('unused'); },
        generatePdf: async () => Buffer.from('unused'),
        generateJpg: async () => {
            generated = true;
            return Buffer.from('unused');
        },
    };
    const controller = new ResumeController(exportService);
    const response = {
        error(error: { message?: string; statusCode?: number }) { responseError = error; return this; },
    } as unknown as Response;
    const request = {
        params: { rid: 'resume-1' }, body: {}, user: { id: 'user-1' }, plan: { canExportPDF: false },
    } as unknown as Request<{ rid: string }, Buffer>;

    await controller.exportJpg(request, response);
    assert.equal(generated, false);
    assert.equal(responseError?.statusCode, 403);
    assert.equal(responseError?.message, 'Your plan does not include JPG export');
});

test('FREE plan keeps its advertised PDF-only export restriction', async () => {
    let generated = false;
    let responseError: { message?: string; statusCode?: number } | undefined;
    const exportService = {
        createSnapshot: async () => { throw new Error('unused'); },
        generatePdf: async () => Buffer.from('unused'),
        generateJpg: async () => {
            generated = true;
            return Buffer.from('unused');
        },
    };
    const controller = new ResumeController(exportService);
    const response = {
        error(error: { message?: string; statusCode?: number }) { responseError = error; return this; },
    } as unknown as Response;
    const request = {
        params: { rid: 'resume-1' },
        body: {},
        user: { id: 'user-1' },
        plan: { name: 'FREE', canExportPDF: true },
    } as unknown as Request<{ rid: string }, Buffer>;

    await controller.exportJpg(request, response);
    assert.equal(generated, false);
    assert.equal(responseError?.statusCode, 403);
    assert.equal(responseError?.message, 'Your plan does not include JPG export');
});
