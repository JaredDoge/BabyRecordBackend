import express, { type Request, type Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import caregiverRoutes from './routes/caregivers'
import recordRoutes from './routes/records'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/caregivers', caregiverRoutes)
app.use('/api/records', recordRoutes)

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
