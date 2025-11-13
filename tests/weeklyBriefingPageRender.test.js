jest.mock('../src/routes/templates/sidebar', () => ({
  getSidebar: jest.fn().mockResolvedValue('<aside>sidebar</aside>')
}))

jest.mock('../src/routes/templates/commonStyles', () => ({
  getCommonStyles: jest.fn().mockReturnValue('<style></style>')
}))

jest.mock('../src/routes/templates/clientScripts', () => ({
  getClientScripts: jest.fn().mockReturnValue('<script></script>')
}))

jest.mock('../src/services/smartBriefingService', () => ({
  getLatestBriefing: jest.fn(),
  listBriefings: jest.fn()
}))

const cheerio = require('cheerio')
const smartBriefingService = require('../src/services/smartBriefingService')
const weeklyBriefingPage = require('../src/routes/pages/weeklyBriefingPage')

describe('weeklyBriefingPage render', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders weekly briefing layout with assets', async () => {
    smartBriefingService.getLatestBriefing.mockResolvedValue(null)
    smartBriefingService.listBriefings.mockResolvedValue([])

    const send = jest.fn()
    const res = { send, status: jest.fn().mockReturnThis() }

    await weeklyBriefingPage({}, res)

    expect(send).toHaveBeenCalledWith(expect.any(String))
    const html = send.mock.calls[0][0]
    const $ = cheerio.load(html)

    const styles = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href').replace(/\?.*$/, '')).get()
    expect(styles).toEqual(expect.arrayContaining([
      '/css/weekly-briefing/layout.css',
      '/css/weekly-briefing/components.css',
      '/css/weekly-briefing/modals.css',
      '/css/weekly-briefing/widgets.css'
    ]))

    const moduleScripts = $('script[type="module"]').map((_, el) => $(el).attr('src') && $(el).attr('src').replace(/\?.*$/, '')).get()
    expect(moduleScripts).toEqual(expect.arrayContaining([
      '/js/weekly-briefing/index.js'
    ]))

    expect($('#narrativeContent').length).toBe(1)
    expect($('#updates-container').length).toBe(1)
    expect($('.metrics-grid').length).toBeGreaterThan(0)
    expect($('#assembleModal').length).toBe(1)
  })
})
