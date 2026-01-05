const dbService = require('../src/services/dbService')
const { inferTopicArea, normalizeTopicArea } = require('../src/services/db/workspace/validators')

function resolveTopicArea(item) {
  const metadata = item && typeof item === 'object' && item.metadata && typeof item.metadata === 'object'
    ? item.metadata
    : {}
  const rawTopic = metadata.topicArea || metadata.topic_area || metadata.topic || ''
  const normalized = normalizeTopicArea(rawTopic)
  if (normalized) return normalized

  const title = item.update_title || item.updateTitle || item.title || ''
  const summary = metadata.summary || item.summary || item.description || ''
  const authority = item.update_authority || item.updateAuthority || item.authority || ''
  const sectors = Array.isArray(item.sectors)
    ? item.sectors
    : Array.isArray(metadata.sectors)
      ? metadata.sectors
      : []
  const inferred = inferTopicArea({ title, summary, authority, sectors })
  return inferred || 'Other'
}

function extractIdentifiers(item, metadata) {
  const url = item.update_url || item.updateUrl || item.url || ''
  const updateId = metadata.updateId || metadata.update_id || item.update_id || item.updateId || ''
  const pinnedItemId = item.id || item.item_id || item.pinned_id || item.pinnedId || ''
  return { url, updateId, pinnedItemId }
}

async function run() {
  await dbService.waitForInitialization()

  const pinnedItems = await dbService.getPinnedItems()
  if (!Array.isArray(pinnedItems) || pinnedItems.length === 0) {
    console.log('[migrate] No pinned items found.')
    return
  }

  let attempted = 0
  let updated = 0
  let skipped = 0

  for (const item of pinnedItems) {
    if (!item || typeof item !== 'object') continue
    const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
    const desired = resolveTopicArea(item)
    const { url, updateId, pinnedItemId } = extractIdentifiers(item, metadata)

    if (!url && !updateId && !pinnedItemId) {
      skipped += 1
      continue
    }

    attempted += 1
    try {
      const didUpdate = await dbService.setPinnedItemTopicArea(url, desired, { updateId, pinnedItemId })
      if (didUpdate) {
        updated += 1
      }
    } catch (error) {
      console.warn('[migrate] Failed to update pinned item topic:', error.message)
      skipped += 1
    }
  }

  console.log(`[migrate] Attempted ${attempted} updates. Updated ${updated}. Skipped ${skipped}.`)
}

run()
  .then(() => {
    if (dbService.pool && typeof dbService.pool.end === 'function') {
      return dbService.pool.end()
    }
    return null
  })
  .catch(error => {
    console.error('[migrate] Bookmark topic migration failed:', error)
    process.exitCode = 1
  })
