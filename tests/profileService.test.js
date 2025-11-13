jest.mock('../src/services/dbService', () => ({
  getUserProfile: jest.fn(),
  saveUserProfile: jest.fn(),
  listUserProfiles: jest.fn(),
  clearUserProfiles: jest.fn(),
  getFirmProfile: jest.fn()
}))

jest.mock('../src/config/intelligenceConfig', () => ({
  getFirmProfileDefaults: jest.fn()
}))

const dbService = require('../src/services/dbService')
const intelligenceConfig = require('../src/config/intelligenceConfig')
const profileService = require('../src/services/profileService')

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    intelligenceConfig.getFirmProfileDefaults.mockResolvedValue({
      riskAppetite: 'medium',
      complianceMaturity: 45,
      relevanceThreshold: 0.3,
      analysisDepth: 'standard'
    })
  })

  it('returns existing profile without modification', async () => {
    const profile = {
      id: 12,
      userId: 'default',
      serviceType: 'payments',
      companySize: 'mid',
      regions: ['UK'],
      personas: ['executive'],
      preferences: { riskAppetite: 'medium' },
      createdAt: '2024-10-01T00:00:00.000Z',
      updatedAt: '2024-10-02T00:00:00.000Z'
    }
    dbService.getUserProfile.mockResolvedValue(profile)

    const result = await profileService.getActiveProfile('default')

    expect(result).toMatchObject({
      serviceType: 'payments',
      regions: ['UK'],
      source: 'persisted'
    })
    expect(dbService.saveUserProfile).not.toHaveBeenCalled()
  })

  it('migrates legacy firm profile when no user profile found', async () => {
    dbService.getUserProfile.mockResolvedValueOnce(null)
    dbService.getFirmProfile.mockResolvedValue({
      firmName: 'Acme Payments',
      primarySectors: ['Payments', 'Banking'],
      firmSize: 'Large',
      regions: ['UK']
    })
    dbService.saveUserProfile.mockResolvedValue({
      id: 5,
      userId: 'default',
      serviceType: 'payments',
      secondaryServiceTypes: ['banking'],
      companySize: 'Large',
      regions: ['UK'],
      preferences: { firmName: 'Acme Payments', legacyFirmSize: 'Large' },
      isActive: true
    })

    const result = await profileService.getActiveProfile()

    expect(dbService.saveUserProfile).toHaveBeenCalledWith('default', expect.objectContaining({
      serviceType: 'payments',
      secondaryServiceTypes: ['banking'],
      companySize: 'Large'
    }))
    expect(result.source).toBe('legacy-migrated')
    expect(result.preferences).toMatchObject({ firmName: 'Acme Payments' })
  })

  it('builds default profile when no data exists', async () => {
    dbService.getUserProfile.mockResolvedValueOnce(null)
    dbService.getFirmProfile.mockResolvedValueOnce(null)
    dbService.saveUserProfile.mockResolvedValue({
      id: 9,
      userId: 'default',
      serviceType: 'general_financial_services',
      preferences: { riskAppetite: 'medium', complianceMaturity: 45 },
      isActive: true
    })

    const profile = await profileService.getActiveProfile('default')

    expect(intelligenceConfig.getFirmProfileDefaults).toHaveBeenCalled()
    expect(profile.serviceType).toBe('general_financial_services')
    expect(profile.source).toBe('generated-default')
    expect(profile.preferences).toMatchObject({
      riskAppetite: 'medium',
      complianceMaturity: 45
    })
  })

  it('saves profile payload via db service', async () => {
    dbService.saveUserProfile.mockResolvedValue({
      id: 2,
      userId: 'analyst-1',
      serviceType: 'wealth_management',
      secondaryServiceTypes: [],
      personas: ['analyst'],
      preferences: {},
      isActive: true
    })

    const payload = {
      serviceType: 'wealth_management',
      personas: ['analyst']
    }

    const saved = await profileService.saveProfile('analyst-1', payload)

    expect(dbService.saveUserProfile).toHaveBeenCalledWith('analyst-1', expect.objectContaining({
      serviceType: 'wealth_management'
    }))
    expect(saved.userId).toBe('analyst-1')
    expect(saved.personas).toEqual(['analyst'])
  })
})
