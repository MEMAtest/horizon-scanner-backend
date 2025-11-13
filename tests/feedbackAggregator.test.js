jest.mock('../src/services/dbService', () => ({
  getTelemetryEventsSince: jest.fn(),
  applyFeedbackAdjustments: jest.fn()
}))

const dbService = require('../src/services/dbService')
const feedbackAggregator = require('../src/services/feedbackAggregator')

describe('feedbackAggregator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('skips processing when no events returned', async () => {
    dbService.getTelemetryEventsSince.mockResolvedValue([])
    const result = await feedbackAggregator.processEvents()
    expect(result).toEqual({ processed: 0, profilesUpdated: 0 })
    expect(dbService.applyFeedbackAdjustments).not.toHaveBeenCalled()
  })

  it('aggregates events per profile and entity', async () => {
    const events = [
      {
        id: 1,
        profileId: 'profile-1',
        eventType: 'pin',
        payload: { authority: 'FCA', theme: 'payments', personas: ['executive'] },
        createdAt: '2025-01-03T10:00:00.000Z'
      },
      {
        id: 2,
        profileId: 'profile-1',
        eventType: 'dismiss',
        payload: { authority: 'PRA' },
        createdAt: '2025-01-03T10:05:00.000Z'
      },
      {
        id: 3,
        profileId: 'profile-2',
        eventType: 'workflow_complete',
        workflowTemplateId: 'workflow-99',
        payload: { personas: ['operations'] },
        createdAt: '2025-01-03T11:00:00.000Z'
      }
    ]
    dbService.getTelemetryEventsSince.mockResolvedValue(events)
    dbService.applyFeedbackAdjustments.mockResolvedValue([])

    const result = await feedbackAggregator.processEvents({ since: '2025-01-01T00:00:00.000Z' })

    expect(result).toEqual({ processed: 3, profilesUpdated: 2 })
    expect(dbService.getTelemetryEventsSince).toHaveBeenCalledWith('2025-01-01T00:00:00.000Z', { limit: 2000 })

    expect(dbService.applyFeedbackAdjustments).toHaveBeenNthCalledWith(
      1,
      'profile-1',
      expect.arrayContaining([
        expect.objectContaining({ entityType: 'authority', entityId: 'FCA', weightDelta: 3 }),
        expect.objectContaining({ entityType: 'theme', entityId: 'payments', weightDelta: 3 }),
        expect.objectContaining({ entityType: 'persona', entityId: 'executive', weightDelta: 3 }),
        expect.objectContaining({ entityType: 'authority', entityId: 'PRA', weightDelta: -1 })
      ])
    )

    expect(dbService.applyFeedbackAdjustments).toHaveBeenNthCalledWith(
      2,
      'profile-2',
      expect.arrayContaining([
        expect.objectContaining({ entityType: 'workflow_template', entityId: 'workflow-99', weightDelta: 2 }),
        expect.objectContaining({ entityType: 'persona', entityId: 'operations', weightDelta: 2 })
      ])
    )
  })
})
