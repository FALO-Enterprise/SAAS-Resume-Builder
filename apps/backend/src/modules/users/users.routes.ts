import { Router } from 'express';
import { UserController } from "./users.controller";
import { isAuthenticated } from '../../common/middlewares/auth.middleware';
import { isAdmin, isSelfOrAdmin } from '../../common/middlewares/ownership.middleware';
import { uploadSingle } from '../../config/multer.config';

const router = Router();
const userController = new UserController();

router.use(isAuthenticated);

// GET /api/users - Enumerates every account, so admins only.
router.get('/', isAdmin, userController.getUsers);

//GET /api/users/:uid - Get User by ID
router.get('/:uid', isSelfOrAdmin('uid'), userController.getUser);


// POST /api/users - Create user (with optional avatar)
router.post('/', isAdmin, uploadSingle('avatar'), userController.createUser);

// PATCH /api/users/:id - Update user (with optional avatar)
router.patch('/:id', isSelfOrAdmin('id'), uploadSingle('avatar'), userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', isSelfOrAdmin('id'), userController.deleteUser);


export const userRouter = router;
