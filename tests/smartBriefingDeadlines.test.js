const {
  buildDeadlineTimelineHtml,
  buildUpdateCardHtml,
  formatDateDisplay,
  escapeHtml,
  truncateText
} = require('../src/views/weeklyBriefing/builders')

// Freeze "now" to 2026-03-23 for deterministic tests
const MOCK_NOW = new Date('2026-03-23T00:00:00Z')
const realDate = global.Date
beforeAll(() => {
  global.Date = class extends realDate {
    constructor(...args) {
      if (args.length === 0) return new realDate(MOCK_NOW)
      return new realDate(...args)
    }
    static now() { return MOCK_NOW.getTime() }
  }
  // Preserve static methods
  global.Date.parse = realDate.parse
  global.Date.UTC = realDate.UTC
})
afterAll(() => { global.Date = realDate })

describe('buildDeadlineTimelineHtml', () => {
  it('returns empty result when no updates exist', () => {
    const result = buildDeadlineTimelineHtml({ dataset: { currentUpdates: [] } })
    expect(result).toEqual({ html: '', count: 0, items: [] })
  })

  it('returns empty result when no updates have compliance_deadline', () => {
    const result = buildDeadlineTimelineHtml({
      dataset: {
        currentUpdates: [
          { id: '1', title: 'No deadline', authority: 'FCA' },
          { id: '2', title: 'Also none', authority: 'PRA', compliance_deadline: null }
        ]
      }
    })
    expect(result).toEqual({ html: '', count: 0, items: [] })
  })

  it('returns empty result when briefing is null', () => {
    const result = buildDeadlineTimelineHtml(null)
    expect(result).toEqual({ html: '', count: 0, items: [] })
  })

  it('filters out invalid date strings', () => {
    const result = buildDeadlineTimelineHtml({
      dataset: {
        currentUpdates: [
          { id: '1', title: 'Bad date', authority: 'FCA', compliance_deadline: 'TBD' },
          { id: '2', title: 'Also bad', authority: 'PRA', compliance_deadline: 'Q2 2026' },
          { id: '3', title: 'Empty', authority: 'BoE', compliance_deadline: '' }
        ]
      }
    })
    expect(result.count).toBe(0)
  })

  it('groups deadlines correctly: overdue, soon, upcoming, later', () => {
    const result = buildDeadlineTimelineHtml({
      dataset: {
        currentUpdates: [
          { id: 'overdue', title: 'Past deadline', authority: 'FCA', compliance_deadline: '2026-03-01' },
          { id: 'soon', title: 'Due in 10 days', authority: 'PRA', compliance_deadline: '2026-04-02' },
          { id: 'upcoming', title: 'Due in 60 days', authority: 'BoE', compliance_deadline: '2026-05-22' },
          { id: 'later', title: 'Due next year', authority: 'EBA', compliance_deadline: '2027-03-31' }
        ]
      }
    })

    expect(result.count).toBe(4)
    expect(result.items).toHaveLength(4)
    // Sorted by deadline ascending
    expect(result.items[0].id).toBe('overdue')
    expect(result.items[3].id).toBe('later')

    // HTML contains all 4 group classes
    expect(result.html).toContain('deadline-overdue')
    expect(result.html).toContain('deadline-soon')
    expect(result.html).toContain('deadline-upcoming')
    expect(result.html).toContain('deadline-later')

    // Contains group labels
    expect(result.html).toContain('Overdue')
    expect(result.html).toContain('Due Soon')
    expect(result.html).toContain('Upcoming')
    expect(result.html).toContain('Later')
  })

  it('escapes HTML in authority and headline fields', () => {
    const result = buildDeadlineTimelineHtml({
      dataset: {
        currentUpdates: [
          {
            id: 'xss',
            title: '<script>alert("xss")</script>',
            authority: '<b>Evil</b>',
            compliance_deadline: '2026-04-01'
          }
        ]
      }
    })
    expect(result.html).not.toContain('<script>')
    expect(result.html).not.toContain('<b>Evil</b>')
    expect(result.html).toContain('&lt;script&gt;')
    expect(result.html).toContain('&lt;b&gt;Evil&lt;/b&gt;')
  })

  it('limits each group to 5 items', () => {
    const updates = Array.from({ length: 8 }, (_, i) => ({
      id: `soon-${i}`,
      title: `Update ${i}`,
      authority: 'FCA',
      compliance_deadline: `2026-04-${String(i + 1).padStart(2, '0')}`
    }))
    const result = buildDeadlineTimelineHtml({ dataset: { currentUpdates: updates } })
    // All 8 items in count
    expect(result.count).toBe(8)
    // But HTML should only render 5 rows for the group
    const itemMatches = result.html.match(/class="deadline-item"/g)
    expect(itemMatches).toHaveLength(5)
  })

  it('shows correct days-remaining labels', () => {
    const result = buildDeadlineTimelineHtml({
      dataset: {
        currentUpdates: [
          { id: '1', title: 'Overdue item', authority: 'FCA', compliance_deadline: '2026-03-13' },
          { id: '2', title: 'Today item', authority: 'PRA', compliance_deadline: '2026-03-23' },
          { id: '3', title: 'Future item', authority: 'BoE', compliance_deadline: '2026-04-07' }
        ]
      }
    })
    expect(result.html).toContain('10d overdue')
    expect(result.html).toContain('Today')
    expect(result.html).toContain('15d')
  })
})

describe('buildUpdateCardHtml deadline chip', () => {
  it('renders no deadline chip when compliance_deadline is absent', () => {
    const html = buildUpdateCardHtml({ id: '1', title: 'Test', authority: 'FCA' })
    expect(html).not.toContain('deadline-chip')
  })

  it('renders overdue chip (red) for past deadlines', () => {
    const html = buildUpdateCardHtml({
      id: '1',
      title: 'Test',
      authority: 'FCA',
      compliance_deadline: '2026-01-15'
    })
    expect(html).toContain('deadline-chip')
    expect(html).toContain('deadline-overdue')
    expect(html).toContain('Overdue:')
  })

  it('renders soon chip (amber) for ≤30 day deadlines', () => {
    const html = buildUpdateCardHtml({
      id: '1',
      title: 'Test',
      authority: 'FCA',
      compliance_deadline: '2026-04-10'
    })
    expect(html).toContain('deadline-chip')
    expect(html).toContain('deadline-soon')
    expect(html).toContain('Due:')
  })

  it('renders upcoming chip (green) for 31-90 day deadlines', () => {
    const html = buildUpdateCardHtml({
      id: '1',
      title: 'Test',
      authority: 'FCA',
      compliance_deadline: '2026-05-30'
    })
    expect(html).toContain('deadline-chip')
    expect(html).toContain('deadline-upcoming')
  })

  it('renders later chip (gray) for 90+ day deadlines', () => {
    const html = buildUpdateCardHtml({
      id: '1',
      title: 'Test',
      authority: 'FCA',
      compliance_deadline: '2027-03-31'
    })
    expect(html).toContain('deadline-chip')
    expect(html).toContain('deadline-later')
  })

  it('renders "Due today" for same-day deadlines', () => {
    const html = buildUpdateCardHtml({
      id: '1',
      title: 'Test',
      authority: 'FCA',
      compliance_deadline: '2026-03-23'
    })
    expect(html).toContain('Due today')
  })

  it('does not render chip for invalid date strings', () => {
    const html = buildUpdateCardHtml({
      id: '1',
      title: 'Test',
      authority: 'FCA',
      compliance_deadline: 'TBD'
    })
    expect(html).not.toContain('deadline-chip')
  })
})

describe('Sidebar deadline tracker rendering', () => {
  // Re-require to get a fresh module with our mocked helpers
  const { renderSidebar } = require('../src/views/weeklyBriefing/sections/sidebar')

  const baseSidebarData = {
    stats: { totalUpdates: 10, highImpact: 2, moderate: 5, informational: 3 },
    recentBriefings: [],
    metrics: { coverage: '100%', velocity: 'Normal', alerts: 2 },
    annotations: { total: 0, flagged: 0, actionRequired: 0 }
  }

  it('renders empty state when deadlines count is 0', () => {
    const html = renderSidebar({
      ...baseSidebarData,
      deadlines: { html: '', count: 0 }
    })
    expect(html).toContain('Compliance Deadlines')
    expect(html).toContain('No upcoming deadlines')
    expect(html).toContain('/regulatory-calendar')
    // Badge should NOT show when count is 0
    expect(html).not.toContain('deadline-badge')
  })

  it('renders deadline widget with items when count > 0', () => {
    const deadlineHtml = '<div class="deadline-group">mock items</div>'
    const html = renderSidebar({
      ...baseSidebarData,
      deadlines: { html: deadlineHtml, count: 3 }
    })
    expect(html).toContain('Compliance Deadlines')
    expect(html).toContain('deadline-badge')
    expect(html).toContain('3')
    expect(html).toContain('mock items')
    expect(html).toContain('/regulatory-calendar')
  })

  it('renders sidebar without deadlines param (backwards compat)', () => {
    // deadlines defaults to {} in the function signature
    const html = renderSidebar(baseSidebarData)
    expect(html).toContain('Compliance Deadlines')
    expect(html).toContain('No upcoming deadlines')
  })
})
