jest.mock('../../src/services/dbService', () => ({
  getAllUpdates: jest.fn()
}))

const dbService = require('../../src/services/dbService')
const predictiveIntelligenceService = require('../../src/services/predictiveIntelligenceService')

const DAY = 24 * 60 * 60 * 1000

const buildSampleUpdates = () => {
  const now = Date.now()

  const makeUpdate = ({
    id,
    headline,
    summary,
    authority = 'FCA',
    daysAgo = 0,
    deadlineDays = null,
    sectors = ['Banking'],
    category = 'Consultation',
    confidence = 0.82,
    url
  }) => {
    const published = new Date(now - daysAgo * DAY)
    return {
      id,
      headline,
      ai_summary: summary,
      summary,
      authority,
      category,
      published_date: published.toISOString(),
      fetched_date: published.toISOString(),
      compliance_deadline: deadlineDays !== null ? new Date(now + deadlineDays * DAY).toISOString() : null,
      primarySectors: sectors,
      primary_sectors: sectors,
      firm_types_affected: sectors,
      ai_confidence_score: confidence,
      url: url || `https://intelligence.example/${id}`
    }
  }

  return [
    makeUpdate({
      id: 'climate-1',
      headline: 'Climate oversight escalation',
      summary: 'Climate resilience consultation launched by FCA',
      authority: 'FCA',
      daysAgo: 1,
      deadlineDays: 5
    }),
    makeUpdate({
      id: 'climate-2',
      headline: 'Climate scenario testing surge',
      summary: 'Climate stress testing requirements intensify',
      authority: 'FCA',
      daysAgo: 2,
      deadlineDays: 6
    }),
    makeUpdate({
      id: 'climate-3',
      headline: 'PRA climate joint statement',
      summary: 'Climate coordination with FCA announced',
      authority: 'PRA',
      daysAgo: 3
    }),
    makeUpdate({
      id: 'climate-4',
      headline: 'PRA climate data request',
      summary: 'Climate oversight on banks expands',
      authority: 'PRA',
      daysAgo: 4
    }),
    makeUpdate({
      id: 'digital-1',
      headline: 'Digital identity roadmap',
      summary: 'Digital identity emerging theme flagged',
      authority: 'FCA',
      daysAgo: 5,
      sectors: ['Payments']
    }),
    makeUpdate({
      id: 'digital-2',
      headline: 'Digital identity consultation planning',
      summary: 'Digital identity work planned for 2026',
      authority: 'ESMA',
      daysAgo: 28,
      sectors: ['Payments']
    })
  ]
}

describe('predictiveIntelligenceService', () => {
  beforeEach(() => {
    predictiveIntelligenceService.cache.clear()
    jest.clearAllMocks()
  })

  it('classifies accelerated themes as critical predictions with full context', async () => {
    dbService.getAllUpdates.mockResolvedValue(buildSampleUpdates())

    const dashboard = await predictiveIntelligenceService.getPredictiveDashboard()

    expect(dashboard.predictions.imminent.length).toBeGreaterThan(0)
    const critical = dashboard.predictions.imminent.find(prediction =>
      (prediction.supporting_topics || []).includes('climate')
    ) || dashboard.predictions.imminent[0]

    expect(['CRITICAL', 'HIGH']).toContain(critical.confidence_bucket)
    expect(critical.priority_lane).toBe('act_now')
    expect(critical.confidence).toBeGreaterThanOrEqual(70)
    expect(critical.context).toBeDefined()
    expect(Array.isArray(critical.context.evidence)).toBe(true)
    expect(critical.context.evidence[0].type).toBe('velocity')
    expect(critical.context.triggeringUpdates.length).toBeGreaterThan(0)
    expect(critical.context.confidenceDrivers).toEqual(
      expect.arrayContaining(['Upcoming compliance deadline within 14 days'])
    )
  })

  it('builds monitoring indicators with severity and coordination alerts', async () => {
    dbService.getAllUpdates.mockResolvedValue(buildSampleUpdates())

    const dashboard = await predictiveIntelligenceService.getPredictiveDashboard()

    expect(dashboard.momentum.authorities.length).toBeGreaterThan(0)
    expect(['critical', 'high', 'medium', 'low']).toContain(dashboard.momentum.authorities[0].severity)
    expect(dashboard.momentum.authorities[0]).toHaveProperty('severity')
    expect(dashboard.alerts.some(alert => alert.type === 'coordination')).toBe(true)
  })

  it('generates contextual authority coordination predictions with evidence trail', async () => {
    dbService.getAllUpdates.mockResolvedValue(buildSampleUpdates())

    const dashboard = await predictiveIntelligenceService.getPredictiveDashboard()

    const authorityInsight = dashboard.predictions.nearTerm.find(prediction =>
      prediction.context?.primaryUpdate?.authority && prediction.focus
    )

    expect(authorityInsight).toBeDefined()
    expect(authorityInsight.priority_lane).toBe('prepare_next')
    expect(['HIGH', 'CRITICAL']).toContain(authorityInsight.confidence_bucket)
    expect(authorityInsight.focus).toBeDefined()
    expect(authorityInsight.context.triggeringUpdates.length).toBeGreaterThan(0)
    expect(authorityInsight.context.evidence[0].type).toBe('authority-velocity')
  })
})
