/**
 * Real auto-detection service using backend Playwright
 * Calls the Node.js backend that uses Playwright to analyze actual form fields
 */

import { getApiUrl } from './apiConfig'

const API_URL = getApiUrl()

export async function autoDetectFields(targetUrl, loginCredentials = null) {
  // Validate URL
  try {
    new URL(targetUrl)
  } catch {
    throw new Error('Invalid URL format')
  }

  try {
    const response = await fetch(`${API_URL}/api/detect-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUrl,
        authentication: loginCredentials
      })
    })

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch (parseError) {
        // If response body is not valid JSON, use default error message
        console.warn('Failed to parse error response as JSON:', parseError.message)
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Failed to detect form fields')
    }

    if (!data.schema || !data.schema.fields) {
      throw new Error('No form fields detected on the page')
    }

    return data.schema
  } catch (error) {
    // Check if backend is running
    if (error.message.includes('Failed to fetch')) {
      throw new Error(
        'Backend server is not running. Please start it with: npm run server'
      )
    }
    throw error
  }
}
