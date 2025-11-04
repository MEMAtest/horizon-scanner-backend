jest.mock('../src/routes/templates/sidebar', () => ({
  getSidebar: jest.fn().mockResolvedValue('<aside>Sidebar</aside>')
}))

jest.mock('../src/routes/templates/commonStyles', () => ({
  getCommonStyles: jest.fn().mockReturnValue('<style id="common-styles"></style>')
}))

jest.mock('../src/routes/templates/clientScripts', () => ({
  getCommonClientScripts: jest.fn().mockReturnValue('<script id="common-scripts"></script>')
}))

const cheerio = require('cheerio')
const enforcementPage = require('../src/routes/pages/enforcementPage')

describe('enforcementPage render', () => {
  it('injects enforcement assets and sections', async () => {
    const req = {}
    const send = jest.fn()
    const status = jest.fn().mockReturnThis()
    const res = { send, status }

    await enforcementPage(req, res)

    expect(send).toHaveBeenCalledWith(expect.any(String))

    const html = send.mock.calls[0][0]
    const $ = cheerio.load(html)

    const links = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get()
    expect(links).toContain('/css/enforcement/layout.css')
    expect(links).toContain('/css/enforcement/components.css')

    const scripts = $('script').map((_, el) => ({
      src: $(el).attr('src'),
      type: $(el).attr('type')
    })).get()

    expect(scripts).toEqual(expect.arrayContaining([
      { src: 'https://cdn.jsdelivr.net/npm/chart.js', type: undefined },
      { src: '/js/enforcement/index.js', type: 'module' }
    ]))

    expect($('#stats-container').length).toBe(1)
    expect($('#fines-container').length).toBe(1)
    expect($('#trends-container').length).toBe(1)
    expect($('#top-firms-container').length).toBe(1)
  })
})
