const STORAGE_KEY = 'basicTester_scenarios'

export function getScenarios() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (err) {
    console.error('Error reading scenarios:', err)
    return []
  }
}

export function addScenario(scenario) {
  try {
    const scenarios = getScenarios()
    scenarios.push(scenario)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
    return scenario
  } catch (err) {
    console.error('Error adding scenario:', err)
    throw err
  }
}

export function updateScenario(scenario) {
  try {
    const scenarios = getScenarios()
    const index = scenarios.findIndex(s => s.id === scenario.id)
    if (index !== -1) {
      scenarios[index] = scenario
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
      return scenario
    }
    throw new Error('Scenario not found')
  } catch (err) {
    console.error('Error updating scenario:', err)
    throw err
  }
}

export function saveTestResult(scenarioId, result) {
  try {
    const scenarios = getScenarios()
    const index = scenarios.findIndex(s => s.id === scenarioId)
    if (index === -1) {
      throw new Error('Scenario not found')
    }

    const scenario = scenarios[index]
    const updatedScenario = {
      ...scenario,
      lastResult: result,
      testHistory: [result, ...(scenario.testHistory || [])].slice(0, 10)
    }

    scenarios[index] = updatedScenario
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
    return updatedScenario
  } catch (err) {
    console.error('Error saving test result:', err)
    throw err
  }
}

export function deleteScenario(id) {
  try {
    const scenarios = getScenarios()
    const filtered = scenarios.filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (err) {
    console.error('Error deleting scenario:', err)
    throw err
  }
}

export function getScenarioById(id) {
  const scenarios = getScenarios()
  return scenarios.find(s => s.id === id)
}
