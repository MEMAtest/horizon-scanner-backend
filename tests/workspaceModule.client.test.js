/** @jest-environment jsdom */

const fs = require('fs')
const path = require('path')

describe('WorkspaceModule client behaviour', () => {
  const scriptPath = path.resolve(__dirname, '../public/js/workspaceModule.js')

  let pinnedItemsMock
  let fetchMock

  beforeEach(() => {
    pinnedItemsMock = []

    fetchMock = jest.fn(async (url, options = {}) => {
      const method = (options.method || 'GET').toUpperCase()

      const ok = data => Promise.resolve({
        ok: true,
        status: 200,
        json: async () => data
      })

      if (url.startsWith('/api/workspace/pinned')) {
        return ok({ success: true, items: pinnedItemsMock })
      }

      if (url.startsWith('/api/workspace/searches')) {
        return ok({ success: true, searches: [] })
      }

      if (url.startsWith('/api/workspace/alerts')) {
        return ok({ success: true, alerts: [] })
      }

      if (url.startsWith('/api/firm-profile')) {
        return ok({
          success: true,
          profile: null,
          availableSectors: ['Banking', 'Pension Funds'],
          sectorAliasMap: { banking: 'Banking', pensionfunds: 'Pension Funds' }
        })
      }

      if (url.startsWith('/api/annotations')) {
        return ok({ success: true, annotations: [] })
      }

      if (url.startsWith('/api/workspace/stats')) {
        return ok({
          success: true,
          stats: {
            pinnedItems: pinnedItemsMock.length,
            savedSearches: 0,
            activeAlerts: 0
          }
        })
      }

      if (url.startsWith('/api/workspace/pin') && method === 'POST') {
        const payload = JSON.parse(options.body || '{}')
        pinnedItemsMock.push({
          id: Date.now(),
          update_url: payload.url,
          update_title: payload.title,
          update_authority: payload.authority,
          pinned_date: new Date().toISOString(),
          sectors: payload.sectors,
          metadata: payload.metadata || {}
        })
        return ok({ success: true, item: pinnedItemsMock[pinnedItemsMock.length - 1] })
      }

      if (url.startsWith('/api/workspace/pin') && method === 'DELETE') {
        const decodedUrl = decodeURIComponent(url.replace('/api/workspace/pin/', ''))
        pinnedItemsMock = pinnedItemsMock.filter(item => item.update_url !== decodedUrl)
        return ok({ success: true })
      }

      return ok({ success: true })
    })

    global.fetch = fetchMock
    global.window = window
    global.document = document
    window.showMessage = jest.fn()
    window.FilterModule = {
      applyFilter: jest.fn()
    }

    document.body.innerHTML = `
      <div id="pinnedCount">0</div>
      <div id="savedSearchesCount">0</div>
      <div id="customAlertsCount">0</div>
      <div id="annotationCount">0</div>
      <div id="annotationMeta"></div>
    `

    jest.resetModules()
    // Evaluate script in jsdom context
    const scriptSource = fs.readFileSync(scriptPath, 'utf8')
    // eslint-disable-next-line no-eval
    eval(scriptSource)
  })

  afterEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
    delete window.WorkspaceModule
    delete window.WorkspaceModuleReady
  })

  async function waitForInit() {
    if (window.WorkspaceModuleReady) {
      await window.WorkspaceModuleReady
    }
  }

  test('initialises module and exposes public API', async () => {
    await waitForInit()
    expect(window.WorkspaceModule).toBeDefined()
    expect(typeof window.WorkspaceModule.togglePin).toBe('function')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/workspace/pinned')
  })

  test('togglePin stores metadata and updates counts', async () => {
    await waitForInit()

    await window.WorkspaceModule.togglePin(
      'https://example.com/regulation-1',
      'Headline',
      'FCA',
      {
        sectors: ['banking', 'pension funds'],
        personas: ['analyst'],
        summary: 'Important update',
        published: '2024-02-01T00:00:00.000Z',
        updateId: 'reg-1'
      }
    )

    expect(pinnedItemsMock).toHaveLength(1)
    expect(document.getElementById('pinnedCount').textContent).toBe('1')
    expect(window.__workspacePinnedUrls).toContain('https://example.com/regulation-1')

    const [item] = pinnedItemsMock
    expect(item.metadata.sectors).toEqual(['Banking', 'Pension Funds'])
    expect(item.metadata.personas).toEqual(['analyst'])

    await window.WorkspaceModule.togglePin(
      'https://example.com/regulation-1',
      'Headline',
      'FCA',
      {}
    )

    expect(pinnedItemsMock).toHaveLength(0)
    expect(document.getElementById('pinnedCount').textContent).toBe('0')
  })

  test('showPinnedItems renders modal and delegates to FilterModule', async () => {
    await waitForInit()

    // Seed pinned items via toggle
    await window.WorkspaceModule.togglePin(
      'https://example.com/regulation-2',
      'Pinned Headline',
      'FCA',
      {
        sectors: ['banking'],
        personas: ['executive'],
        summary: 'Pinned summary'
      }
    )

    // Force modal render
    window.WorkspaceModule.showPinnedItems()

    const modal = document.querySelector('.modal-overlay')
    expect(modal).toBeTruthy()
    expect(modal.querySelector('.pinned-item-card')).toBeTruthy()
    expect(modal.textContent).toContain('Pinned Headline')

    const viewButton = modal.querySelector('.modal-footer .btn.btn-primary')
    viewButton.click()
    expect(window.FilterModule.applyFilter).toHaveBeenCalledWith('pinned')
  })
})
