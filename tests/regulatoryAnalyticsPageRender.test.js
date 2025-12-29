jest.mock('../src/routes/templates/sidebar', () => ({
  getSidebar: jest.fn().mockResolvedValue('<aside>sidebar</aside>')
}))

jest.mock('../src/routes/templates/commonStyles', () => ({
  getCommonStyles: jest.fn().mockReturnValue('<style></style>')
}))

jest.mock('../src/routes/templates/clientScripts', () => ({
  getClientScripts: jest.fn().mockReturnValue('<script></script>')
}))

jest.mock('../src/services/dbService', () => ({
  isInitialized: true,
  waitForInitialization: jest.fn().mockResolvedValue(),
  getEnhancedUpdates: jest.fn(),
  getFilterOptions: jest.fn()
}))

jest.mock('../src/views/icons', () => ({
  getAnalyticsIcon: jest.fn().mockReturnValue('<svg></svg>'),
  wrapIconInContainer: jest.fn().mockImplementation(icon => icon),
  getCanaryAnimationStyles: jest.fn().mockReturnValue('')
}))

const cheerio = require('cheerio')
const dbService = require('../src/services/dbService')
const { renderRegulatoryAnalyticsPage } = require('../src/routes/pages/regulatoryAnalyticsPage')

describe('renderRegulatoryAnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders summary grid and chart containers', async () => {
    const updates = [
      {
        id: 1,
        authority: 'FCA',
        sector: 'Banking',
        impact_level: 'High',
        published_date: '2025-01-02T00:00:00.000Z'
      },
      {
        id: 2,
        authority: 'PRA',
        sector: 'Insurance',
        impact_level: 'Low',
        published_date: '2025-01-10T00:00:00.000Z'
      }
    ]

    dbService.getEnhancedUpdates.mockResolvedValue(updates)
    dbService.getFilterOptions.mockResolvedValue({
      authorities: ['FCA', 'PRA'],
      sectors: ['Banking', 'Insurance']
    })

    const send = jest.fn()
    const status = jest.fn().mockReturnValue({ send })
    const res = { send, status }

    const req = { headers: {} }

    await renderRegulatoryAnalyticsPage(req, res)

    expect(send).toHaveBeenCalled()
    const html = send.mock.calls[0][0]
    const $ = cheerio.load(html)

    expect($('.summary-grid').length).toBe(1)
    expect($('#monthlyTrendChart').length).toBe(1)
    expect($('#authorityChart').length).toBe(1)
    expect($('#impactChart').length).toBe(1)
    expect($('#sectorBurdenChart').length).toBe(1)

    expect($('.summary-grid').html()).toMatchSnapshot()
  })
})
