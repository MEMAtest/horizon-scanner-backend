require('dotenv').config()

const fs = require('fs')
const path = require('path')

const db = require('../src/services/dbService')
const { ingestFcaHandbook } = require('../src/services/handbookIngestionService')

function parseArgs(argv) {
  const options = {
    batchSize: 8,
    startBatch: 1,
    endBatch: null,
    codes: null
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--batch-size=')) {
      options.batchSize = Number(arg.split('=')[1])
    } else if (arg === '--batch-size') {
      options.batchSize = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--start-batch=')) {
      options.startBatch = Number(arg.split('=')[1])
    } else if (arg === '--start-batch') {
      options.startBatch = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--end-batch=')) {
      options.endBatch = Number(arg.split('=')[1])
    } else if (arg === '--end-batch') {
      options.endBatch = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--codes=')) {
      options.codes = arg.split('=')[1]
    } else if (arg === '--codes') {
      options.codes = argv[i + 1]
      i += 1
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }

  return options
}

function loadInventory() {
  const inventoryPath = path.join(__dirname, '..', 'tmp', 'fca-handbook-inventory.json')
  if (!fs.existsSync(inventoryPath)) {
    throw new Error(`Inventory file missing: ${inventoryPath}`)
  }
  const data = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
  const expectedByCode = new Map()
  const codes = []

  data.sourcebooks.forEach(book => {
    const code = (book.code || '').toUpperCase()
    if (!code) return
    if (!expectedByCode.has(code)) {
      codes.push(code)
    }
    expectedByCode.set(code, { chapters: book.chapters, sections: book.sections })
  })

  codes.sort()
  return { codes, expectedByCode }
}

function chunkArray(list, size) {
  const chunks = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

async function fetchBatchCounts(batch) {
  const client = await db.pool.connect()
  try {
    const result = await client.query(
      `SELECT sb.code,
              COUNT(DISTINCT s.id) FILTER (WHERE s.level = 1) AS chapter_count,
              COUNT(DISTINCT s.id) FILTER (WHERE s.level = 2) AS section_count,
              COUNT(p.id) AS paragraph_count
       FROM reg_document_sourcebooks sb
       JOIN LATERAL (
         SELECT id
         FROM reg_document_versions v
         WHERE v.sourcebook_id = sb.id
         ORDER BY ingested_at DESC
         LIMIT 1
       ) v ON TRUE
       LEFT JOIN reg_document_sections s ON s.version_id = v.id
       LEFT JOIN reg_document_paragraphs p ON p.section_id = s.id
       WHERE sb.authority = 'FCA' AND sb.code = ANY($1)
       GROUP BY sb.code
       ORDER BY sb.code`,
      [batch]
    )
    return result.rows
  } finally {
    client.release()
  }
}

function logCheckpoint(rows, expectedByCode, batch) {
  const rowMap = new Map(rows.map(row => [row.code, row]))
  batch.forEach(code => {
    const expected = expectedByCode.get(code)
    const row = rowMap.get(code)
    if (!row) {
      console.log(`  ⚠️  ${code}: no data found after ingest`)
      return
    }
    const chapterCount = Number(row.chapter_count || 0)
    const sectionCount = Number(row.section_count || 0)
    const paragraphCount = Number(row.paragraph_count || 0)
    const chapterMatch = expected ? chapterCount === expected.chapters : null
    const sectionMatch = expected ? sectionCount === expected.sections : null
    const chapterFlag = chapterMatch === null ? 'n/a' : (chapterMatch ? 'ok' : 'mismatch')
    const sectionFlag = sectionMatch === null ? 'n/a' : (sectionMatch ? 'ok' : 'mismatch')
    console.log(
      `  ${code}: chapters ${chapterCount} (${chapterFlag}), sections ${sectionCount} (${sectionFlag}), provisions ${paragraphCount}`
    )
  })
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log('Usage: node scripts/ingest-fca-handbook-batches.js [options]')
    console.log('')
    console.log('Options:')
    console.log('  --batch-size=8        Number of sourcebooks per batch')
    console.log('  --start-batch=1       Start batch (1-based)')
    console.log('  --end-batch=4         End batch (inclusive, 1-based)')
    console.log('  --codes=PRIN,SYSC     Override inventory with explicit codes')
    process.exit(0)
  }

  const { codes: inventoryCodes, expectedByCode } = loadInventory()
  const codes = options.codes
    ? options.codes.split(',').map(code => code.trim().toUpperCase()).filter(Boolean)
    : inventoryCodes

  const batchSize = Number.isInteger(options.batchSize) && options.batchSize > 0 ? options.batchSize : 8
  const batches = chunkArray(codes, batchSize)
  const startBatch = Math.max(1, options.startBatch || 1)
  const endBatch = options.endBatch ? Math.min(options.endBatch, batches.length) : batches.length

  await db.waitForInitialization()
  if (db.fallbackMode || !db.pool) {
    throw new Error('PostgreSQL is required to ingest FCA handbook data.')
  }

  console.log(`Total sourcebooks: ${codes.length}`)
  console.log(`Batches: ${batches.length} (size ${batchSize})`)
  console.log(`Running batches ${startBatch} to ${endBatch}`)

  for (let index = startBatch - 1; index < endBatch; index += 1) {
    const batch = batches[index]
    console.log(`\n=== Batch ${index + 1} / ${batches.length} ===`)
    console.log(`Codes: ${batch.join(', ')}`)

    const stats = await ingestFcaHandbook({ sourcebooks: batch })
    console.log(`Ingested sourcebooks: ${stats.sourcebooks}, chapters: ${stats.chapters}, sections: ${stats.sections}, provisions: ${stats.provisions}`)

    const rows = await fetchBatchCounts(batch)
    logCheckpoint(rows, expectedByCode, batch)
  }
}

run().catch(error => {
  console.error('Batch ingest failed:', error.message)
  process.exit(1)
})
