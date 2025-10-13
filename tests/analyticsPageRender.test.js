jest.mock('../src/routes/templates/sidebar', () => ({
  getSidebar: jest.fn().mockResolvedValue('<aside>sidebar</aside>')
}))

jest.mock('../src/routes/templates/commonStyles', () => ({
  getCommonStyles: jest.fn().mockReturnValue('<style></style>')
}))

jest.mock('../src/routes/templates/clientScripts', () => ({
  getCommonClientScripts: jest.fn().mockReturnValue('<script></script>')
}))

jest.mock('../src/services/predictiveIntelligenceService', () => ({
  getPredictiveDashboard: jest.fn()
}))

const cheerio = require('cheerio')
const predictiveIntelligenceService = require('../src/services/predictiveIntelligenceService')
const analyticsPage = require('../src/routes/pages/analyticsPage')

const buildContext = overrides => ({
  why: 'Authorities accelerating focus on this theme.',
  historicalAccuracy: {
    bucket: overrides.bucket || 'CRITICAL',
    hitRate: overrides.hitRate || 86,
    sampleSize: 42,
    window: '12-month window',
    statement: overrides.statement || 'Model hit rate 86% across 42 critical calls (12-month window).',
    expectedTimeline: overrides.expectedTimeline || 'next 7-14 days'
  },
  evidence: overrides.evidence || [
    {
      type: 'velocity',
      severity: 'critical',
      statement: 'Velocity spike: "climate" appeared 4 time(s) in the past 7 days versus 1.0 weekly baseline.',
      template: 'Velocity spike template',
      values: {}
    }
  ],
  triggeringUpdates: overrides.triggeringUpdates || [
    {
      headline: 'FCA climate consultation',
      authority: 'FCA',
      date: '2025-10-01T00:00:00.000Z',
      url: 'https://example.com/fca-update',
      stage: 'consultation',
      urgency: 'High',
      confidence: 90,
      summary: 'Consultation on climate resilience.'
    }
  ],
  confidenceDrivers: overrides.confidenceDrivers || ['Topic velocity 3.8× baseline', 'Multiple authorities engaged'],
  sectors: overrides.sectors || ['Banking'],
  authorities: overrides.authorities || ['FCA', 'PRA']
})

describe('analyticsPage predictive layout', () => {
  const mockDashboard = {
    generatedAt: '2025-10-06T00:00:00.000Z',
    predictions: {
      imminent: [
        {
          id: 'p1',
          prediction_title: 'FCA escalation on climate expected imminently',
          timeframe: '7-14 days',
          confidence: 88,
          urgency: 'CRITICAL',
          confidence_bucket: 'CRITICAL',
          lane_bucket: 'imminent',
          priority_lane: 'act_now',
          priority_score: 120,
          recommended_actions: [
            'Immediate: Review climate resilience controls.',
            'This week: Brief senior risk committee.',
            'Within 2 weeks: Complete impact assessment.'
          ],
          affected_sectors: ['Banking'],
          why_this_matters: 'Climate risk supervision is accelerating across FCA and PRA.',
          context: buildContext({})
        }
      ],
      nearTerm: [
        {
          id: 'p2',
          prediction_title: 'PRA cooperation spike suggests coordinated announcement',
          timeframe: '15-30 days',
          confidence: 78,
          urgency: 'HIGH',
          confidence_bucket: 'HIGH',
          lane_bucket: 'near',
          priority_lane: 'prepare_next',
          priority_score: 95,
          recommended_actions: ['This week: Align regulatory affairs on likely PRA priorities.'],
          affected_sectors: ['Cross-sector'],
          why_this_matters: 'Joint activity points to upcoming supervisory communication.',
          context: buildContext({
            bucket: 'HIGH',
            hitRate: 80,
            statement: 'Model hit rate 80% across 30 high calls (12-month window).',
            evidence: [{
              type: 'authority-velocity',
              severity: 'high',
              statement: 'Authority spike: PRA issued 3 updates in 7 days (90% above baseline).',
              template: 'Authority velocity template',
              values: {}
            }]
          })
        }
      ],
      strategic: [
        {
          id: 'p3',
          prediction_title: 'Digital identity emerging across regulators',
          timeframe: '30-90 days',
          confidence: 62,
          urgency: 'MEDIUM',
          confidence_bucket: 'MEDIUM',
          lane_bucket: 'strategic',
          priority_lane: 'plan_horizon',
          priority_score: 68,
          recommended_actions: ['Plan: Add digital identity to 90-day roadmap.'],
          affected_sectors: ['Payments'],
          why_this_matters: 'Early preparation allows proactive stakeholder engagement.',
          context: buildContext({
            bucket: 'MEDIUM',
            hitRate: 69,
            statement: 'Model hit rate 69% across 28 medium calls (12-month window).',
            expectedTimeline: '30-90 days',
            sectors: ['Payments'],
            authorities: ['FCA'],
            triggeringUpdates: [{
              headline: 'FCA digital identity speech',
              authority: 'FCA',
              date: '2025-09-15T00:00:00.000Z',
              url: 'https://example.com/digital-identity',
              stage: 'informal',
              urgency: 'Medium',
              confidence: 75,
              summary: 'Speech signals increasing focus on digital identity.'
            }]
          })
        }
      ]
    },
    momentum: {
      topics: [
        { keyword: 'climate', acceleration: 2.4, recent: 4, coordination: true, severity: 'critical' },
        { keyword: 'digital', acceleration: 1.6, recent: 2, coordination: false, severity: 'high' }
      ],
      sectors: [
        { sector: 'Banking', recent: 5, previous: 2, changePercent: 75, severity: 'high' },
        { sector: 'Payments', recent: 2, previous: 1, changePercent: 50, severity: 'medium' }
      ],
      authorities: [
        { authority: 'FCA', changePercent: 92, recent: 5, previous: 1, level: 'accelerating', severity: 'high' },
        { authority: 'PRA', changePercent: 80, recent: 3, previous: 1, level: 'accelerating', severity: 'high' }
      ]
    },
    alerts: [
      { type: 'coordination', severity: 'high', message: 'Coordination detected: climate referenced by FCA & PRA.' },
      { type: 'authority-velocity', severity: 'critical', message: 'FCA publishing rate is 92% above normal.' }
    ],
    methodology: []
  }

  beforeEach(() => {
    predictiveIntelligenceService.getPredictiveDashboard.mockResolvedValue(mockDashboard)
  })

  it('renders predictive sections and monitoring dashboard with interactive controls', async () => {
    const send = jest.fn()
    const status = jest.fn().mockReturnValue({ send })
    const res = { send, status }

    await analyticsPage({}, res)

    expect(send).toHaveBeenCalled()
    const html = send.mock.calls[0][0]
    const $ = cheerio.load(html)

    expect($('.lane-column').length).toBe(3)
    expect($('.lane-column[data-lane="act_now"] .insight-card').length).toBe(1)
    expect($('.lane-column[data-lane="prepare_next"] .insight-card').length).toBe(1)
    expect($('.lane-column[data-lane="plan_horizon"] .insight-card').length).toBe(1)
    expect($('#insightFilters').length).toBe(1)
    expect($('#insightDrawer').length).toBe(1)

    const actNowCard = $('.lane-column[data-lane="act_now"] .insight-card').first().html()
    expect(actNowCard).toMatchSnapshot()
  })
})
