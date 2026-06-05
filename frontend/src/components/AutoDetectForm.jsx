import { useState } from 'react'
import { autoDetectFields } from '../services/autoDetectService'
import '../styles/components.css'

function AutoDetectForm({ targetUrl, hasAuth, loginCredentials, onDetected, onUrlChange, onCredentialsChange }) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionMessage, setDetectionMessage] = useState('')
  const [error, setError] = useState('')
  const [localUrl, setLocalUrl] = useState(targetUrl)
  const [localCreds, setLocalCreds] = useState(loginCredentials)

  const handleUrlChange = (e) => {
    const newUrl = e.target.value
    setLocalUrl(newUrl)
    if (onUrlChange) onUrlChange(newUrl)
  }

  const handleCredChange = (field, value) => {
    const updated = { ...localCreds, [field]: value }
    setLocalCreds(updated)
    if (onCredentialsChange) onCredentialsChange(updated)
  }

  const handleAutoDetect = async () => {
    setError('')
    setDetectionMessage('')

    if (!localUrl.trim()) {
      setError('Please enter a target URL first')
      return
    }

    // Validate authentication fields if enabled
    if (hasAuth && !localCreds.login) {
      setError('Please enter login for authentication')
      return
    }

    if (hasAuth && !localCreds.email) {
      setError('Please enter email for authentication')
      return
    }

    if (hasAuth && !localCreds.password) {
      setError('Please enter password for authentication')
      return
    }

    try {
      setIsDetecting(true)
      
      // Show authentication steps if enabled
      if (hasAuth) {
        const loginUrl = localCreds.loginUrl || localUrl
        setDetectionMessage(`🔐 Authenticating on ${new URL(loginUrl).hostname}...`)
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setDetectionMessage('🔐 Filling login credentials...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setDetectionMessage('🔐 Submitting login form...')
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setDetectionMessage('🔐 Waiting for redirect...')
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setDetectionMessage('🌐 Initializing Playwright...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setDetectionMessage('🌐 Opening target URL...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setDetectionMessage('🔍 Detecting form fields...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Call the detection service
      const schema = await autoDetectFields(localUrl, hasAuth ? localCreds : null)
      
      setDetectionMessage('✓ Form fields detected successfully!')
      if (hasAuth) {
        setDetectionMessage('✓ Authentication successful! Form fields detected from protected page.')
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onDetected(schema)
    } catch (err) {
      setError(`Detection failed: ${err.message}`)
    } finally {
      setIsDetecting(false)
    }
  }

  return (
    <div className="autodetect-form">
      <div className="info-box">
        <h4>Auto-Detect Form Fields</h4>
        <p>Playwright will analyze the target URL and automatically detect all form fields.</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {detectionMessage && (
        <div className="alert alert-info">
          {detectionMessage}
        </div>
      )}

      <div className="detection-section">
        <div className="form-group">
          <label>Target URL *</label>
          <input
            type="url"
            value={localUrl}
            onChange={handleUrlChange}
            className="input-field"
            placeholder="https://example.com/form"
          />
        </div>

        {hasAuth && (
          <div className="auth-preview">
            <h4>Authentication Details</h4>
            
            <div className="form-group">
              <label>Login URL (optional)</label>
              <input
                type="url"
                value={localCreds.loginUrl}
                onChange={(e) => handleCredChange('loginUrl', e.target.value)}
                className="input-field"
                placeholder="https://example.com/login"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Login Field Name</label>
                <input
                  type="text"
                  value={localCreds.loginField || ''}
                  onChange={(e) => handleCredChange('loginField', e.target.value)}
                  className="input-field"
                  placeholder="login"
                />
                <small>Name attribute (not label)</small>
              </div>
              <div className="form-group">
                <label>Login Value</label>
                <input
                  type="text"
                  value={localCreds.login || ''}
                  onChange={(e) => handleCredChange('login', e.target.value)}
                  className="input-field"
                  placeholder="Enter login"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Field Name</label>
                <input
                  type="text"
                  value={localCreds.emailField || ''}
                  onChange={(e) => handleCredChange('emailField', e.target.value)}
                  className="input-field"
                  placeholder="email"
                />
                <small>Name attribute (not label)</small>
              </div>
              <div className="form-group">
                <label>Email Value</label>
                <input
                  type="email"
                  value={localCreds.email || ''}
                  onChange={(e) => handleCredChange('email', e.target.value)}
                  className="input-field"
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password Field Name</label>
                <input
                  type="text"
                  value={localCreds.passwordField || ''}
                  onChange={(e) => handleCredChange('passwordField', e.target.value)}
                  className="input-field"
                  placeholder="password"
                />
                <small>Name attribute (not label)</small>
              </div>
              <div className="form-group">
                <label>Password Value</label>
                <input
                  type="password"
                  value={localCreds.password || ''}
                  onChange={(e) => handleCredChange('password', e.target.value)}
                  className="input-field"
                  placeholder="Enter password"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAutoDetect}
          disabled={isDetecting || !localUrl}
        >
          {isDetecting ? '⏳ Detecting...' : '🔍 Auto-Detect Form Fields'}
        </button>

        <div className="detection-info">
          <h4>What will be detected:</h4>
          <ul>
            <li>✓ Input fields (text, email, password, number, etc.)</li>
            <li>✓ Textarea elements</li>
            <li>✓ Select dropdowns with options</li>
            <li>✓ Checkboxes and radio buttons</li>
            <li>✓ File upload fields</li>
            <li>✓ Field labels and placeholder text</li>
            <li>✓ Required attributes</li>
          </ul>

          <h4>What will NOT be detected:</h4>
          <ul>
            <li>✗ Hidden fields</li>
            <li>✗ Submit buttons</li>
            <li>✗ Fields without name/id attributes</li>
          </ul>

          <div className="detection-tips">
            <h4>💡 Tips:</h4>
            <ul>
              <li>Make sure the target URL is accessible and returns a valid form</li>
              <li>If form is in an iframe, automatic detection may not work</li>
              <li>For complex forms, you may need to manually adjust the schema</li>
              <li>Use browser DevTools (F12) to inspect form elements for debugging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutoDetectForm
