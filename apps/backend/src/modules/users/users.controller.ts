import { Response, Request } from "express";
import { userService } from "./users.service";
import { HttpErrorStatus } from "../../common/utils/util.types";

const BACKEND_URL = process.env.BACKEND_PUBLIC_URL || "http://localhost:3001";

export class UserController {
    private service = userService;

    getUsers = async (req: Request<{}, {}, {}, { page: string; limit: string }>, res: Response) => {
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        const users = await this.service.getUsers(page, limit);

        res.ok(users);
    }

    getUser = async (req: Request<{ uid: string }>, res: Response) => {
        const id = req.params.uid;
        if (!id) return res.error({ message: 'ID required', statusCode: HttpErrorStatus.BadRequest });

        const user = await this.service.getUser(id);
        if (!user) {
            return res.error({ message: 'User not found', statusCode: HttpErrorStatus.NotFound })
        }

        return res.ok(user);
    }

    createUser = async (req: Request, res: Response) => {
        const { name, email, password } = req.body;
        const avatar = req.file ? `${BACKEND_URL}/uploads/${req.file.filename}` : undefined;

        const user = await this.service.createUser(name, email, password, avatar);
        res.create(user);
    }

    updateUser = async (req: Request, res: Response) => {
        const id = req.params.id;
        if (!id) return res.
            status(400).json({ error: 'ID required' });

        const { name, email } = req.body;
        const avatar = req.file ? `${BACKEND_URL}/uploads/${req.file.filename}` : undefined;
        const user = await this.service.updateUser(String(id), name, email, avatar);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.create(user);
    };

    deleteUser = async (req: Request, res: Response) => {
        const id = (req.params.id)?.toString();
        if (!id) return res.status(400).json({ error: 'ID required' });

        const deleted = await this.service.deleteUser(id);
        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.ok({});
    };
}