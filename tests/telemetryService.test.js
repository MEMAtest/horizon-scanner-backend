jest.mock('../src/services/profileService', () => ({
  getActiveProfile: jest.fn()
}))

jest.mock('../src/services/dbService', () => ({
  recordTelemetryEvent: jest.fn(),
  getTelemetryEventsSince: jest.fn()
}))

const profileService = require('../src/services/profileService')
const dbService = require('../src/services/dbService')
const telemetryService = require('../src/services/telemetryService')

describe('telemetryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('records an event with resolved profile and sanitised payload', async () => {
    profileService.getActiveProfile.mockResolvedValue({
      id: 'profile-123'
    })
    dbService.recordTelemetryEvent.mockResolvedValue({
      id: 1,
      userId: 'analyst-1',
      profileId: 'profile-123',
      eventType: 'pin'
    })

    const result = await telemetryService.recordEvent({
      userId: 'analyst-1',
      eventType: 'PIN',
      updateId: 'update-42',
      payload: {
        authority: 'FCA',
        theme: 'payments',
        junk: { nested: 'ignore' }
      }
    })

    expect(profileService.getActiveProfile).toHaveBeenCalledWith('analyst-1')
    expect(dbService.recordTelemetryEvent).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'analyst-1',
      profileId: 'profile-123',
      eventType: 'pin',
      updateId: 'update-42',
      payload: expect.objectContaining({
        authority: 'FCA',
        theme: 'payments'
      })
    }))
    expect(result.profileId).toBe('profile-123')
  })

  it('throws on unsupported event type', async () => {
    await expect(
      telemetryService.recordEvent({ eventType: 'unknown', userId: 'default' })
    ).rejects.toThrow(/Unsupported telemetry event type/)
    expect(dbService.recordTelemetryEvent).not.toHaveBeenCalled()
  })

  it('delegates fetchRecentEvents to db service', async () => {
    dbService.getTelemetryEventsSince.mockResolvedValue([{ id: 1 }])
    const events = await telemetryService.fetchRecentEvents({ since: '2025-01-01T00:00:00.000Z', limit: 10 })
    expect(dbService.getTelemetryEventsSince).toHaveBeenCalledWith('2025-01-01T00:00:00.000Z', { limit: 10 })
    expect(events).toEqual([{ id: 1 }])
  })
})
