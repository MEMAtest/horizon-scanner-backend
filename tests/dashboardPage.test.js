jest.mock('../src/routes/templates/sidebar', () => ({
  getSidebar: () => ''
}))

jest.mock('../src/routes/templates/clientScripts', () => ({
  getClientScripts: () => ''
}))

jest.mock('../src/routes/templates/commonStyles', () => ({
  getCommonStyles: () => ''
}))

jest.mock('../src/services/dbService', () => ({
  getEnhancedUpdates: jest.fn(),
  getDashboardStatistics: jest.fn(),
  getFilterOptions: jest.fn()
}))

const { serializeForScript } = require('../src/routes/pages/dashboardPage')

describe('serializeForScript', () => {
  it('serializes objects into safe JSON strings', () => {
    const input = { text: "O'Reilly & <Friends>", count: 2 }
    const result = serializeForScript(input)

    expect(result).toBe('{"text":"O\'Reilly \\u0026 \\u003cFriends\\u003e","count":2}')
  })

  it('escapes closing script tags to prevent early termination', () => {
    const input = '</script><script>'
    const result = serializeForScript(input)

    expect(result).toBe('"\\u003c/script\\u003e\\u003cscript\\u003e"')
  })

  it('replaces line separators that break inline scripts', () => {
    const input = '\u2028line\u2029break'
    const result = serializeForScript(input)

    expect(result).toBe('"\\u2028line\\u2029break"')
  })
})
