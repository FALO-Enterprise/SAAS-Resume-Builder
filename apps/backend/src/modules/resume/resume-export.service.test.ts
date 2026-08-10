import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import type { ResumeRenderSnapshot } from '@resumax/shared-types';
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

function createService(options?: { owner?: boolean; templateId?: string; failPdf?: boolean }) {
    const resumeRepository = {
        findOwnedById: async (_resumeId: string, _userId: string) => options?.owner === false
            ? null
            : { id: 'resume-1', title: 'Alexandra Resume', templateId: options?.templateId ?? 'minimal', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    };
    const dashboardRepository = { findByUserId: async () => structuredClone(draft) };
    const pdfGenerator = {
        generate: async (snapshot: ResumeRenderSnapshot) => {
            if (options?.failPdf) throw new Error('Chromium crashed');
            assert.equal(snapshot.content.contact.fullName, draft.contact.fullName);
            return Buffer.from('%PDF-test');
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
    draft.contact.fullName = 'Changed after snapshot';
    assert.equal(snapshot.content.contact.fullName, 'Alexandra Morgan-Santiago');
    draft.contact.fullName = 'Alexandra Morgan-Santiago';
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

test('PDF controller returns safe download headers', async () => {
    const exportService = {
        createSnapshot: async () => { throw new Error('unused'); },
        generatePdf: async () => Buffer.from('%PDF-controller'),
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
