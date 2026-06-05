import { useState, useEffect } from 'react'
import ScenarioList from './components/ScenarioList'
import CreateScenario from './components/CreateScenario'
import EditScenario from './components/EditScenario'
import RunTest from './components/RunTest'
import { getScenarios, addScenario, updateScenario, deleteScenario, saveTestResult } from './services/storageService'

function App() {
  const [currentPage, setCurrentPage] = useState('list')
  const [scenarios, setScenarios] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [runningId, setRunningId] = useState(null)

  // Load scenarios on mount
  useEffect(() => {
    const saved = getScenarios()
    setScenarios(saved)
  }, [])

  const handleCreateClick = () => {
    setEditingId(null)
    setCurrentPage('create')
  }

  const handleEditClick = (id) => {
    setEditingId(id)
    setCurrentPage('edit')
  }

  const handleRunClick = (id) => {
    setRunningId(id)
    setCurrentPage('run')
  }

  const handleCreateScenario = (scenario) => {
    const newScenario = {
      ...scenario,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      lastResult: null,
      testHistory: []
    }
    addScenario(newScenario)
    setScenarios([...scenarios, newScenario])
    setCurrentPage('list')
  }

  const handleSaveTestResult = (scenarioId, result) => {
    try {
      const updatedScenario = saveTestResult(scenarioId, result)
      setScenarios(scenarios.map(s => s.id === scenarioId ? updatedScenario : s))
    } catch (err) {
      console.error('Failed to save test result', err)
    }
  }

  const handleUpdateScenario = (scenario) => {
    updateScenario(scenario)
    setScenarios(scenarios.map(s => s.id === scenario.id ? scenario : s))
    setCurrentPage('list')
  }

  const handleDeleteScenario = (id) => {
    deleteScenario(id)
    setScenarios(scenarios.filter(s => s.id !== id))
  }

  const editingScenario = scenarios.find(s => s.id === editingId)
  const runningScenario = scenarios.find(s => s.id === runningId)

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 onClick={() => setCurrentPage('list')} style={{ cursor: 'pointer' }}>
            BasicTester
          </h1>
          <p className="tagline">Developer Pre-QA Testing Tool</p>
        </div>
      </header>

      <nav className="nav">
        <button 
          className={`nav-btn ${currentPage === 'list' ? 'active' : ''}`}
          onClick={() => setCurrentPage('list')}
        >
          Scenarios
        </button>
        <button 
          className={`nav-btn ${currentPage === 'create' ? 'active' : ''}`}
          onClick={handleCreateClick}
        >
          Create New Test
        </button>
      </nav>

      <main className="main-content">
        {currentPage === 'list' && (
          <ScenarioList 
            scenarios={scenarios}
            onEdit={handleEditClick}
            onDelete={handleDeleteScenario}
            onRun={handleRunClick}
            onCreate={handleCreateClick}
          />
        )}
        {currentPage === 'create' && (
          <CreateScenario 
            onSubmit={handleCreateScenario}
            onCancel={() => setCurrentPage('list')}
          />
        )}
        {currentPage === 'edit' && editingScenario && (
          <EditScenario
            scenario={editingScenario}
            onSubmit={handleUpdateScenario}
            onCancel={() => setCurrentPage('list')}
          />
        )}
        {currentPage === 'run' && runningScenario && (
          <RunTest
            scenario={runningScenario}
            onBack={() => setCurrentPage('list')}
            onSaveResult={handleSaveTestResult}
          />
        )}
      </main>

      <footer className="footer">
        <p>&copy; 2024 BasicTester. Built with React + Playwright.</p>
      </footer>
    </div>
  )
}

export default App
