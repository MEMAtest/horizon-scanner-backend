const dbService = require('./dbService')
const profileService = require('./profileService')

class WorkflowService {
  async listWorkflows(userId = 'default', options = {}) {
    const records = await dbService.listWorkflows({
      userId,
      status: options.status,
      limit: options.limit || 20
    })
    return records
  }

  async createWorkflow(userId = 'default', payload = {}) {
    const profile = await profileService.getActiveProfile(userId)
    const record = await dbService.createWorkflow({
      userId,
      profileId: profile?.id || null,
      ...payload
    })
    return record
  }

  async updateWorkflowStatus(userId = 'default', workflowId, status) {
    return dbService.updateWorkflowStatus(workflowId, userId, status)
  }
}

module.exports = new WorkflowService()
