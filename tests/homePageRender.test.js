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
  getRecentUpdates: jest.fn(),
  getRecentAIInsights: jest.fn(),
  getSystemStatistics: jest.fn()
}))

jest.mock('../src/services/firmPersonaService', () => ({
  getUserPersona: jest.fn(),
  applyPersonaFilter: jest.fn()
}))

jest.mock('../src/services/calendarService', () => ({
  getUpcomingEvents: jest.fn()
}))

jest.mock('../src/views/calendar/widget', () => ({
  renderCalendarWidget: jest.fn().mockReturnValue('<div class="calendar-widget"></div>')
}))

jest.mock('../src/views/calendar/styles', () => ({
  getCalendarWidgetStyles: jest.fn().mockReturnValue('<style>.calendar-widget{}</style>')
}))

jest.mock('pg', () => ({
  Pool: jest.fn()
}))

const cheerio = require('cheerio')
const dbService = require('../src/services/dbService')
const firmPersonaService = require('../src/services/firmPersonaService')
const calendarService = require('../src/services/calendarService')
const { Pool } = require('pg')
const renderHomePage = require('../src/routes/pages/homePage')

describe('renderHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the home page summary and widgets', async () => {
    Pool.mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      end: jest.fn().mockResolvedValue()
    }))

    dbService.getRecentUpdates.mockResolvedValue([
      {
        id: 1,
        headline: 'FCA update',
        summary: 'Summary',
        authority: 'FCA',
        impact_level: 'High',
        urgency: 'High',
        published_date: '2025-01-02T00:00:00.000Z'
      }
    ])
    dbService.getRecentAIInsights.mockResolvedValue([])
    dbService.getSystemStatistics.mockResolvedValue({
      totalUpdates: 120,
      activeAuthorities: 8,
      aiAnalyzed: 40,
      highImpact: 12
    })

    firmPersonaService.getUserPersona.mockResolvedValue(null)
    firmPersonaService.applyPersonaFilter.mockImplementation(updates => updates)

    calendarService.getUpcomingEvents.mockResolvedValue([
      { eventDate: '2025-01-15T00:00:00.000Z', eventType: 'consultation' }
    ])

    const send = jest.fn()
    const status = jest.fn().mockReturnValue({ send })
    const res = { send, status }

    await renderHomePage({}, res)

    expect(send).toHaveBeenCalled()
    const html = send.mock.calls[0][0]
    const $ = cheerio.load(html)

    expect($('.status-banner').length).toBe(1)
    expect($('.priority-panel').length).toBe(1)
    expect($('.calendar-widget').length).toBe(1)

    expect($('.status-banner').html()).toMatchSnapshot()
  })
})
