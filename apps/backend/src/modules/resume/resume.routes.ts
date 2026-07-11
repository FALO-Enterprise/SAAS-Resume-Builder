import { Router } from 'express';
import { ResumeController } from './resume.controller';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';

const router = Router();
const resumeController = new ResumeController();

router.use(isAuthenticated);
router.get('/', resumeController.getResumes);
router.get('/:rid', resumeController.getResume);
router.post('/', resumeController.createResume);
router.patch('/:rid', resumeController.updateResume);
router.delete('/:rid', resumeController.deleteResume);

export const resumeRouter = router;
