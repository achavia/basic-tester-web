import { formatDate } from '../services/utils'
import '../styles/components.css'

function ScenarioList({ scenarios, onEdit, onDelete, onRun, onCreate }) {
  if (scenarios.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Test Scenarios Yet</h2>
        <p>Create your first test scenario to get started</p>
        <button className="btn btn-primary" onClick={onCreate}>
          Create New Test Scenario
        </button>
      </div>
    )
  }

  return (
    <div className="scenario-list">
      <div className="list-header">
        <h2>Test Scenarios</h2>
        <button className="btn btn-primary" onClick={onCreate}>
          + Create New Test
        </button>
      </div>

      <div className="scenarios-grid">
        {scenarios.map(scenario => (
          <div key={scenario.id} className="scenario-card">
            <div className="card-header">
              <h3>{scenario.name}</h3>
              <div className="card-badges">
                <span className="badge">
                  {scenario.hasAuth ? '🔐 Auth' : '🔓 No Auth'}
                </span>
              </div>
            </div>

            <p className="card-description">{scenario.description || 'No description'}</p>

            <div className="card-details">
              <div className="detail">
                <span className="label">URL:</span>
                <span className="value" title={scenario.targetUrl}>
                  {scenario.targetUrl.split('/').slice(2, 4).join('/')}...
                </span>
              </div>
              <div className="detail">
                <span className="label">Fields:</span>
                <span className="value">
                  {scenario.formSchema?.fields?.length || 0}
                </span>
              </div>
              <div className="detail">
                <span className="label">Last Run:</span>
                <span className="value">
                  {scenario.lastResult ? (
                    <span className={`status-badge status-${scenario.lastResult.status}`}>
                      {scenario.lastResult.status.toUpperCase()} • {new Date(scenario.lastResult.timestamp).toLocaleString()}
                    </span>
                  ) : 'Never run'}
                </span>
              </div>
              <div className="detail">
                <span className="label">History:</span>
                <span className="value">{scenario.testHistory?.length || 0} runs</span>
              </div>
              <div className="detail">
                <span className="label">Created:</span>
                <span className="value">{formatDate(scenario.createdAt)}</span>
              </div>
            </div>

            <div className="card-actions">
              <button 
                className="btn btn-primary"
                onClick={() => onRun(scenario.id)}
              >
                Run Test
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => onEdit(scenario.id)}
              >
                Edit
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (confirm(`Delete "${scenario.name}"?`)) {
                    onDelete(scenario.id)
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScenarioList
