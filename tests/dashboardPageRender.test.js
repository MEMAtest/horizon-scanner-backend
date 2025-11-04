jest.mock('../src/routes/templates/sidebar', () => ({
  getSidebar: jest.fn().mockResolvedValue('<aside>sidebar</aside>')
}))

jest.mock('../src/routes/templates/clientScripts', () => ({
  getClientScripts: jest.fn().mockReturnValue('<script>window.filterByCategory = () => {};</script>')
}))

jest.mock('../src/routes/templates/commonStyles', () => ({
  getCommonStyles: jest.fn().mockReturnValue('<style></style>')
}))

jest.mock('../src/services/dbService', () => ({
  getEnhancedUpdates: jest.fn(),
  getDashboardStatistics: jest.fn(),
  getFilterOptions: jest.fn()
}))

const dbService = require('../src/services/dbService')
const { renderDashboardPage } = require('../src/routes/pages/dashboardPage')

describe('renderDashboardPage inline script safety', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('serializes data with problematic characters without breaking inline script', async () => {
    const req = {
      query: {
        category: "</script><script>alert('xss')</script>",
        authority: "FCA & Partners",
        sector: "Retail <Finance>",
        impact: "High",
        range: 'week',
        search: "O'Reilly"
      }
    }

    const updates = [{
      id: 1,
      headline: "Alert </script><script>bad()</script>",
      summary: "Line with separator \u2028 and ampersand & and <tag>",
      ai_summary: "AI says </script>",
      authority: "FCA"
    }]

    dbService.getEnhancedUpdates.mockResolvedValue(updates)
    dbService.getDashboardStatistics.mockResolvedValue({ totalUpdates: 1 })
    dbService.getFilterOptions.mockResolvedValue({ authorities: [], sectors: [] })

    const send = jest.fn()
    const status = jest.fn().mockReturnValue({ send })
    const res = { send, status }

    await renderDashboardPage(req, res)

    expect(send).toHaveBeenCalled()
    const html = send.mock.calls[0][0]

    expect(html).toContain('window.dashboardInitialState = ')
    expect(html).toContain('window.initialUpdates = window.dashboardInitialState.updates')

    const inlineScriptMatch = html.match(/window\.dashboardInitialState = ([\s\S]*?);\s*window\.initialUpdates/)
    expect(inlineScriptMatch).toBeTruthy()
    const inlineScript = inlineScriptMatch[1]

    expect(inlineScript).toContain('\\u003c/script\\u003e')
    expect(html).toContain("O'Reilly")
    expect(inlineScript).not.toContain('</script><script>alert(')
  })
})
