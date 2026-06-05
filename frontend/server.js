import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)
const app = express()
const distPath = path.join(__dirname, 'dist')

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  next()
})

app.get(['/health', '/healthz', '/.well-known/health-check'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(express.static(distPath, {
  maxAge: '0',
  index: false
}))

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      console.error('[SEND_FILE_ERROR]', err)
      res.status(500).json({ error: 'Internal Server Error', message: err.message })
    }
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] Express frontend server listening on http://0.0.0.0:${PORT}`)
})

const shutdown = () => {
  console.log('[SHUTDOWN] Closing server gracefully')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error)
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION]', reason)
})
