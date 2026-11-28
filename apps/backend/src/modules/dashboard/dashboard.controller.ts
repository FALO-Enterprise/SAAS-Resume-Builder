import { Request, Response } from 'express';
import { HttpErrorStatus } from '../../common/utils/util.types';
import { dashboardDraftSchema, type DashboardDraftInput } from './dashboard.schema';
import { dashboardService } from './dashboard.service';

export class DashboardController {
    getDraft = async (req: Request, res: Response) => {
        const resumeId = typeof req.query.resumeId === 'string' ? req.query.resumeId : undefined;
        const draft = await dashboardService.getDraft(req.user, resumeId);
        res.ok(draft);
    };

    saveDraft = async (req: Request<{}, {}, DashboardDraftInput>, res: Response) => {
        const resumeId = typeof req.query.resumeId === 'string' ? req.query.resumeId : undefined;
        const parsed = dashboardDraftSchema.safeParse(req.body);
        if (!parsed.success) {
            res.error({
                statusCode: HttpErrorStatus.BadRequest,
                message: parsed.error.issues.map((issue) => issue.message).join('; '),
            });
            return;
        }

        const draft = await dashboardService.saveDraft(req.user.id, parsed.data, resumeId);
        res.ok(draft);
    };
}
