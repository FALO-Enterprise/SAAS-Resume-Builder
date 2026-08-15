import { Router } from 'express';
import { ResumeController } from './resume.controller';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';
import { checkPlan } from '../../common/middlewares/plan.middleware';
import { checkResume } from '../../common/middlewares/resume.middleware';

const router = Router();
const resumeController = new ResumeController();

router.get('/render/:token', resumeController.getRenderSnapshot);
router.use(isAuthenticated);
router.get('/', resumeController.getResumes);
router.post('/current/generate', checkPlan, resumeController.generateCurrentResume);
router.put('/current', checkPlan, resumeController.upsertCurrentResume);
router.get('/:rid/preview', resumeController.getPreview);
router.post('/:rid/exports/pdf', checkPlan, resumeController.exportPdf);
router.post('/:rid/exports/jpg', checkPlan, resumeController.exportJpg);
router.get('/:rid', resumeController.getResume);
router.post('/', checkPlan, checkResume, resumeController.createResume);
router.patch('/:rid', resumeController.updateResume);
router.delete('/:rid', resumeController.deleteResume);

export const resumeRouter = router;
