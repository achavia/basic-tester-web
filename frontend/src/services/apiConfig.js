export const getApiUrl = () => {
  const rawApiUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : ''

  if (rawApiUrl) {
    try {
      const normalizedUrl = rawApiUrl.includes('://')
        ? rawApiUrl
        : `https://${rawApiUrl}`
      return new URL(normalizedUrl).toString().replace(/\/$/, '')
    } catch (error) {
      throw new Error(`VITE_API_BASE_URL is invalid: ${rawApiUrl}`)
    }
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3001'
  }

  throw new Error('VITE_API_BASE_URL is not defined. Set it to your backend API URL.')
}
