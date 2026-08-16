import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { resumeRouter } from './modules/resume/resume.routes'
import { authRouter } from './modules/auth/auth.routes'
import { userRouter } from './modules/users/users.routes'
import { templateRouter } from './modules/template/template.routes'
import { dashboardRouter } from './modules/dashboard/dashboard.routes'
import session from 'express-session'
import { responseEnhancer } from './common/middlewares/response.middleware'
import { errorHandler } from './common/middlewares/error.middleware'
import path from 'path'
import { getEnvOrThrow } from './common/utils/util'

const app = express()

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(express.json())
app.use(responseEnhancer);
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
        // No silent fallback: a deployment that forgets to set this would
        // otherwise sign every session cookie with the publicly-known
        // literal 'dev-secret', letting anyone forge valid session cookies.
        secret: getEnvOrThrow('SESSION_SECRET'),
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
app.use('/api/dashboard', dashboardRouter)

app.use(errorHandler)

export default app
