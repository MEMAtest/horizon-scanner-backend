// Tests for workspace pin persistence to guarantee metadata and taxonomy integrity.

const fs = require('fs').promises
const path = require('path')
const os = require('os')

const dbService = require('../../src/services/dbService')

describe('workspace pin storage', () => {
  const tempWorkspaceFile = path.join(os.tmpdir(), `workspace-test-${Date.now()}.json`)
  const originalWorkspacePath = dbService.workspaceFile

  beforeAll(async () => {
    dbService.workspaceFile = tempWorkspaceFile
    dbService.fallbackMode = true
    await fs.writeFile(tempWorkspaceFile, JSON.stringify({ pinnedItems: [], customAlerts: [] }, null, 2), 'utf8')
  })

  afterAll(async () => {
    dbService.workspaceFile = originalWorkspacePath
    await fs.unlink(tempWorkspaceFile).catch(() => {})
  })

  test('adds pinned item with sector taxonomy and personas', async () => {
    const item = await dbService.addPinnedItem(
      'https://example.com/update-1',
      'Sample pinned headline',
      '',
      'Sample Authority',
      {
        sectors: ['pension funds', 'banking'],
        personas: ['analyst'],
        summary: 'Pinned summary text',
        published: '2024-01-10T00:00:00.000Z',
        updateId: 'update-1'
      }
    )

    expect(item.update_url).toBe('https://example.com/update-1')
    expect(item.update_title).toBe('Sample pinned headline')
    expect(item.metadata.personas).toEqual(['analyst'])
    expect(item.metadata.summary).toBe('Pinned summary text')
    expect(item.metadata.published).toBe('2024-01-10T00:00:00.000Z')
    expect(item.metadata.updateId).toBe('update-1')
    expect(item.metadata.authority).toBe('Sample Authority')

    // Normalised sector list
    expect(item.metadata.sectors).toEqual(['Pension Funds', 'Banking'])

    const items = await dbService.getPinnedItems()
    expect(items.length).toBe(1)
    expect(items[0].metadata.sectors).toEqual(['Pension Funds', 'Banking'])
  })

  test('removes pinned item by URL', async () => {
    const success = await dbService.removePinnedItem('https://example.com/update-1')
    expect(success).toBe(true)

    const items = await dbService.getPinnedItems()
    expect(items.length).toBe(0)
  })
})
