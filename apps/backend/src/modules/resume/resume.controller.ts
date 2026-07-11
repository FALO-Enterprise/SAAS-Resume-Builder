import { Request, Response } from 'express';
import { resumeService } from './resume.service';
import { CreateResumeDTO, UpdateResumeDTO } from './types/resume.dto';
import { zodValidation } from '../../common/utils/zod.util';
import { resumeCreateSchema, resumeUpdateSchema } from './util/resume.schema';
import { HttpErrorStatus } from '../../common/utils/util.types';

export class ResumeController {
    private service = resumeService;

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
