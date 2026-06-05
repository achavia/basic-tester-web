import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import handler from 'serve-handler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)

const server = http.createServer(async (request, response) => {
  const method = request.method
  const url = request.url

  console.log(`[${new Date().toISOString()}] ${method} ${url}`)

  // Health check endpoints
  if (url === '/health' || url === '/healthz' || url === '/.well-known/health-check') {
    response.writeHead(200, { 'Content-Type': 'application/json' })
    return response.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
  }

  // Serve static files from dist
  try {
    return await handler(request, response, {
      public: path.join(__dirname, 'dist'),
      cleanUrls: false,
      rewrites: [
        {
          source: '**/*.!(js|css|json|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|map)',
          destination: '/index.html'
        },
        {
          source: '**',
          destination: '/index.html'
        }
      ]
    })
  } catch (error) {
    console.error(`[ERROR] ${url}:`, error.message)
    response.writeHead(500, { 'Content-Type': 'application/json' })
    return response.end(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }))
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] Serving frontend from ${path.join(__dirname, 'dist')} on http://0.0.0.0:${PORT}`)
})

const shutdown = () => {
  console.log('[SHUTDOWN] Closing server gracefully')
  server.close(() => {
    console.log('[EXIT] Server closed')
    process.exit(0)
  })
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[FORCE_EXIT] Forcing exit after 10 seconds')
    process.exit(1)
  }, 10000)
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
