import {
    DEFAULT_RESUME_CUSTOMIZATION,
    type ResumeCustomization,
    type ResumeRenderSnapshot,
} from '@resumax/shared-types';
import { DashboardRepository } from '../dashboard/dashboard.repository';
import {
    resumeContentSchema,
    resumeDraftCustomizationSchema,
} from '../dashboard/dashboard.schema';
import { ResumeRepository } from './resume.repository';
import type { Resume } from './resume.schema';
import { resolveResumeTemplate } from './resume-template.registry';
import type { ResumeExportInput } from './resume-export.schema';
import type { ResumePdfGenerator } from './pdf/resume-pdf-generator';
import { PuppeteerResumePdfGenerator } from './pdf/puppeteer-resume-pdf.generator';

type ResumeLookup = {
    findOwnedById(resumeId: string, userId: string): Promise<Resume | null>;
    upsertForUser?(title: string, templateId: string, templateName: string, userId: string): Promise<Resume>;
};
type DraftLookup = {
    findByUserId(userId: string): Promise<unknown>;
};

export class ResumeExportError extends Error {
    constructor(
        message: string,
        public readonly code: 'NOT_FOUND' | 'INVALID_TEMPLATE' | 'INVALID_RESUME' | 'PDF_FAILED' | 'JPG_FAILED',
    ) {
        super(message);
    }
}

export class ResumeExportService {
    constructor(
        private readonly resumeRepository: ResumeLookup = new ResumeRepository(),
        private readonly dashboardRepository: DraftLookup = new DashboardRepository(),
        private readonly pdfGenerator: ResumePdfGenerator = new PuppeteerResumePdfGenerator(),
    ) { }

    async createSnapshot(
        resumeId: string,
        userId: string,
        input: ResumeExportInput = {},
        hasWatermark = false,
    ): Promise<ResumeRenderSnapshot> {
        let [resume, draft] = await Promise.all([
            this.resumeRepository.findOwnedById(resumeId, userId),
            this.dashboardRepository.findByUserId(userId),
        ]);

        if (!draft) throw new ResumeExportError('Resume data is unavailable', 'INVALID_RESUME');

        if (!resume && this.resumeRepository.upsertForUser) {
            const draftTemplate = typeof (draft as { template?: unknown }).template === 'string'
                ? (draft as { template: string }).template
                : 'minimal';
            const targetTemplate = resolveResumeTemplate(input.templateId ?? draftTemplate) ?? resolveResumeTemplate('minimal')!;
            const contactName = typeof (draft as { contact?: { fullName?: string } }).contact?.fullName === 'string'
                ? (draft as { contact: { fullName: string } }).contact.fullName.trim()
                : '';
            resume = await this.resumeRepository.upsertForUser(
                contactName ? `${contactName} Resume` : 'My Resume',
                targetTemplate.id,
                targetTemplate.name,
                userId,
            );
        }

        if (!resume) throw new ResumeExportError('Resume not found', 'NOT_FOUND');

        const parsedContent = resumeContentSchema.safeParse(draft);
        const parsedDraftCustomization = resumeDraftCustomizationSchema.safeParse(draft);
        if (!parsedContent.success || !parsedDraftCustomization.success) {
            throw new ResumeExportError('Resume data is invalid', 'INVALID_RESUME');
        }

        const template = resolveResumeTemplate(input.templateId ?? resume.templateId);
        if (!template) throw new ResumeExportError('Template id is invalid', 'INVALID_TEMPLATE');

        const customization: ResumeCustomization = {
            ...DEFAULT_RESUME_CUSTOMIZATION,
            ...input.customization,
            sectionOrder: input.customization?.sectionOrder
                ? [...input.customization.sectionOrder]
                : [...parsedDraftCustomization.data.sectionOrder],
            hiddenSections: input.customization?.hiddenSections
                ? [...input.customization.hiddenSections]
                : [...DEFAULT_RESUME_CUSTOMIZATION.hiddenSections],
        };

        const draftPurpose = typeof (draft as { purpose?: unknown }).purpose === 'string'
            ? (draft as { purpose: string }).purpose
            : 'general';

        return structuredClone({
            resumeId: resume.id,
            title: resume.title,
            templateId: template.id,
            templateVersion: template.version,
            content: parsedContent.data,
            customization,
            createdAt: new Date().toISOString(),
            hasWatermark,
            purpose: draftPurpose,
        });
    }

    async generatePdf(resumeId: string, userId: string, input: ResumeExportInput = {}, hasWatermark = false) {
        const snapshot = await this.createSnapshot(resumeId, userId, input, hasWatermark);
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

    async generateJpg(resumeId: string, userId: string, input: ResumeExportInput = {}, hasWatermark = false) {
        const snapshot = await this.createSnapshot(resumeId, userId, input, hasWatermark);
        try {
            return await this.pdfGenerator.generateJpg(snapshot);
        } catch (error) {
            console.error('Resume JPG generation failed', {
                resumeId,
                userId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new ResumeExportError('JPG generation failed', 'JPG_FAILED');
        }
    }
}

export const resumeExportService = new ResumeExportService();
