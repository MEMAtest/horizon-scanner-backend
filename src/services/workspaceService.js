// src/services/workspaceService.js
// Minimal workspace service to prevent crashes

class WorkspaceService {
  async getWorkspaceStats() {
    return {
      stats: {
        pinnedItems: 0,
        savedSearches: 0,
        activeAlerts: 0,
        hasFirmProfile: false
      }
    }
  }

  async pinItem(url, title, authority, notes = '') {
    console.log('Workspace service stub: pinItem called')
    return { success: true }
  }

  async unpinItem(url) {
    console.log('Workspace service stub: unpinItem called')
    return { success: true }
  }

  async getPinnedItems() {
    return { items: [] }
  }
}

module.exports = new WorkspaceService()
