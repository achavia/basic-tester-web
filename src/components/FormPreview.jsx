import '../styles/components.css'

function FormPreview({ schema }) {
  if (!schema || !schema.fields || schema.fields.length === 0) {
    return (
      <div className="preview-empty">
        <p>No fields defined yet</p>
        <small>Add fields to see the preview</small>
      </div>
    )
  }

  return (
    <div className="form-preview">
      {schema.title && <h4>{schema.title}</h4>}
      {schema.description && <p className="form-description">{schema.description}</p>}

      <div className="preview-form">
        {schema.fields.map((field, index) => (
          <div key={index} className="preview-field">
            {field.label && (
              <label>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
            )}

            {/* Text, Email, Password, Phone, URL inputs */}
            {['text', 'email', 'password', 'tel', 'url', 'number'].includes(field.type) && (
              <input
                type={field.type}
                placeholder={field.placeholder || ''}
                disabled
                defaultValue={field.defaultValue || ''}
              />
            )}

            {/* Textarea */}
            {field.type === 'textarea' && (
              <textarea
                placeholder={field.placeholder || ''}
                disabled
                defaultValue={field.defaultValue || ''}
                rows="3"
              ></textarea>
            )}

            {/* Select */}
            {field.type === 'select' && (
              <select disabled defaultValue={field.defaultValue || ''}>
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
                  disabled
                  defaultChecked={field.defaultValue || false}
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
                      disabled
                      defaultChecked={field.defaultValue === option}
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
                disabled
                defaultValue={field.defaultValue || ''}
              />
            )}

            {/* File */}
            {field.type === 'file' && (
              <input
                type="file"
                disabled
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FormPreview
