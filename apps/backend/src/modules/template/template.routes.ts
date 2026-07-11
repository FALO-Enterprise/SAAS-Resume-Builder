import { Router } from 'express';
import { TemplateController } from './template.controller';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';

const router = Router();
const templateController = new TemplateController();

router.use(isAuthenticated);
router.get('/', templateController.getTemplates);
router.get('/:tid', templateController.getTemplate);
router.post('/', templateController.createTemplate);
router.patch('/:tid', templateController.updateTemplate);
router.delete('/:tid', templateController.deleteTemplate);

export const templateRouter = router;
