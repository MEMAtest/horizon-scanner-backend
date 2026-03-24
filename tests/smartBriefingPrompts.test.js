// Test that compliance_deadline flows through AI prompts correctly

describe('trimUpdate includes compliance_deadline', () => {
  let ServiceClass

  beforeAll(() => {
    // Create a minimal class and apply the prompt mixin
    ServiceClass = class {
      constructor() {
        this.useGroq = false
      }
    }
    const applyPromptMethods = require('../src/services/smartBriefing/prompts')
    applyPromptMethods(ServiceClass)
  })

  it('includes valid compliance_deadline in trimmed update', () => {
    const service = new ServiceClass()
    const dataset = {
      currentUpdates: [
        {
          id: '1',
          title: 'AML Update',
          summary: 'New AML rules',
          authority: 'FCA',
          impact_level: 'Significant',
          urgency: 'High',
          sectors: ['Banking'],
          published_date: '2026-03-20',
          compliance_deadline: '2027-03-31'
        }
      ],
      previousUpdates: [],
      historyUpdates: [],
      historyTimeline: [],
      stats: {},
      annotations: [],
      annotationInsights: { totals: {}, flagged: [], assignments: [] },
      firmContext: {}
    }

    const payload = service.buildPromptPayload(dataset)
    expect(payload.currentWeek[0].compliance_deadline).toBe('2027-03-31')
  })

  it('sets compliance_deadline to null when missing', () => {
    const service = new ServiceClass()
    const dataset = {
      currentUpdates: [
        {
          id: '2',
          title: 'No deadline update',
          summary: 'Info only',
          authority: 'PRA',
          impact_level: 'Informational',
          urgency: 'Low',
          sectors: [],
          published_date: '2026-03-20'
        }
      ],
      previousUpdates: [],
      historyUpdates: [],
      historyTimeline: [],
      stats: {},
      annotations: [],
      annotationInsights: { totals: {}, flagged: [], assignments: [] },
      firmContext: {}
    }

    const payload = service.buildPromptPayload(dataset)
    expect(payload.currentWeek[0].compliance_deadline).toBeNull()
  })

  it('sets invalid date strings to null', () => {
    const service = new ServiceClass()
    const dataset = {
      currentUpdates: [
        {
          id: '3',
          title: 'Bad date',
          summary: 'TBD deadline',
          authority: 'FCA',
          impact_level: 'Moderate',
          urgency: 'Medium',
          sectors: [],
          published_date: '2026-03-20',
          compliance_deadline: 'TBD'
        }
      ],
      previousUpdates: [],
      historyUpdates: [],
      historyTimeline: [],
      stats: {},
      annotations: [],
      annotationInsights: { totals: {}, flagged: [], assignments: [] },
      firmContext: {}
    }

    const payload = service.buildPromptPayload(dataset)
    expect(payload.currentWeek[0].compliance_deadline).toBeNull()
  })
})

describe('Narrative prompt includes deadline instructions', () => {
  let service

  beforeAll(() => {
    const ServiceClass = class {
      constructor() {
        this.useGroq = false
      }
    }
    const applyPromptMethods = require('../src/services/smartBriefing/prompts')
    applyPromptMethods(ServiceClass)
    service = new ServiceClass()
  })

  it('buildNarrativeUserPrompt mentions compliance deadlines', () => {
    const prompt = service.buildNarrativeUserPrompt({
      currentWeek: [],
      previousWeek: [],
      history: [],
      firmContext: {},
      stats: {}
    })
    expect(prompt).toContain('compliance deadline')
    expect(prompt).toContain('immediate action')
    expect(prompt).toContain('compliance_deadline')
  })

  it('buildOnePagerUserPrompt mentions compliance deadlines', () => {
    const prompt = service.buildOnePagerUserPrompt({
      currentWeek: [],
      previousWeek: [],
      firmContext: {},
      stats: {}
    })
    expect(prompt).toContain('compliance deadline')
    expect(prompt).toContain('compliance_deadline')
  })
})
