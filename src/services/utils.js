export function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function truncateUrl(url, length = 50) {
  if (url.length <= length) return url
  return url.substring(0, length) + '...'
}

export function validateUrl(urlString) {
  try {
    new URL(urlString)
    return true
  } catch {
    return false
  }
}

export function validateJSON(jsonString) {
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

export function getErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  return 'An unknown error occurred'
}
