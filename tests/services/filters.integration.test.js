// Integration coverage for dbService.getEnhancedUpdates without starting an HTTP server.
// These tests exercise the JSON fallback dataset to ensure filters behave as expected.

const dbService = require('../../src/services/dbService')

async function fetchIds(filters) {
  const updates = await dbService.getEnhancedUpdates({ ...filters, limit: 50 })
  return { updates, ids: updates.map(update => update.id || update.url) }
}

describe('dbService.getEnhancedUpdates filtering (JSON fallback)', () => {
  test('filters by single authority', async () => {
    const { updates } = await fetchIds({ authority: 'FCA' })
    expect(Array.isArray(updates)).toBe(true)
    updates.forEach(update => {
      expect(update.authority).toBe('FCA')
    })
  })

  test('filters by multiple authorities', async () => {
    const { updates } = await fetchIds({ authority: ['FCA', 'Bank of England'] })
    const allowed = new Set(['FCA', 'Bank of England'])
    updates.forEach(update => {
      expect(allowed.has(update.authority)).toBe(true)
    })
  })

  test('filters by sector across primary/firm types', async () => {
    const { updates } = await fetchIds({ sector: 'Banking' })
    expect(updates.length).toBeGreaterThan(0)
    updates.forEach(update => {
      const sectorMatches =
        update.sector === 'Banking' ||
        (Array.isArray(update.primarySectors) && update.primarySectors.includes('Banking')) ||
        (Array.isArray(update.firm_types_affected) && update.firm_types_affected.includes('Banking'))
      expect(sectorMatches).toBe(true)
    })
  })

  test('filters by impact and urgency', async () => {
    const { updates } = await fetchIds({ impact: 'Significant', urgency: 'High' })
    updates.forEach(update => {
      expect(update.impactLevel === 'Significant' || update.impact_level === 'Significant').toBe(true)
      expect(update.urgency).toBe('High')
    })
  })

  test('search filter matches headline or summary', async () => {
    const { updates } = await fetchIds({ search: 'regulation' })
    expect(updates.length).toBeGreaterThan(0)
    updates.forEach(update => {
      const text = [
        update.headline,
        update.summary,
        update.ai_summary
      ].filter(Boolean).join(' ').toLowerCase()
      expect(text.includes('regulation')).toBe(true)
    })
  })
})
