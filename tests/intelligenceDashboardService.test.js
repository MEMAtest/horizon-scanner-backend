jest.mock('../src/services/dbService', () => ({
  getEnhancedUpdates: jest.fn(),
  listFeedbackScores: jest.fn(),
  getPinnedItems: jest.fn(),
  getSavedSearches: jest.fn(),
  getCustomAlerts: jest.fn()
}))

jest.mock('../src/services/annotationService', () => ({
  listAnnotations: jest.fn()
}))

jest.mock('../src/services/workspaceService', () => ({
  getWorkspaceStats: jest.fn()
}))

jest.mock('../src/services/profileService', () => ({
  getActiveProfile: jest.fn()
}))

jest.mock('../src/services/workflowRecommendationService', () => ({
  buildRecommendations: jest.fn(() => [
    { id: 'demo', title: 'Demo workflow', description: 'A test workflow', actions: [], reasons: ['Sample'], score: 42 }
  ])
}))

jest.mock('../src/services/relevanceService', () => ({
  calculateRelevanceScore: jest.fn(() => 85)
}))

jest.mock('../src/services/workflowService', () => ({
  listWorkflows: jest.fn(async () => []),
  createWorkflow: jest.fn()
}))

const dbService = require('../src/services/dbService')
const annotationService = require('../src/services/annotationService')
const workspaceService = require('../src/services/workspaceService')
const profileService = require('../src/services/profileService')
const workflowService = require('../src/services/workflowService')
const intelligenceDashboardService = require('../src/services/intelligenceDashboardService')

describe('intelligenceDashboardService.getDailySnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    profileService.getActiveProfile = jest.fn().mockResolvedValue({
      id: 'profile-1',
      serviceType: 'payments',
      secondaryServiceTypes: [],
      regions: ['UK'],
      personas: ['executive']
    })
    dbService.listFeedbackScores.mockResolvedValue([])
    workflowService.listWorkflows.mockResolvedValue([])
  })

  it('normalises published timestamps and sorts streams without throwing', async () => {
    const now = new Date('2025-11-03T12:00:00.000Z')
    const updateWithDateInstance = {
      id: 'primary-1',
      headline: 'Supervisory update one',
      authority: 'FCA',
      urgency: 'High',
      impact_level: 'Significant',
      ai_tags: ['persona:executive'],
      publishedAt: new Date('2025-11-03T09:30:00.000Z'),
      compliance_deadline: '2025-11-15T00:00:00.000Z'
    }

    const updateWithIsoString = {
      id: 'primary-2',
      headline: 'Supervisory update two',
      authority: 'PRA',
      urgency: 'Medium',
      impact_level: 'High',
      ai_tags: ['persona:analyst'],
      published_date: '2025-11-02T18:00:00.000Z',
      compliance_deadline: '2025-11-05T00:00:00.000Z'
    }

    dbService.getEnhancedUpdates
      .mockResolvedValueOnce([updateWithDateInstance, updateWithIsoString]) // today
      .mockResolvedValueOnce([updateWithDateInstance, updateWithIsoString]) // recent

    dbService.getPinnedItems.mockResolvedValue({ items: [] })
    dbService.getSavedSearches.mockResolvedValue({ searches: [] })
    dbService.getCustomAlerts.mockResolvedValue({ alerts: [] })
    workspaceService.getWorkspaceStats.mockResolvedValue({ stats: {} })
    annotationService.listAnnotations.mockResolvedValue([])

    const snapshot = await intelligenceDashboardService.getDailySnapshot({ now })

    expect(snapshot.streams.high).toHaveLength(2)
    snapshot.streams.high.forEach(update => {
      expect(typeof update.publishedAt).toBe('string')
      expect(update.publishedAt).toMatch(/T\d{2}:\d{2}:\d{2}\.000Z$/)
    })

    expect(snapshot.streams.high[0].headline).toBe('Supervisory update one')
    expect(snapshot.streams.high[1].headline).toBe('Supervisory update two')

    expect(snapshot.timeline).toHaveLength(2)
    expect(snapshot.timeline[0].date <= snapshot.timeline[1].date).toBe(true)
    expect(Array.isArray(snapshot.recommendedWorkflows)).toBe(true)
    expect(snapshot.recommendedWorkflows[0].id).toBe('demo')
    expect(Array.isArray(snapshot.savedWorkflows)).toBe(true)
  })

  it('marks pinned updates and surfaces persona metrics', async () => {
    const now = new Date('2025-11-03T12:00:00.000Z')
    const pinnedUpdate = {
      id: 'update-500',
      updateId: 'update-500',
      headline: 'HMRC settles major enforcement action',
      authority: 'HMRC',
      urgency: 'High',
      impact_level: 'Significant',
      ai_tags: ['persona:executive'],
      url: 'https://example.com/hmrc/enforcement',
      published_date: '2025-11-03T07:45:00.000Z'
    }

    dbService.getEnhancedUpdates
      .mockResolvedValueOnce([pinnedUpdate])
      .mockResolvedValueOnce([pinnedUpdate])

    dbService.getPinnedItems.mockResolvedValue({ items: [{ update_url: pinnedUpdate.url }] })
    dbService.getSavedSearches.mockResolvedValue({ searches: [] })
    dbService.getCustomAlerts.mockResolvedValue({ alerts: [] })
    workspaceService.getWorkspaceStats.mockResolvedValue({ stats: {} })
    annotationService.listAnnotations.mockResolvedValue([
      { persona: 'executive', status: 'action_required' }
    ])

    const snapshot = await intelligenceDashboardService.getDailySnapshot({ now })

    expect(snapshot.streams.high[0].isPinned).toBe(true)

    const executivePersona = snapshot.personas.executive
    expect(executivePersona.pins).toBeGreaterThanOrEqual(1)
    expect(executivePersona.openTasks).toBeGreaterThanOrEqual(1)
    expect(executivePersona.updates[0].isPinned).toBe(true)
    expect(snapshot.recommendedWorkflows).toBeDefined()
  })
})
