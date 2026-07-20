import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import roomRoutes from './routes/rooms'
import userRoutes from './routes/users'
import { initDb } from './db'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/users', userRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(\x60Admin API server running on http://localhost:\x60)
  })
})