import { Router } from 'express';
import { UserController } from "./users.controller";
import { isAuthenticated } from '../../common/middlewares/auth.middleware';
import { uploadSingle } from '../../config/multer.config';

const router = Router();
const userController = new UserController();

// router.use(isAuthenticated);
router.use(isAuthenticated);

//GET
router.get('/', userController.getUsers);

//GET /api/users/:uid - Get User by ID
router.get('/:uid', userController.getUser);


// POST /api/users - Create user (with optional avatar)
router.post('/', uploadSingle('avatar'), userController.createUser);

// PUT /api/users/:id - Update user (with optional avatar)
router.patch('/:id', uploadSingle('avatar'), userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);


export const userRouter = router;