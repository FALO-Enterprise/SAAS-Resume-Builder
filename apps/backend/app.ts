import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { resumeRouter } from './modules/resume/resume.routes'
import { authRouter } from './modules/auth/auth.routes'
import { userRouter } from './modules/users/users.routes'
import { templateRouter } from './modules/template/template.routes'
import { getEnvOrThrow } from './common/utils/util'
import session from 'express-session'

const app = express()

app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(express.urlencoded());
app.use(
    session({
        secret: getEnvOrThrow('SESSION_SECRET'),
        resave: false,
        saveUninitialized: false,
        cookie: { secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 }
    })
);


// Routes
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/resumes', resumeRouter)
app.use('/api/templates', templateRouter)

export default app