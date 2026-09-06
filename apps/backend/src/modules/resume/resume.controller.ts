import { Request, Response } from 'express';
import { resumeService } from './resume.service';
import { CreateResumeDTO, UpdateResumeDTO } from './types/resume.dto';
import { zodValidation } from '../../common/utils/zod.util';
import { resumeCreateSchema, resumeGenerationSchema, resumeUpdateSchema, type ResumeGenerationDTO } from './util/resume.schema';
import { HttpErrorStatus } from '../../common/utils/util.types';
import { resumeExportSchema, type ResumeExportInput } from './resume-export.schema';
import { ResumeExportError, resumeExportService, type ResumeExportService } from './resume-export.service';
import { renderSnapshotStore } from './pdf/render-snapshot.store';
import { ResumeAiGenerationError, resumeAiService, type ResumeAiService } from './resume-ai.service';
import { planUsageService } from '../plan/plan-usage.service';
import { dashboardService } from '../dashboard/dashboard.service';
import { resolveResumeTemplate } from './resume-template.registry';
import { resumeCoachService } from './resume-coach.service';

export class ResumeController {
    private service = resumeService;

    constructor(
        private readonly exportService: Pick<ResumeExportService, 'createSnapshot' | 'generatePdf' | 'generateJpg'> = resumeExportService,
        private readonly aiService: Pick<ResumeAiService, 'generate'> = resumeAiService,
    ) { }

    getRenderSnapshot = (req: Request<{ token: string }>, res: Response) => {
        const snapshot = renderSnapshotStore.consume(req.params.token);
        if (!snapshot) {
            return res.error({ message: 'Render token is invalid or expired', statusCode: HttpErrorStatus.NotFound });
        }
        return res.ok(snapshot);
    };

    getPreview = async (req: Request<{ rid: string }>, res: Response) => {
        try {
            const isFreePlan = req.plan?.name === 'FREE';
            const snapshot = await this.exportService.createSnapshot(req.params.rid, req.user.id, {}, isFreePlan);
            res.ok(snapshot);
        } catch (error) {
            this.handleExportError(error, res);
        }
    };

    exportPdf = async (req: Request<{ rid: string }, Buffer, ResumeExportInput>, res: Response) => {
        if (!req.plan?.canExportPDF) {
            return res.error({ message: 'Your plan does not include resume export', statusCode: HttpErrorStatus.Forbidden });
        }

        const planName = req.plan?.name || 'FREE';
        const isFreePlan = planName === 'FREE';
        const exportCheck = planUsageService.canExport(req.user.id, planName, 'pdf');
        if (!exportCheck.allowed) {
            return res.error({
                message: exportCheck.reason ?? 'PDF export limit reached for your plan',
                statusCode: HttpErrorStatus.Forbidden,
            });
        }

        const parsed = resumeExportSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.error({
                message: parsed.error.issues.map((issue) => issue.message).join('; '),
                statusCode: HttpErrorStatus.BadRequest,
            });
        }

        if (isFreePlan && parsed.data.templateId && parsed.data.templateId !== 'minimal') {
            return res.error({
                message: 'Free plan users are restricted to the Classic ATS template. Upgrade to Pro to unlock premium templates.',
                statusCode: HttpErrorStatus.Forbidden,
            });
        }

        try {
            const pdf = await this.exportService.generatePdf(req.params.rid, req.user.id, parsed.data, isFreePlan);
            await planUsageService.recordExport(req.user.id, 'pdf');
            const filename = `resume-${req.params.rid.replace(/[^a-zA-Z0-9_-]/g, '') || 'export'}.pdf`;
            res.status(200)
                .set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': String(pdf.byteLength),
                    'Cache-Control': 'private, no-store',
                    'X-Content-Type-Options': 'nosniff',
                })
                .send(pdf);
        } catch (error) {
            this.handleExportError(error, res);
        }
    };

    exportJpg = async (req: Request<{ rid: string }, Buffer, ResumeExportInput>, res: Response) => {
        const isFreePlan = req.plan?.name === 'FREE';
        if (!req.plan?.canExportPDF || isFreePlan) {
            return res.error({ message: 'Your plan does not include JPG export', statusCode: HttpErrorStatus.Forbidden });
        }

        const planName = req.plan?.name || 'PRO';
        const exportCheck = planUsageService.canExport(req.user.id, planName, 'jpg');
        if (!exportCheck.allowed) {
            return res.error({
                message: exportCheck.reason ?? 'JPG export limit reached for your plan',
                statusCode: HttpErrorStatus.Forbidden,
            });
        }

        const parsed = resumeExportSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.error({
                message: parsed.error.issues.map((issue) => issue.message).join('; '),
                statusCode: HttpErrorStatus.BadRequest,
            });
        }

        if (isFreePlan && parsed.data.templateId && parsed.data.templateId !== 'minimal') {
            return res.error({
                message: 'Free plan users are restricted to the Classic ATS template. Upgrade to Pro to unlock premium templates.',
                statusCode: HttpErrorStatus.Forbidden,
            });
        }

        try {
            const jpg = await this.exportService.generateJpg(req.params.rid, req.user.id, parsed.data, isFreePlan);
            await planUsageService.recordExport(req.user.id, 'jpg');
            const filename = `resume-${req.params.rid.replace(/[^a-zA-Z0-9_-]/g, '') || 'export'}.jpg`;
            res.status(200)
                .set({
                    'Content-Type': 'image/jpeg',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': String(jpg.byteLength),
                    'Cache-Control': 'private, no-store',
                    'X-Content-Type-Options': 'nosniff',
                })
                .send(jpg);
        } catch (error) {
            this.handleExportError(error, res);
        }
    };

    createNewDraft = async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const planName = req.plan?.name ?? 'FREE';

            // 1. Get current total resumes count
            const existingResumes = await this.service.getResumes(userId);
            const currentCount = existingResumes.length;

            // 2. Check plan draft limits (total & daily)
            const check = planUsageService.canCreateDraft(userId, planName, currentCount);
            if (!check.allowed) {
                return res.error({
                    message: check.reason ?? 'Draft creation limit reached for your plan',
                    statusCode: HttpErrorStatus.Forbidden,
                });
            }

            // 3. Fetch latest draft details to copy
            const currentDraft = await dashboardService.getDraft({ id: userId, email: req.user.email });
            const templateId = (currentDraft?.template as string) || 'minimal';
            const contactName = (currentDraft?.contact as { fullName?: string })?.fullName?.trim() || '';
            const baseTitle = contactName ? `${contactName} Resume` : 'My Resume';
            const title = currentCount > 0 ? `${baseTitle} (Copy ${currentCount + 1})` : baseTitle;

            // 4. Check template reuse frequency
            const templateUsageCount = existingResumes.filter((r) => r.templateId === templateId).length;
            const templateCheck = planUsageService.canUseTemplate(planName, templateId, templateUsageCount);
            const finalTemplateId = templateCheck.allowed ? templateId : 'minimal';

            // 5. Create new resume record
            const newResume = await this.service.createResume({
                title,
                templateId: finalTemplateId,
                userId,
            });

            // 6. Persist dedicated standalone draft for this new resume
            await dashboardService.saveDraft(userId, {
                ...currentDraft,
                template: finalTemplateId,
            }, newResume.id);

            // 7. Record daily creation
            planUsageService.recordDraftCreation(userId);

            return res.create({
                id: newResume.id,
                title: newResume.title,
                templateId: newResume.templateId,
                updatedAt: newResume.updatedAt,
            });
        } catch (error) {
            console.error('Error creating new draft:', error);
            return res.error({
                message: error instanceof Error ? error.message : 'Failed to create new draft',
                statusCode: HttpErrorStatus.BadRequest,
            });
        }
    };

    private handleExportError(error: unknown, res: Response) {
        if (error instanceof ResumeExportError) {
            const statusCode = error.code === 'NOT_FOUND'
                ? HttpErrorStatus.NotFound
                : error.code === 'INVALID_TEMPLATE' || error.code === 'INVALID_RESUME'
                    ? HttpErrorStatus.BadRequest
                    : HttpErrorStatus.InternalServerError;
            return res.error({ message: error.message, statusCode });
        }

        console.error('Unexpected resume export error', error);
        return res.error({ message: 'Resume export is temporarily unavailable', statusCode: HttpErrorStatus.InternalServerError });
    }

    getResumes = async (req: Request<{}, {}, {}, { page: string; limit: string }>, res: Response) => {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const userId = req.user.id;
        const resumes = await this.service.getResumes(userId, page, limit);
        res.ok(resumes);
    };

    getDrafts = async (req: Request, res: Response) => {
        const userId = req.user.id;
        const resumes = await this.service.getResumes(userId);
        const drafts = await Promise.all(
            resumes.map(async (resume) => {
                const draft = await dashboardService.getDraft({ id: userId, email: req.user.email }, resume.id);
                const templateId = (draft?.template as string) || resume.templateId || 'minimal';
                const template = resolveResumeTemplate(templateId);
                return {
                    id: resume.id,
                    title: resume.title,
                    templateId,
                    templateName: template ? template.name : templateId,
                    updatedAt: (resume.updatedAt instanceof Date ? resume.updatedAt : new Date(resume.updatedAt)).toISOString(),
                    thumbnailUrl: `/templates/${templateId}.png`,
                };
            })
        );
        res.ok(drafts);
    };

    getResume = async (req: Request<{ rid: string }>, res: Response) => {
        const id = req.params.rid;
        if (!id) {
            return res.error({ message: 'Resume id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const resume = await this.service.getResume(id);
        if (!resume || resume.userId !== req.user.id) {
            return res.error({ message: 'Resume not found', statusCode: HttpErrorStatus.NotFound });
        }

        res.ok(resume);
    };

    createResume = async (req: Request<{}, {}, CreateResumeDTO>, res: Response) => {
        const payload = zodValidation(resumeCreateSchema, req.body, 'RESUME');
        const resume = await this.service.createResume(payload);
        res.create(resume);
    };

    upsertCurrentResume = async (req: Request<{}, {}, ResumeGenerationDTO>, res: Response) => {
        const resumeId = typeof req.query.resumeId === 'string' ? req.query.resumeId : undefined;
        const parsed = resumeGenerationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.error({
                message: parsed.error.issues.map((issue) => issue.message).join('; '),
                statusCode: HttpErrorStatus.BadRequest,
            });
        }

        const planName = req.plan?.name || 'FREE';
        const effectiveData = {
            ...parsed.data,
            templateId: (planName === 'FREE' && parsed.data.templateId !== 'minimal')
                ? 'minimal'
                : parsed.data.templateId,
        };

        const resume = await this.service.upsertCurrentResume(req.user.id, effectiveData, resumeId);
        return res.ok(resume);
    };

    generateCurrentResume = async (req: Request<{}, {}, ResumeGenerationDTO>, res: Response) => {
        const resumeId = typeof req.query?.resumeId === 'string' ? req.query.resumeId : undefined;
        const parsed = resumeGenerationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.error({
                message: parsed.error.issues.map((issue) => issue.message).join('; '),
                statusCode: HttpErrorStatus.BadRequest,
            });
        }

        const planName = req.plan?.name || 'FREE';
        const effectiveData: ResumeGenerationDTO = {
            ...parsed.data,
            templateId: (planName === 'FREE' && parsed.data.templateId !== 'minimal')
                ? 'minimal'
                : parsed.data.templateId,
        };

        const tokensNeeded = planUsageService.getAiTokensPerBuild(planName);
        const aiCheck = await planUsageService.canConsumeAiTokens(req.user.id, planName, tokensNeeded);
        if (!aiCheck.allowed) {
            return res.error({
                message: aiCheck.reason ?? 'AI token limit reached for your plan. Upgrade your plan for more AI generations.',
                statusCode: HttpErrorStatus.Forbidden,
            });
        }

        try {
            const resume = await this.aiService.generate(req.user.id, effectiveData, resumeId);
            await planUsageService.recordAiTokens(req.user.id, tokensNeeded);
            return res.ok(resume);
        } catch (error) {
            if (error instanceof ResumeAiGenerationError) {
                const statusCode = error.code === 'DRAFT_NOT_FOUND'
                    ? HttpErrorStatus.NotFound
                    : error.code === 'INVALID_DRAFT' || error.code === 'INVALID_TEMPLATE'
                        ? HttpErrorStatus.BadRequest
                        : HttpErrorStatus.ServiceUnavailable;
                return res.error({ message: error.message, statusCode });
            }

            console.error('Unexpected AI resume generation error', {
                name: error instanceof Error ? error.name : 'UnknownError',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
            return res.error({
                message: 'AI resume generation is temporarily unavailable',
                statusCode: HttpErrorStatus.ServiceUnavailable,
            });
        }
    };

    updateResume = async (req: Request<{ rid: string }, {}, UpdateResumeDTO>, res: Response) => {
        const id = req.params.rid;
        if (!id) {
            return res.error({ message: 'Resume id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const existing = await this.service.getResume(id);
        if (!existing || existing.userId !== req.user.id) {
            return res.error({ message: 'Resume not found', statusCode: HttpErrorStatus.NotFound });
        }

        const payload = zodValidation(resumeUpdateSchema, req.body, 'RESUME');
        const resume = await this.service.updateResume(id, payload);
        res.ok(resume);
    };

    deleteResume = async (req: Request<{ rid: string }>, res: Response) => {
        const id = req.params.rid;
        if (!id) {
            return res.error({ message: 'Resume id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const existing = await this.service.getResume(id);
        if (!existing || existing.userId !== req.user.id) {
            return res.error({ message: 'Resume not found', statusCode: HttpErrorStatus.NotFound });
        }

        const deleted = await this.service.deleteResume(id);
        if (!deleted) {
            return res.error({ message: 'Resume not found', statusCode: HttpErrorStatus.NotFound });
        }

        res.ok({ success: true });
    };

    analyzeAiCoach = async (req: Request, res: Response) => {
        try {
            const userId = req.user.id;
            const result = await resumeCoachService.analyze(userId, req.body ?? {});
            return res.ok(result);
        } catch (error) {
            console.error('[ResumeController] AI Coach Error:', error);
            const message = error instanceof Error ? error.message : 'AI Coach failed to analyze resume.';
            const isAccessError = message.includes('Enterprise');
            return res.error({
                message,
                statusCode: isAccessError ? HttpErrorStatus.Forbidden : HttpErrorStatus.InternalServerError,
            });
        }
    };
}
