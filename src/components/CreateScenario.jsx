import { useState } from 'react'
import AutoDetectForm from './AutoDetectForm'
import SchemaEditor from './SchemaEditor'
import QuickTest from './QuickTest'
import '../styles/components.css'

const DEFAULT_SCHEMA = {
  title: 'New Test Form',
  description: 'Test form',
  fields: []
}

function CreateScenario({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetUrl: '',
    hasAuth: false,
    formSchema: DEFAULT_SCHEMA,
    loginCredentials: {
      loginUrl: '',
      loginField: 'login',
      emailField: 'email',
      passwordField: 'password',
      login: '',
      email: '',
      password: ''
    }
  })

  const [activeTab, setActiveTab] = useState('basic')
  const [errorMessage, setErrorMessage] = useState('')

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      loginCredentials: {
        ...prev.loginCredentials,
        [name]: value
      }
    }))
  }

  const handleSchemaChange = (newSchema) => {
    setFormData(prev => ({
      ...prev,
      formSchema: newSchema
    }))
  }

  const handleAutoDetect = (detectedSchema) => {
    handleSchemaChange(detectedSchema)
    setActiveTab('schema')
  }

  const handleUrlChange = (url) => {
    setFormData(prev => ({
      ...prev,
      targetUrl: url
    }))
  }

  const handleLoginCredentialsChange = (creds) => {
    setFormData(prev => ({
      ...prev,
      loginCredentials: creds
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!formData.name.trim()) {
      setErrorMessage('Scenario name is required')
      return
    }
    if (!formData.targetUrl.trim()) {
      setErrorMessage('Target URL is required')
      return
    }
    if (!formData.formSchema.fields || formData.formSchema.fields.length === 0) {
      setErrorMessage('Form schema must have at least one field')
      return
    }

    onSubmit(formData)
  }

  return (
    <div className="create-scenario">
      <div className="form-container">
        <h2>Create New Test Scenario</h2>

        {errorMessage && (
          <div className="alert alert-error">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tab Navigation */}
          <div className="tab-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'autodetect' ? 'active' : ''}`}
              onClick={() => setActiveTab('autodetect')}
            >
              Auto-Detect Fields
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
              onClick={() => setActiveTab('schema')}
            >
              Define Schema
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
              onClick={() => setActiveTab('auth')}
            >
              Authentication
            </button>
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Scenario Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleBasicChange}
                  placeholder="e.g., Login Form Test"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleBasicChange}
                  placeholder="Describe this test scenario"
                  className="input-field"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Target URL *</label>
                <input
                  type="url"
                  name="targetUrl"
                  value={formData.targetUrl}
                  onChange={handleBasicChange}
                  placeholder="https://example.com/form"
                  className="input-field"
                />
              </div>

              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  name="hasAuth"
                  checked={formData.hasAuth}
                  onChange={handleBasicChange}
                  id="hasAuth"
                />
                <label htmlFor="hasAuth">
                  This URL requires authentication
                </label>
              </div>
            </div>
          )}

          {/* Auto-Detect Tab */}
          {activeTab === 'autodetect' && (
            <div className="tab-content">
              <AutoDetectForm
                targetUrl={formData.targetUrl}
                hasAuth={formData.hasAuth}
                loginCredentials={formData.loginCredentials}
                onDetected={handleAutoDetect}
                onUrlChange={handleUrlChange}
                onCredentialsChange={handleLoginCredentialsChange}
              />
            </div>
          )}

          {/* Schema Editor Tab */}
          {activeTab === 'schema' && (
            <div className="tab-content">
              <SchemaEditor
                schema={formData.formSchema}
                onChange={handleSchemaChange}
              />
              
              {/* Show QuickTest if schema has fields */}
              {formData.formSchema && formData.formSchema.fields && formData.formSchema.fields.length > 0 && (
                <div className="quicktest-section">
                  <hr />
                  <QuickTest 
                    schema={formData.formSchema}
                    targetUrl={formData.targetUrl}
                    loginCredentials={formData.loginCredentials}
                    hasAuth={formData.hasAuth}
                  />
                </div>
              )}
            </div>
          )}

          {/* Authentication Tab */}
          {activeTab === 'auth' && formData.hasAuth && (
            <div className="tab-content">
              <div className="info-box">
                <p>Configure login credentials for this form</p>
              </div>

              <div className="form-group">
                <label>Login URL (optional)</label>
                <input
                  type="url"
                  name="loginUrl"
                  value={formData.loginCredentials.loginUrl}
                  onChange={handleLoginChange}
                  placeholder="https://example.com/login"
                  className="input-field"
                />
                <small>Leave empty if same as target URL</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Login Field Name</label>
                  <input
                    type="text"
                    name="loginField"
                    value={formData.loginCredentials.loginField}
                    onChange={handleLoginChange}
                    placeholder="login"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Login Value</label>
                  <input
                    type="text"
                    name="login"
                    value={formData.loginCredentials.login}
                    onChange={handleLoginChange}
                    placeholder="Login"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Field Name</label>
                  <input
                    type="text"
                    name="emailField"
                    value={formData.loginCredentials.emailField}
                    onChange={handleLoginChange}
                    placeholder="email"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Email Value</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.loginCredentials.email}
                    onChange={handleLoginChange}
                    placeholder="Email"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password Field Name</label>
                  <input
                    type="text"
                    name="passwordField"
                    value={formData.loginCredentials.passwordField}
                    onChange={handleLoginChange}
                    placeholder="password"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Password Value</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.loginCredentials.password}
                    onChange={handleLoginChange}
                    placeholder="Password"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Create Test Scenario
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateScenario
