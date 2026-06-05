import http from 'http'
import handler from 'serve-handler'

const PORT = Number(process.env.PORT || 3000)

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: 'dist',
    cleanUrls: false,
    rewrites: [
      {
        source: '**',
        destination: '/index.html'
      }
    ]
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving frontend static files on http://0.0.0.0:${PORT}`)
})

const shutdown = () => {
  server.close(() => {
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
