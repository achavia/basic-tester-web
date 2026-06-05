import { useState, useEffect } from 'react'
import '../styles/components.css'
import { generateSampleData } from '../services/utils'
import { getApiUrl } from '../services/apiConfig'

function RunTest({ scenario, onBack, onSaveResult }) {
  const [testData, setTestData] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loginCreds, setLoginCreds] = useState(scenario.loginCredentials || {})

  // Initialize test data with empty values for each field
  const initializeTestData = () => {
    const data = {}
    scenario.formSchema.fields.forEach(field => {
      if (field.type === 'checkbox' || field.type === 'radio') {
        data[field.name] = field.defaultValue || false
      } else if (field.type === 'select') {
        data[field.name] = field.defaultValue || (field.options?.[0] || '')
      } else {
        data[field.name] = field.defaultValue || ''
      }
    })
    setTestData(data)
  }

  useEffect(() => {
    setLoginCreds(scenario.loginCredentials || {})
    initializeTestData()
  }, [scenario])

  const handleAutoFill = () => {
    setTestData(generateSampleData(scenario.formSchema))
  }

  const handleInputChange = (fieldName, value, fieldType) => {
    if (fieldType === 'checkbox') {
      setTestData(prev => ({
        ...prev,
        [fieldName]: value
      }))
    } else {
      setTestData(prev => ({
        ...prev,
        [fieldName]: value
      }))
    }
  }

  const handleRunTest = async () => {
    setError('')
    setResult(null)

    // Validate required fields
    const missingFields = scenario.formSchema.fields
      .filter(f => f.required && !testData[f.name])
      .map(f => f.label || f.name)

    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`)
      return
    }

    try {
      setIsRunning(true)

      const response = await fetch(`${getApiUrl()}/api/run-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUrl: scenario.targetUrl,
          formSchema: scenario.formSchema,
          testData,
          authentication: scenario.hasAuth ? loginCreds : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Test execution failed')
      }

      const data = await response.json()
      setResult(data)
      if (onSaveResult) {
        onSaveResult(scenario.id, data)
      }

    } catch (err) {
      setError(err.message || 'Failed to run test')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="run-test">
      <button className="btn btn-secondary back-btn" onClick={onBack}>
        ← Back to Scenarios
      </button>

      <div className="run-test-container">
        <div className="test-header">
          <h2>{scenario.name}</h2>
          <p>{scenario.description}</p>
          <div className="test-url">
            <strong>URL:</strong> <code>{scenario.targetUrl}</code>
          </div>
        </div>

        {scenario.testHistory && scenario.testHistory.length > 0 && (
          <div className="history-summary">
            <h4>Recent Test Runs</h4>
            <div className="history-grid">
              {scenario.testHistory.slice(0, 3).map((run, index) => (
                <div key={index} className={`history-card history-${run.status}`}>
                  <div className="history-title">{run.status.toUpperCase()}</div>
                  <div>{new Date(run.timestamp).toLocaleString()}</div>
                  <div>{run.duration}ms</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && (
          <div className="test-form-section">
            <h3>Fill Test Data</h3>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleRunTest() }}>
              <div className="test-form">
                {/* Authentication Section */}
                {scenario.hasAuth && (
                  <div className="auth-section">
                    <h4>🔐 Authentication Credentials</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Login</label>
                        <input
                          type="text"
                          value={loginCreds.login || ''}
                          onChange={(e) => setLoginCreds({ ...loginCreds, login: e.target.value })}
                          placeholder="Enter login"
                          className="input-field"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={loginCreds.email || ''}
                          onChange={(e) => setLoginCreds({ ...loginCreds, email: e.target.value })}
                          placeholder="Enter email"
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Password</label>
                        <input
                          type="password"
                          value={loginCreds.password || ''}
                          onChange={(e) => setLoginCreds({ ...loginCreds, password: e.target.value })}
                          placeholder="Enter password"
                          className="input-field"
                        />
                      </div>
                    </div>
                    <div className="divider"></div>
                  </div>
                )}

                <div className="form-group auto-fill-group">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAutoFill}
                  >
                    Auto Fill Values
                  </button>
                </div>

                {/* Form Fields Section */}
                {scenario.formSchema.fields.map(field => (
                  <div key={field.name} className="form-group">
                    <label>
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>

                    {/* Text, Email, Password, etc. */}
                    {['text', 'email', 'password', 'tel', 'url', 'number'].includes(field.type) && (
                      <input
                        type={field.type}
                        value={testData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="input-field"
                      />
                    )}

                    {/* Textarea */}
                    {field.type === 'textarea' && (
                      <textarea
                        value={testData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="input-field"
                        rows="4"
                      ></textarea>
                    )}

                    {/* Select */}
                    {field.type === 'select' && (
                      <select
                        value={testData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                        required={field.required}
                        className="input-field"
                      >
                        <option value="">Select an option...</option>
                        {(field.options || []).map((option, idx) => {
                          const optionValue = typeof option === 'object' ? (option.value || option.label) : option
                          const optionLabel = typeof option === 'object' ? option.label : option
                          return (
                            <option key={idx} value={optionValue}>{optionLabel}</option>
                          )
                        })}
                      </select>
                    )}

                    {/* Checkbox */}
                    {field.type === 'checkbox' && (
                      <>
                        {field.options && field.options.length > 0 ? (
                          <div className="checkbox-group">
                            {field.options.map((option, idx) => {
                              const optionValue = typeof option === 'object' ? (option.value || option.label) : option
                              const optionLabel = typeof option === 'object' ? option.label : option
                              return (
                                <label key={idx} className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    value={optionValue}
                                    checked={Array.isArray(testData[field.name]) ? testData[field.name].includes(optionValue) : testData[field.name] === optionValue}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked
                                      if (Array.isArray(testData[field.name])) {
                                        const newValue = isChecked
                                          ? [...testData[field.name], optionValue]
                                          : testData[field.name].filter(v => v !== optionValue)
                                        handleInputChange(field.name, newValue, 'checkbox')
                                      } else {
                                        handleInputChange(field.name, isChecked ? [optionValue] : [], 'checkbox')
                                      }
                                    }}
                                  />
                                  <span>{optionLabel}</span>
                                </label>
                              )
                            })}
                          </div>
                        ) : (
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={testData[field.name] || false}
                              onChange={(e) => handleInputChange(field.name, e.target.checked, field.type)}
                            />
                            <span>{field.label}</span>
                          </label>
                        )}
                      </>
                    )}

                    {/* Radio */}
                    {field.type === 'radio' && (
                      <div className="radio-group">
                        {(field.options || []).map((option, idx) => {
                          const optionValue = typeof option === 'object' ? (option.value || option.label) : option
                          const optionLabel = typeof option === 'object' ? option.label : option
                          return (
                            <label key={idx} className="radio-label">
                              <input
                                type="radio"
                                name={field.name}
                                value={optionValue}
                                checked={testData[field.name] === optionValue}
                                onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                              />
                              <span>{optionLabel}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {/* Date */}
                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={testData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                        required={field.required}
                        className="input-field"
                      />
                    )}

                    {/* File */}
                    {field.type === 'file' && (
                      <input
                        type="file"
                        onChange={(e) => handleInputChange(field.name, e.target.files[0], field.type)}
                        required={field.required}
                        className="input-field"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onBack}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRunning}
                  onClick={handleRunTest}
                >
                  {isRunning ? '⏳ Running Test...' : '▶️ Run Test'}
                </button>
              </div>
            </form>
          </div>
        )}

        {result && (
          <TestResults result={result} scenario={scenario} onBack={() => setResult(null)} />
        )}
      </div>
    </div>
  )
}

function TestResults({ result, scenario, onBack }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'success'
      case 'failed': return 'error'
      case 'error': return 'danger'
      default: return 'warning'
    }
  }

  return (
    <div className="test-results">
      <div className="results-header">
        <h3>Test Results</h3>
        <button type="button" className="btn btn-secondary btn-small" onClick={onBack}>
          Run Again
        </button>
      </div>

      {/* Status Badge */}
      <div className={`status-badge status-${result.status}`}>
        {result.status === 'passed' && '✓ PASSED'}
        {result.status === 'failed' && '✗ FAILED'}
        {result.status === 'error' && '⚠ ERROR'}
      </div>

      {/* Result Details */}
      <div className="results-details">
        <div className="result-row">
          <span className="label">Duration:</span>
          <span className="value">{result.duration}ms</span>
        </div>
        <div className="result-row">
          <span className="label">Submitted At:</span>
          <span className="value">{new Date(result.timestamp).toLocaleString()}</span>
        </div>
      </div>

      {/* Error Message */}
      {result.error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      {/* Success Message */}
      {result.status === 'passed' && (
        <div className="alert alert-success">
          Form submitted successfully!
        </div>
      )}

      {/* Screenshot */}
      {result.screenshot && (
        <div className="screenshot-section">
          <h4>Screenshot Before Submission</h4>
          <img 
            src={result.screenshot} 
            alt="Test screenshot before submission" 
            className="screenshot-image"
          />
        </div>
      )}

      {result.afterSubmitScreenshot && (
        <div className="screenshot-section">
          <h4>Screenshot After Submission</h4>
          <img 
            src={result.afterSubmitScreenshot} 
            alt="Test screenshot after submission" 
            className="screenshot-image"
          />
        </div>
      )}

      {/* Form Data Summary */}
      <div className="submitted-data">
        <h4>Submitted Data</h4>
        <div className="data-table">
          {Object.entries(result.submittedData || {}).map(([key, value]) => (
            <div key={key} className="data-row">
              <span className="data-key">{key}:</span>
              <span className="data-value">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Run Another Test
        </button>
      </div>
    </div>
  )
}

export default RunTest
