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

function getOptionValue(option) {
  if (option === undefined || option === null) return ''
  if (typeof option === 'object') {
    return option.value ?? option.label ?? ''
  }
  return option
}

export function getSampleValueForField(field) {
  const value = field.defaultValue
  if (value !== undefined && value !== null && value !== '') {
    return value
  }

  const firstOption = Array.isArray(field.options) && field.options.length > 0
    ? getOptionValue(field.options[0])
    : ''

  switch (field.type) {
    case 'email':
      return 'test@example.com'
    case 'password':
      return 'Password123!'
    case 'tel':
      return '123-456-7890'
    case 'url':
      return 'https://example.com'
    case 'number':
      return 123
    case 'textarea':
      return 'This is a sample text input for testing.'
    case 'select':
      return firstOption
    case 'checkbox':
      // For checkbox with options, select the first value
      // For single checkbox, set to true
      return Array.isArray(field.options) && field.options.length > 0
        ? firstOption
        : true
    case 'radio':
      return firstOption
    case 'date':
      return new Date().toISOString().split('T')[0]
    case 'file':
      return null
    default:
      return 'Sample value'
  }
}

export function generateSampleData(schema) {
  const data = {}
  if (!schema || !schema.fields) return data

  schema.fields.forEach(field => {
    data[field.name] = getSampleValueForField(field)
  })

  return data
}

export function getErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  return 'An unknown error occurred'
}
