// Test script to verify auto-detect error handling
import http from 'http'

function testEndpoint() {
  console.log('Testing detect-form endpoint directly...')

  const postData = JSON.stringify({
    targetUrl: 'https://httpbin.org/html'
  })

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/detect-form',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }

  const req = http.request(options, (res) => {
    console.log('Response status:', res.statusCode)
    console.log('Response headers:', res.headers)

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      console.log('Response body:', data)

      try {
        const json = JSON.parse(data)
        console.log('Parsed JSON:', JSON.stringify(json, null, 2))
      } catch (parseError) {
        console.log('Failed to parse as JSON:', parseError.message)
      }
    })
  })

  req.on('error', (error) => {
    console.log('Request error:', error.message)
  })

  req.write(postData)
  req.end()
}

testEndpoint()