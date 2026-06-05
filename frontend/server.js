import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)
const DIST_DIR = path.join(__dirname, 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8'
}

const sendJson = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  })
  response.end(JSON.stringify(payload))
}

const sendFile = async (response, filePath) => {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  const data = await fs.readFile(filePath)
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=0'
  })
  response.end(data)
}

const getPathname = (requestUrl) => {
  try {
    return new URL(requestUrl, 'http://localhost').pathname
  } catch {
    return requestUrl.split('?')[0]
  }
}

const server = http.createServer(async (request, response) => {
  const method = request.method
  const pathname = getPathname(request.url)
  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`)

  if (pathname === '/health' || pathname === '/healthz' || pathname === '/.well-known/health-check') {
    return sendJson(response, 200, { status: 'ok', timestamp: new Date().toISOString() })
  }

  try {
    let filePath = path.join(DIST_DIR, pathname)
    const isAsset = !!path.extname(pathname)

    if (!isAsset) {
      filePath = path.join(DIST_DIR, 'index.html')
    }

    try {
      const stats = await fs.stat(filePath)
      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }
      return await sendFile(response, filePath)
    } catch (error) {
      if (!isAsset) {
        return await sendFile(response, path.join(DIST_DIR, 'index.html'))
      }
      throw error
    }
  } catch (error) {
    console.error('[ERROR]', pathname, error)
    return sendJson(response, 500, {
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] Serving frontend from ${DIST_DIR} on http://0.0.0.0:${PORT}`)
})

const shutdown = () => {
  console.log('[SHUTDOWN] Closing server gracefully')
  server.close(() => {
    console.log('[EXIT] Server closed')
    process.exit(0)
  })
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
