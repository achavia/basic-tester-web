export const getApiUrl = () => {
  const apiUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : ''

  if (apiUrl) {
    return apiUrl
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3001'
  }

  throw new Error('VITE_API_BASE_URL is not defined. Set it to your backend API URL.')
}
