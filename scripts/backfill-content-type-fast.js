#!/usr/bin/env node
/**
 * FAST Backfill content_type - processes records in parallel
 */

require('dotenv').config()
const dbService = require('../src/services/dbService')
const aiAnalyzer = require('../src/services/aiAnalyzer')

const PARALLEL_REQUESTS = 10  // Process 10 records simultaneously
const DELAY_BETWEEN_BATCHES = 1000

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processRecord(client, record) {
  try {
    const analysisResult = await aiAnalyzer.analyzeUpdate({
      headline: record.headline,
      summary: record.summary,
      url: record.url,
      authority: record.authority,
      publishedDate: record.published_date,
      area: record.area
    })

    const aiData = analysisResult?.data || analysisResult
    const newContentType = aiData?.content_type || aiData?.contentType

    if (newContentType && newContentType !== 'Other' && newContentType !== 'OTHER') {
      await client.query(`UPDATE regulatory_updates SET content_type = $1 WHERE id = $2`, [newContentType, record.id])
      return { id: record.id, status: 'updated', type: newContentType }
    }
    return { id: record.id, status: 'unchanged' }
  } catch (error) {
    return { id: record.id, status: 'error', error: error.message }
  }
}

async function backfillFast() {
  console.log('🚀 FAST content_type backfill (10 parallel requests)\n')

  const client = await dbService.pool.connect()
  try {
    const result = await client.query(`
      SELECT id, url, headline, summary, authority, published_date, area
      FROM regulatory_updates WHERE content_type = 'Other' ORDER BY id DESC
    `)

    const records = result.rows
    console.log(`📊 Found ${records.length} records to process\n`)

    let updated = 0, unchanged = 0, errors = 0

    for (let i = 0; i < records.length; i += PARALLEL_REQUESTS) {
      const batch = records.slice(i, i + PARALLEL_REQUESTS)
      const batchNum = Math.floor(i / PARALLEL_REQUESTS) + 1
      const totalBatches = Math.ceil(records.length / PARALLEL_REQUESTS)

      // Process batch in parallel
      const results = await Promise.all(batch.map(r => processRecord(client, r)))

      results.forEach(r => {
        if (r.status === 'updated') { updated++; console.log(`  ✅ ${r.id} → ${r.type}`) }
        else if (r.status === 'error') { errors++ }
        else { unchanged++ }
      })

      const progress = Math.round(((i + batch.length) / records.length) * 100)
      console.log(`📦 Batch ${batchNum}/${totalBatches} | Progress: ${progress}% | Updated: ${updated} | Unchanged: ${unchanged}\n`)

      if (i + PARALLEL_REQUESTS < records.length) await sleep(DELAY_BETWEEN_BATCHES)
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Updated: ${updated} | ⏭️ Unchanged: ${unchanged} | ❌ Errors: ${errors}`)
    console.log('='.repeat(50))

  } finally {
    client.release()
  }
  process.exit(0)
}

backfillFast()
