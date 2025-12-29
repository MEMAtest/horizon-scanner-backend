const { test, expect } = require('@playwright/test')
const { buildAiIntelligencePage } = require('../../src/views/aiIntelligence/pageBuilder')

test.describe('AI Intelligence profile surfaces', () => {
  const baseSnapshot = {
    snapshotDate: '2025-11-03T00:00:00.000Z',
    heroInsight: {
      headline: 'Regulator issues urgent guidance',
      summary: 'A regulator has issued an urgent guidance note.',
      recommendation: 'Escalate to compliance lead.'
    },
    riskPulse: {
      score: 3.4,
      label: 'Elevated',
      delta: 1.2,
      components: []
    },
    quickStats: {
      totalUpdates: 5,
      highImpact: 2,
      activeAuthorities: 3,
      deadlinesSoon: 1,
      urgentUpdates: 1
    },
    streams: {
      high: [
        {
          updateId: 'alpha-1',
          id: 'alpha-1',
          headline: 'Priority enforcement action',
          authority: 'FCA',
          urgency: 'High',
          impactLevel: 'Significant',
          summary: 'Summary goes here.',
          publishedAt: '2025-11-03T09:00:00.000Z',
          url: 'https://example.com/alpha-1',
          personas: ['executive'],
          primarySector: 'Payments',
          profileRelevance: 'core',
          relevanceScore: 87
        }
      ],
      medium: [],
      low: []
    },
    personas: {
      executive: {
        count: 3,
        pins: 1,
        openTasks: 0,
        updates: [],
        briefing: { summary: 'Leadership focus on HMRC impact.', nextSteps: [] }
      }
    },
    workspace: {
      stats: {},
      tasks: 0,
      pinnedItems: [],
      savedSearches: [],
      customAlerts: [],
      annotationSummary: { total: 0, tasks: 0, flagged: 0 }
    },
    timeline: [],
    themes: [],
    personaBriefings: {}
  }

  async function disableReload(page) {
    await page.addInitScript(() => {
      try {
        Object.defineProperty(Location.prototype, 'reload', {
          configurable: true,
          value: function() {
            window.__profileReloaded = true
          }
        })
      } catch (error) {
        try {
          window.location.reload = () => {
            window.__profileReloaded = true
          }
        } catch (innerError) {
          // Ignore if the environment blocks overrides.
        }
      }
    })
  }

  function renderPage(snapshotOverrides = {}) {
    const snapshot = {
      ...baseSnapshot,
      ...snapshotOverrides
    }

    const html = buildAiIntelligencePage({
      sidebar: '<nav></nav>',
      snapshot,
      workspaceBootstrapScripts: '<script></script>',
      clientScripts: '',
      commonStyles: '<style></style>'
    })

    return html
      .replace('<head>', '<head><base href="http://localhost/">')
      .replace('window.location.reload();', 'window.__profileReloaded = true;')
  }

  test('shows profile banner and workflow cards', async ({ page }) => {
    await disableReload(page)
    const html = renderPage({
      profile: {
        serviceType: 'payments',
        personas: ['executive'],
        regions: ['UK'],
        source: 'persisted'
      },
      recommendedWorkflows: [
        {
          id: 'payments-incident-response',
          title: 'Payments incident escalation',
          description: 'Coordinate cross-functional response.',
          actions: ['Notify ops', 'Brief compliance'],
          reasons: ['Aligned with payments profile'],
          score: 55
        }
      ]
    })

    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    const banner = page.locator('.profile-banner')
    await expect(banner).toContainText('Payments')

    const workflowCard = page.locator('.workflow-card').first()
    await expect(workflowCard).toContainText('Payments incident escalation')

    await page.route('**/api/intelligence/events', route => {
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
    })

    await workflowCard.getByRole('button', { name: /Build workflow/i }).click()
  })

  test('completes onboarding steps and saves profile', async ({ page }) => {
    const html = renderPage({
      profile: null,
      recommendedWorkflows: []
    })

    await disableReload(page)

    await page.route('**/api/profile', route => {
      route.fulfill({ status: 200, body: JSON.stringify({ success: true, profile: {} }) })
    })

    await page.route('**/api/intelligence/events', route => {
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
    })

    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      window.__profileReloaded = false
    })

    const onboarding = page.locator('[data-onboarding-root]')
    await expect(onboarding).toHaveClass(/is-visible/)

    await page.locator('[data-option-group="serviceType"]').getByRole('button', { name: 'Payments' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('[data-option-group="companySize"]').getByRole('button', { name: '51–500 employees' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('[data-option-group="personas"]').getByRole('button', { name: 'Executive' }).click()
    const savePromise = page.waitForResponse('**/api/profile')
    await page.getByRole('button', { name: 'Save profile' }).click()
    await savePromise
    await expect(onboarding).not.toHaveClass(/is-visible/)
    await expect.poll(() => page.evaluate(() => window.__profileReloaded)).toBe(true)
  })
})
