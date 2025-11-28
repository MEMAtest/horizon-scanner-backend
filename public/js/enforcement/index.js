import { EnforcementDashboard } from './dashboard-core.js'
import { registerDashboardActions } from './actions/index.js'

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new EnforcementDashboard()
  registerDashboardActions(dashboard)
  // Expose globally for onclick handlers in rendered HTML
  window.enforcementDashboard = dashboard
})
