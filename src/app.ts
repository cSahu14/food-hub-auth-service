import express, { NextFunction, Request, Response } from 'express'
import 'reflect-metadata'
import { HttpError } from 'http-errors'
import logger from './config/logger'
import authRouter from './routes/auth'

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
    res.status(200).send('Welcome to auth service.')
})

app.use('/auth', authRouter)

// global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || 500

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                mssg: err.message,
                path: '',
                location: '',
            },
        ],
    })
})

export default app
