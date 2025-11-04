import { showMessage } from '../ui/toast.js'

async function refreshData() {
  console.log('[refresh] Refreshing enforcement data...')
  try {
    const response = await fetch('/api/enforcement/update', { method: 'POST' })
    const data = await response.json()

    if (data.success) {
      showMessage('Data refreshed successfully', 'success')
      window.location.reload()
    } else {
      throw new Error(data.error || 'Refresh failed')
    }
  } catch (error) {
    console.error('[error] Refresh error:', error)
    showMessage('Refresh failed: ' + error.message, 'error')
  }
}

function exportData(dashboard) {
  const fines = (Array.isArray(dashboard.latestFilteredFines) && dashboard.latestFilteredFines.length)
    ? dashboard.latestFilteredFines
    : dashboard.allFines

  if (!Array.isArray(fines) || fines.length === 0) {
    showMessage('No data available to export', 'error')
    return
  }

  const csv = dashboard.buildFinesCsv(fines)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'enforcement_export_' + new Date().toISOString().slice(0, 10) + '.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function registerDashboardActions(dashboard) {
  window.enforcementDashboard = dashboard
  window.refreshData = () => refreshData()
  window.exportData = () => exportData(dashboard)

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-enforcement-action]')
    if (!button) return
    event.preventDefault()

    const action = button.getAttribute('data-enforcement-action')
    if (action === 'refresh') {
      refreshData()
    } else if (action === 'export') {
      exportData(dashboard)
    }
  })
}

export { registerDashboardActions }
