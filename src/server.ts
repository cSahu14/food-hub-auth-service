import app from './app'
import { Config } from './config'

const startServer = () => {
    try {
        const PORT = Config.PORT
        app.listen(PORT, () => {
            console.log(`Server start on port ${PORT}`)
        })
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

startServer()
