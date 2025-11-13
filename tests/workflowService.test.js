jest.mock('../src/services/dbService', () => ({
  listWorkflows: jest.fn(async () => [{ id: 1, title: 'Existing' }]),
  createWorkflow: jest.fn(async entry => ({ ...entry, id: 2 })),
  updateWorkflowStatus: jest.fn(async () => ({ id: 2, status: 'closed' }))
}))

jest.mock('../src/services/profileService', () => ({
  getActiveProfile: jest.fn(async () => ({ id: 'profile-1' }))
}))

const dbService = require('../src/services/dbService')
const profileService = require('../src/services/profileService')
const workflowService = require('../src/services/workflowService')

describe('workflowService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists workflows for a user', async () => {
    const list = await workflowService.listWorkflows('user-1', { status: 'open', limit: 5 })
    expect(dbService.listWorkflows).toHaveBeenCalledWith({ userId: 'user-1', status: 'open', limit: 5 })
    expect(list).toHaveLength(1)
  })

  it('creates a workflow with profile context', async () => {
    const payload = { title: 'New Workflow', sources: [{ label: 'FCA', url: 'https://fca.org' }] }
    const created = await workflowService.createWorkflow('user-2', payload)
    expect(profileService.getActiveProfile).toHaveBeenCalledWith('user-2')
    expect(dbService.createWorkflow).toHaveBeenCalledWith({ userId: 'user-2', profileId: 'profile-1', ...payload })
    expect(created.id).toBe(2)
  })

  it('updates workflow status', async () => {
    await workflowService.updateWorkflowStatus('user-3', 10, 'closed')
    expect(dbService.updateWorkflowStatus).toHaveBeenCalledWith(10, 'user-3', 'closed')
  })
})
