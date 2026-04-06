import { useState } from 'react'
import FormPreview from './FormPreview'
import '../styles/components.css'

const FIELD_TYPES = [
  'text', 'email', 'password', 'number', 'tel', 'url',
  'textarea', 'select', 'checkbox', 'radio', 'date', 'file'
]

function SchemaEditor({ schema, onChange }) {
  const [schemaJson, setSchemaJson] = useState(JSON.stringify(schema, null, 2))
  const [jsonError, setJsonError] = useState('')
  const [activeField, setActiveField] = useState(null)

  const handleJsonChange = (e) => {
    const newJson = e.target.value
    setSchemaJson(newJson)
    setJsonError('')

    try {
      const parsed = JSON.parse(newJson)
      onChange(parsed)
    } catch (err) {
      setJsonError('Invalid JSON: ' + err.message)
    }
  }

  const addField = () => {
    try {
      const currentSchema = JSON.parse(schemaJson)
      const newField = {
        name: `field_${currentSchema.fields.length + 1}`,
        label: 'New Field',
        type: 'text',
        required: false
      }
      const updated = {
        ...currentSchema,
        fields: [...currentSchema.fields, newField]
      }
      const result = JSON.stringify(updated, null, 2)
      setSchemaJson(result)
      onChange(updated)
      setActiveField(currentSchema.fields.length)
    } catch (err) {
      setJsonError('Cannot add field: ' + err.message)
    }
  }

  const removeField = (index) => {
    try {
      const currentSchema = JSON.parse(schemaJson)
      const updated = {
        ...currentSchema,
        fields: currentSchema.fields.filter((_, i) => i !== index)
      }
      const result = JSON.stringify(updated, null, 2)
      setSchemaJson(result)
      onChange(updated)
      setActiveField(null)
    } catch (err) {
      setJsonError('Cannot remove field: ' + err.message)
    }
  }

  const updateField = (index, field) => {
    try {
      const currentSchema = JSON.parse(schemaJson)
      const updated = {
        ...currentSchema,
        fields: currentSchema.fields.map((f, i) => i === index ? field : f)
      }
      const result = JSON.stringify(updated, null, 2)
      setSchemaJson(result)
      onChange(updated)
    } catch (err) {
      setJsonError('Cannot update field: ' + err.message)
    }
  }

  const currentSchema = JSON.parse(schemaJson)

  return (
    <div className="schema-editor">
      <div className="editor-layout">
        {/* JSON Editor */}
        <div className="json-editor-section">
          <div className="section-header">
            <h3>Form Schema (JSON)</h3>
            <button 
              type="button"
              className="btn btn-small btn-secondary"
              onClick={addField}
            >
              + Add Field
            </button>
          </div>

          {jsonError && (
            <div className="alert alert-error">
              {jsonError}
            </div>
          )}

          <textarea
            value={schemaJson}
            onChange={handleJsonChange}
            className="json-editor"
            spellCheck="false"
          ></textarea>

          {/* Field Inspector */}
          {activeField !== null && currentSchema.fields[activeField] && (
            <div className="field-inspector">
              <h4>Edit Field</h4>
              <FieldInspector
                field={currentSchema.fields[activeField]}
                onChange={(updated) => updateField(activeField, updated)}
                onRemove={() => removeField(activeField)}
              />
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="preview-section">
          <h3>Form Preview</h3>
          <FormPreview schema={currentSchema} />
        </div>
      </div>
    </div>
  )
}

function FieldInspector({ field, onChange, onRemove }) {
  const handleChange = (key, value) => {
    const updated = { ...field, [key]: value }
    onChange(updated)
  }

  return (
    <div className="field-inspector-form">
      <div className="form-group">
        <label>Field Name *</label>
        <input
          type="text"
          value={field.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="input-field"
          placeholder="fieldName"
        />
      </div>

      <div className="form-group">
        <label>Field Label</label>
        <input
          type="text"
          value={field.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          className="input-field"
          placeholder="Display label"
        />
      </div>

      <div className="form-group">
        <label>Field Type *</label>
        <select
          value={field.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="input-field"
        >
          {FIELD_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="form-group checkbox">
        <input
          type="checkbox"
          checked={field.required || false}
          onChange={(e) => handleChange('required', e.target.checked)}
          id="required"
        />
        <label htmlFor="required">Required</label>
      </div>

      <div className="form-group">
        <label>Placeholder</label>
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={(e) => handleChange('placeholder', e.target.value)}
          className="input-field"
          placeholder="Enter placeholder text"
        />
      </div>

      <div className="form-group">
        <label>Default Value</label>
        <input
          type="text"
          value={field.defaultValue || ''}
          onChange={(e) => handleChange('defaultValue', e.target.value)}
          className="input-field"
          placeholder="Default value"
        />
      </div>

      {(field.type === 'select' || field.type === 'radio') && (
        <div className="form-group">
          <label>Options (comma-separated)</label>
          <input
            type="text"
            value={(field.options || []).join(', ')}
            onChange={(e) => handleChange('options', e.target.value.split(',').map(o => o.trim()))}
            className="input-field"
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      )}

      <button
        type="button"
        className="btn btn-danger btn-small"
        onClick={onRemove}
      >
        Remove Field
      </button>
    </div>
  )
}

export default SchemaEditor
