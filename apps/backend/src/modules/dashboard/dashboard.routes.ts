import { Router } from 'express';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.use(isAuthenticated);
router.get('/', controller.getDraft);
router.put('/', controller.saveDraft);

export const dashboardRouter = router;
