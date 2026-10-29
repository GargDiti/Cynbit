import 'dotenv/config'
import dns from 'node:dns'
import path from 'node:path'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import leadsRouter from './leads.js'

const app = express()
const port = Number(process.env.PORT) || 3000

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '50kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

app.use('/api/leads', leadsRouter)
app.use('/api', (_request, response) => response.status(404).json({ error: 'API route not found.' }))
app.use(express.static(path.resolve('dist')))
app.get('*', (_request, response) => response.sendFile(path.resolve('dist/index.html')))

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.too.large') return response.status(413).json({ error: 'Request body is too large.' })
  if (error instanceof SyntaxError && 'body' in error) return response.status(400).json({ error: 'Request body must be valid JSON.' })
  console.error(error)
  return response.status(500).json({ error: 'Something went wrong.' })
})

async function start() {
  if (process.env.MONGODB_URI) {
    const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(',').map((server) => server.trim()).filter(Boolean)
    if (dnsServers?.length) dns.setServers(dnsServers)

    try {
      await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'cynbit', serverSelectionTimeoutMS: 10000 })
      console.info('Connected to MongoDB.')
    } catch (error) {
      console.error('MongoDB is unavailable; lead submissions will return 503:', error.message.replace(process.env.MONGODB_URI, '[hidden URI]'))
    }
  } else {
    console.warn('MONGODB_URI is not set; starting without a database connection.')
  }
  app.listen(port, () => console.info(`API server listening on http://localhost:${port}`))
}

start().catch((error) => {
  console.error('Could not start the API server:', error.message)
  process.exitCode = 1
})
