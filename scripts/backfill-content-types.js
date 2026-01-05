/**
 * Backfill inferred content_type for updates that are missing or set to Other.
 *
 * Usage:
 *   node scripts/backfill-content-types.js --target=auto --dry-run
 *   node scripts/backfill-content-types.js --target=json
 *   node scripts/backfill-content-types.js --target=db
 *   node scripts/backfill-content-types.js --target=both
 */

require('dotenv').config()

const fs = require('fs').promises
const path = require('path')
const dbService = require('../src/services/dbService')
const { inferContentType, normalizeContentType } = require('../src/utils/contentTypeInference')

const args = process.argv.slice(2)
const flags = new Set(args.filter(arg => arg.startsWith('--')).map(arg => arg.replace(/^--/, '')))

function getFlagValue(name, fallback) {
  const prefix = `--${name}=`
  const arg = args.find(value => value.startsWith(prefix))
  if (!arg) return fallback
  return arg.slice(prefix.length)
}

const target = getFlagValue('target', 'auto')
const dryRun = flags.has('dry-run')
const limitArg = Number.parseInt(getFlagValue('limit', ''), 10)
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : null

function shouldUpdateContentType(update) {
  const existing = normalizeContentType(update.content_type || update.contentType || update.contentType)
  const inferred = inferContentType(update)

  if (!inferred || inferred === 'Other') return null
  if (!existing || existing === 'Other') return inferred
  return null
}

async function backfillJson() {
  const updatesPath = path.join(__dirname, '../data/updates.json')
  const raw = await fs.readFile(updatesPath, 'utf8')
  const updates = JSON.parse(raw)
  const counts = {}
  let updated = 0

  updates.forEach(update => {
    if (limit && updated >= limit) return
    const inferred = shouldUpdateContentType(update)
    if (!inferred) return

    counts[inferred] = (counts[inferred] || 0) + 1
    update.content_type = inferred
    update.contentType = inferred
    updated += 1
  })

  if (!dryRun && updated > 0) {
    await fs.writeFile(updatesPath, JSON.stringify(updates, null, 2) + '\n', 'utf8')
  }

  return { updated, counts }
}

async function backfillDb() {
  if (!dbService.usePostgres || !dbService.pool) {
    throw new Error('Postgres is not available (DATABASE_URL missing or connection failed).')
  }

  const client = await dbService.pool.connect()
  try {
    const result = await client.query(`
      SELECT id, url, headline, summary, ai_summary, content_type, ai_tags
      FROM regulatory_updates
      ORDER BY published_date DESC
    `)

    const updatesByType = new Map()
    let updated = 0

    result.rows.forEach(row => {
      if (limit && updated >= limit) return
      const inferred = shouldUpdateContentType(row)
      if (!inferred) return

      if (!updatesByType.has(inferred)) {
        updatesByType.set(inferred, [])
      }
      updatesByType.get(inferred).push(row.id)
      updated += 1
    })

    if (!dryRun && updated > 0) {
      for (const [contentType, ids] of updatesByType.entries()) {
        await client.query(
          'UPDATE regulatory_updates SET content_type = $1 WHERE id = ANY($2::int[])',
          [contentType, ids]
        )
      }
    }

    const counts = {}
    for (const [contentType, ids] of updatesByType.entries()) {
      counts[contentType] = ids.length
    }

    return { updated, counts }
  } finally {
    client.release()
  }
}

async function run() {
  console.log('Backfilling content types...')
  console.log(`Target: ${target} | Dry run: ${dryRun ? 'yes' : 'no'}${limit ? ` | Limit: ${limit}` : ''}`)

  const results = {}
  const wantsDb = target === 'db' || target === 'both' || target === 'auto'
  if (wantsDb) {
    await dbService.waitForInitialization()
  }

  if (target === 'json' || target === 'both' || target === 'auto') {
    if (target === 'auto' || target === 'json' || target === 'both') {
      results.json = await backfillJson()
      console.log(`JSON updates changed: ${results.json.updated}`)
    }
  }

  if (target === 'db' || target === 'both' || target === 'auto') {
    if (target === 'auto') {
      if (dbService.usePostgres) {
        results.db = await backfillDb()
        console.log(`DB updates changed: ${results.db.updated}`)
      } else {
        console.log('DB backfill skipped (Postgres unavailable).')
      }
    } else {
      results.db = await backfillDb()
      console.log(`DB updates changed: ${results.db.updated}`)
    }
  }

  const logCounts = (label, counts = {}) => {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
    if (!entries.length) return
    console.log(`\n${label} by content type:`)
    entries.forEach(([type, count]) => console.log(`  ${type}: ${count}`))
  }

  if (results.json) logCounts('JSON updates', results.json.counts)
  if (results.db) logCounts('DB updates', results.db.counts)

  console.log('\nDone.')
}

run().catch(error => {
  console.error('Backfill failed:', error.message)
  process.exit(1)
})
