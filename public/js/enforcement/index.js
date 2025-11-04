import { EnforcementDashboard } from './dashboard-core.js'
import { registerDashboardActions } from './actions/index.js'

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new EnforcementDashboard()
  registerDashboardActions(dashboard)
})
