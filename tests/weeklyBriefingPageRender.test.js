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

    const styles = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get()
    expect(styles).toEqual(expect.arrayContaining([
      '/css/weekly-briefing/layout.css',
      '/css/weekly-briefing/components.css',
      '/css/weekly-briefing/modals.css',
      '/css/weekly-briefing/widgets.css'
    ]))

    const scripts = $('script').map((_, el) => ({ src: $(el).attr('src'), type: $(el).attr('type') })).get()
    expect(scripts).toEqual(expect.arrayContaining([
      { src: '/js/weekly-briefing/index.js', type: 'module' }
    ]))

    expect($('#narrativeContent').length).toBe(1)
    expect($('#updates-container').length).toBe(1)
    expect($('#metricsGrid').length).toBe(1)
    expect($('#assembleModal').length).toBe(1)
  })
})
