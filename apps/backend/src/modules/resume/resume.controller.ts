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

export class FreeExportTracker {
    private userExportCounts = new Map<string, number>();

    getExportCount(userId: string): number {
        return this.userExportCounts.get(userId) ?? 0;
    }

    incrementExportCount(userId: string): number {
        const current = this.getExportCount(userId);
        const updated = current + 1;
        this.userExportCounts.set(userId, updated);
        return updated;
    }
}

export const freeExportTracker = new FreeExportTracker();

export class ResumeController {
    private service = resumeService;

    constructor(
        private readonly exportService: Pick<ResumeExportService, 'createSnapshot' | 'generatePdf' | 'generateJpg'> = resumeExportService,
        private readonly aiService: Pick<ResumeAiService, 'generate'> = resumeAiService,
    ) {}

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
        if (!req.plan.canExportPDF) {
            return res.error({ message: 'Your plan does not include resume export', statusCode: HttpErrorStatus.Forbidden });
        }

        const isFreePlan = req.plan.name === 'FREE';
        if (isFreePlan && freeExportTracker.getExportCount(req.user.id) >= 1) {
            return res.error({
                message: 'Free plan users are allowed 1 download attempt. Upgrade to Pro for unlimited exports.',
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
            if (isFreePlan) {
                freeExportTracker.incrementExportCount(req.user.id);
            }
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
        if (!req.plan.canExportPDF) {
            return res.error({ message: 'Your plan does not include JPG export', statusCode: HttpErrorStatus.Forbidden });
        }

        const isFreePlan = req.plan.name === 'FREE';
        if (isFreePlan && freeExportTracker.getExportCount(req.user.id) >= 1) {
            return res.error({
                message: 'Free plan users are allowed 1 download attempt. Upgrade to Pro for unlimited exports.',
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
            if (isFreePlan) {
                freeExportTracker.incrementExportCount(req.user.id);
            }
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
        const resumes = await this.service.getResumes(page, limit);
        res.ok(resumes);
    };

    getResume = async (req: Request<{ rid: string }>, res: Response) => {
        const id = req.params.rid;
        if (!id) {
            return res.error({ message: 'Resume id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const resume = await this.service.getResume(id);
        if (!resume) {
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
        const parsed = resumeGenerationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.error({
                message: parsed.error.issues.map((issue) => issue.message).join('; '),
                statusCode: HttpErrorStatus.BadRequest,
            });
        }

        if (req.plan.name === 'FREE' && parsed.data.templateId !== 'minimal') {
            return res.error({
                message: 'Free plan users are restricted to the Classic ATS template. Upgrade to Pro to unlock premium templates.',
                statusCode: HttpErrorStatus.Forbidden,
            });
        }

        const resume = await this.service.upsertCurrentResume(req.user.id, parsed.data);
        return res.ok(resume);
    };

    generateCurrentResume = async (req: Request<{}, {}, ResumeGenerationDTO>, res: Response) => {
        const parsed = resumeGenerationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.error({
                message: parsed.error.issues.map((issue) => issue.message).join('; '),
                statusCode: HttpErrorStatus.BadRequest,
            });
        }

        if (req.plan.name === 'FREE' && parsed.data.templateId !== 'minimal') {
            return res.error({
                message: 'Free plan users are restricted to the Classic ATS template. Upgrade to Pro to unlock premium templates.',
                statusCode: HttpErrorStatus.Forbidden,
            });
        }

        try {
            const resume = await this.aiService.generate(req.user.id, parsed.data);
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

        const payload = zodValidation(resumeUpdateSchema, req.body, 'RESUME');
        const resume = await this.service.updateResume(id, payload);
        res.ok(resume);
    };

    deleteResume = async (req: Request<{ rid: string }>, res: Response) => {
        const id = req.params.rid;
        if (!id) {
            return res.error({ message: 'Resume id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const deleted = await this.service.deleteResume(id);
        if (!deleted) {
            return res.error({ message: 'Resume not found', statusCode: HttpErrorStatus.NotFound });
        }

        res.ok({});
    };
}
