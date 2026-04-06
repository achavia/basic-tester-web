import { useState, useEffect } from 'react'
import '../styles/components.css'

function QuickTest({ schema, targetUrl, loginCredentials, hasAuth }) {
  const [testData, setTestData] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Initialize test data with default values
  useEffect(() => {
    const data = {}
    if (schema && schema.fields) {
      schema.fields.forEach(field => {
        if (field.type === 'checkbox') {
          data[field.name] = false
        } else if (field.type === 'select') {
          data[field.name] = field.options?.[0] || ''
        } else {
          data[field.name] = ''
        }
      })
    }
    setTestData(data)
  }, [schema])

  const handleInputChange = (fieldName, value, fieldType) => {
    setTestData(prev => ({
      ...prev,
      [fieldName]: fieldType === 'checkbox' ? !prev[fieldName] : value
    }))
  }

  const handleRunTest = async () => {
    setError('')
    setResult(null)

    // Validate required fields
    if (schema && schema.fields) {
      const missingFields = schema.fields
        .filter(f => f.required && !testData[f.name])
        .map(f => f.label || f.name)

      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`)
        return
      }
    }

    // Check if authentication is required but not provided
    if (hasAuth && (!loginCredentials || !loginCredentials.login)) {
      setError('Authentication credentials are required for this URL. Please go back and configure authentication in the "Authentication" tab first.')
      return
    }

    try {
      setIsRunning(true)

      const getApiUrl = () => {
        if (import.meta.env.DEV) {
          return 'http://localhost:3001'
        }
        return ''
      }

      const response = await fetch(`${getApiUrl()}/api/run-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUrl,
          formSchema: schema,
          testData,
          authentication: hasAuth ? loginCredentials : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Test execution failed')
      }

      const data = await response.json()
      setResult(data)

    } catch (err) {
      setError(err.message || 'Failed to run test')
    } finally {
      setIsRunning(false)
    }
  }

  if (!schema || !schema.fields || schema.fields.length === 0) {
    return null
  }

  return (
    <div className="quick-test">
      <div className="quick-test-header">
        <h3>Quick Test Fields</h3>
        <p className="quick-test-description">Enter test values below and click "Run Test" to test the form immediately</p>
        
        {hasAuth && loginCredentials && loginCredentials.login && (
          <div className="auth-indicator">
            <span className="auth-badge">🔐 Authentication Enabled</span>
            <small>Using credentials: {loginCredentials.login}</small>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="quick-test-fields">
        {schema.fields.map((field, index) => (
          <div key={index} className="quick-test-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>

            {/* Text, Email, Password, Phone, URL, Number inputs */}
            {['text', 'email', 'password', 'tel', 'url', 'number'].includes(field.type) && (
              <input
                type={field.type}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={testData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
              />
            )}

            {/* Textarea */}
            {field.type === 'textarea' && (
              <textarea
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={testData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value, 'textarea')}
                rows="3"
              ></textarea>
            )}

            {/* Select */}
            {field.type === 'select' && (
              <select 
                value={testData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value, 'select')}
              >
                <option value="">Select an option...</option>
                {(field.options || []).map((option, i) => (
                  <option key={i} value={option}>{option}</option>
                ))}
              </select>
            )}

            {/* Checkbox */}
            {field.type === 'checkbox' && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={testData[field.name] || false}
                  onChange={(e) => handleInputChange(field.name, e.target.checked, 'checkbox')}
                />
                <span>{field.label}</span>
              </label>
            )}

            {/* Radio */}
            {field.type === 'radio' && (
              <div className="radio-group">
                {(field.options || []).map((option, i) => (
                  <label key={i} className="radio-label">
                    <input
                      type="radio"
                      name={field.name}
                      value={option}
                      checked={testData[field.name] === option}
                      onChange={(e) => handleInputChange(field.name, e.target.value, 'radio')}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Date */}
            {field.type === 'date' && (
              <input
                type="date"
                value={testData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value, 'date')}
              />
            )}

            {/* File */}
            {field.type === 'file' && (
              <input
                type="file"
                onChange={(e) => handleInputChange(field.name, e.target.files[0], 'file')}
              />
            )}
          </div>
        ))}
      </div>

      <div className="quick-test-actions">
        <button
          className="btn btn-success"
          onClick={handleRunTest}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running Test...' : '▶ Run Test'}
        </button>
      </div>

      {result && (
        <div className="test-result">
          <div className={`result-header result-${result.status}`}>
            <h4>Test Result: {result.status.toUpperCase()}</h4>
            <p>{result.message}</p>
          </div>

          {result.screenshot && (
            <div className="result-section">
              <h5>Form Screenshot (Before)</h5>
              <img src={result.screenshot} alt="Form Screenshot" className="result-screenshot" />
            </div>
          )}

          {result.afterSubmitScreenshot && (
            <div className="result-section">
              <h5>Page Screenshot (After Submit)</h5>
              <img src={result.afterSubmitScreenshot} alt="After Submit Screenshot" className="result-screenshot" />
            </div>
          )}

          <div className="result-details">
            <div className="result-row">
              <span>Final URL:</span>
              <a href={result.finalUrl} target="_blank" rel="noopener noreferrer">{result.finalUrl}</a>
            </div>
            <div className="result-row">
              <span>Duration:</span>
              <span>{result.duration}ms</span>
            </div>
            <div className="result-row">
              <span>Timestamp:</span>
              <span>{new Date(result.timestamp).toLocaleString()}</span>
            </div>
            {result.error && (
              <div className="result-row error">
                <span>Error:</span>
                <span>{result.error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickTest
