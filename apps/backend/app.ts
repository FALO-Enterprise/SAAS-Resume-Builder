import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
// import authRouter from './modules/auth/auth.router'
// import usersRouter from './modules/users/users.router'

const app = express()

app.use(express.json())
app.use(cors())
app.use(helmet())

// Routes
// app.use('/api/auth', authRouter)
// app.use('/api/users', usersRouter)

export default app