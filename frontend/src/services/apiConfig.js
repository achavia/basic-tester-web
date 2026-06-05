export const getApiUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3001'
  }

  return ''
}