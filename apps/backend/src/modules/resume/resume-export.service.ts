import {
    DEFAULT_RESUME_CUSTOMIZATION,
    type ResumeCustomization,
    type ResumeRenderSnapshot,
} from '@resumax/shared-types';
import { DashboardRepository } from '../dashboard/dashboard.repository';
import { resumeContentSchema } from '../dashboard/dashboard.schema';
import { ResumeRepository } from './resume.repository';
import type { Resume } from './resume.schema';
import { resolveResumeTemplate } from './resume-template.registry';
import type { ResumeExportInput } from './resume-export.schema';
import type { ResumePdfGenerator } from './pdf/resume-pdf-generator';
import { PuppeteerResumePdfGenerator } from './pdf/puppeteer-resume-pdf.generator';

type ResumeLookup = {
    findOwnedById(resumeId: string, userId: string): Promise<Resume | null>;
};
type DraftLookup = {
    findByUserId(userId: string): Promise<unknown>;
};

export class ResumeExportError extends Error {
    constructor(
        message: string,
        public readonly code: 'NOT_FOUND' | 'INVALID_TEMPLATE' | 'INVALID_RESUME' | 'PDF_FAILED',
    ) {
        super(message);
    }
}

export class ResumeExportService {
    constructor(
        private readonly resumeRepository: ResumeLookup = new ResumeRepository(),
        private readonly dashboardRepository: DraftLookup = new DashboardRepository(),
        private readonly pdfGenerator: ResumePdfGenerator = new PuppeteerResumePdfGenerator(),
    ) {}

    async createSnapshot(
        resumeId: string,
        userId: string,
        input: ResumeExportInput = {},
    ): Promise<ResumeRenderSnapshot> {
        const [resume, draft] = await Promise.all([
            this.resumeRepository.findOwnedById(resumeId, userId),
            this.dashboardRepository.findByUserId(userId),
        ]);

        if (!resume) throw new ResumeExportError('Resume not found', 'NOT_FOUND');
        if (!draft) throw new ResumeExportError('Resume data is unavailable', 'INVALID_RESUME');

        const parsedContent = resumeContentSchema.safeParse(draft);
        if (!parsedContent.success) {
            throw new ResumeExportError('Resume data is invalid', 'INVALID_RESUME');
        }

        const template = resolveResumeTemplate(input.templateId ?? resume.templateId);
        if (!template) throw new ResumeExportError('Template id is invalid', 'INVALID_TEMPLATE');

        const customization: ResumeCustomization = {
            ...DEFAULT_RESUME_CUSTOMIZATION,
            ...input.customization,
            sectionOrder: input.customization?.sectionOrder
                ? [...input.customization.sectionOrder]
                : [...DEFAULT_RESUME_CUSTOMIZATION.sectionOrder],
            hiddenSections: input.customization?.hiddenSections
                ? [...input.customization.hiddenSections]
                : [...DEFAULT_RESUME_CUSTOMIZATION.hiddenSections],
        };

        return structuredClone({
            resumeId: resume.id,
            title: resume.title,
            templateId: template.id,
            templateVersion: template.version,
            content: parsedContent.data,
            customization,
            createdAt: new Date().toISOString(),
        });
    }

    async generatePdf(resumeId: string, userId: string, input: ResumeExportInput = {}) {
        const snapshot = await this.createSnapshot(resumeId, userId, input);
        try {
            return await this.pdfGenerator.generate(snapshot);
        } catch (error) {
            console.error('Resume PDF generation failed', {
                resumeId,
                userId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new ResumeExportError('PDF generation failed', 'PDF_FAILED');
        }
    }
}

export const resumeExportService = new ResumeExportService();
