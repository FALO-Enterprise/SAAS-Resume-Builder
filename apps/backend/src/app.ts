import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { resumeRouter } from './modules/resume/resume.routes'
import { authRouter } from './modules/auth/auth.routes'
import { userRouter } from './modules/users/users.routes'
import { templateRouter } from './modules/template/template.routes'
import session from 'express-session'
import { responseEnhancer } from './common/middlewares/response.middleware'
import path from 'path'

const app = express()

app.use(express.json())
app.use(responseEnhancer);
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded());
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'dev-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 30,
        },
    })
);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
// Routes
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/resumes', resumeRouter)
app.use('/api/templates', templateRouter)

export default app