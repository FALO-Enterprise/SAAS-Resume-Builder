import { Request, Response } from 'express';
import { templateService } from './template.service';
import { CreateTemplateDTO, UpdateTemplateDTO } from './types/template.dto';
import { HttpErrorStatus } from '../../common/utils/util.types';

export class TemplateController {
    private service = templateService;

    getTemplates = async (req: Request, res: Response) => {
        const templates = await this.service.getTemplates();
        res.ok(templates);
    };

    getTemplate = async (req: Request<{ tid: string }>, res: Response) => {
        const id = req.params.tid;
        if (!id) {
            return res.error({ message: 'Template id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const template = await this.service.getTemplate(id);
        if (!template) {
            return res.error({ message: 'Template not found', statusCode: HttpErrorStatus.NotFound });
        }

        res.ok(template);
    };

    createTemplate = async (req: Request<{}, {}, CreateTemplateDTO>, res: Response) => {
        const payload = req.body;
        const template = await this.service.createTemplate(payload);
        res.create(template);
    };

    updateTemplate = async (req: Request<{ tid: string }, {}, UpdateTemplateDTO>, res: Response) => {
        const id = req.params.tid;
        if (!id) {
            return res.error({ message: 'Template id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const template = await this.service.updateTemplate(id, req.body);
        res.ok(template);
    };

    deleteTemplate = async (req: Request<{ tid: string }>, res: Response) => {
        const id = req.params.tid;
        if (!id) {
            return res.error({ message: 'Template id required', statusCode: HttpErrorStatus.BadRequest });
        }

        const deleted = await this.service.deleteTemplate(id);
        if (!deleted) {
            return res.error({ message: 'Template not found', statusCode: HttpErrorStatus.NotFound });
        }

        res.ok({});
    };
}

export const templateController = new TemplateController();
