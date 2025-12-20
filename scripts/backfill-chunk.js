#!/usr/bin/env node
/**
 * Process a chunk of "Other" records - designed to run in parallel
 * Usage: node backfill-chunk.js <offset> <limit>
 */

require('dotenv').config()
const dbService = require('../src/services/dbService')
const aiAnalyzer = require('../src/services/aiAnalyzer')

const OFFSET = parseInt(process.argv[2]) || 0
const LIMIT = parseInt(process.argv[3]) || 200
const PARALLEL = 5

async function processRecord(client, record) {
  try {
    const result = await aiAnalyzer.analyzeUpdate({
      headline: record.headline,
      summary: record.summary,
      url: record.url,
      authority: record.authority,
      publishedDate: record.published_date,
      area: record.area
    })
    const aiData = result?.data || result
    const newType = aiData?.content_type || aiData?.contentType

    if (newType && newType !== 'Other' && newType !== 'OTHER') {
      await client.query(`UPDATE regulatory_updates SET content_type = $1 WHERE id = $2`, [newType, record.id])
      return { status: 'updated', type: newType }
    }
    return { status: 'unchanged' }
  } catch (e) {
    return { status: 'error' }
  }
}

async function run() {
  console.log(`\n🚀 CHUNK: offset=${OFFSET}, limit=${LIMIT}`)

  const client = await dbService.pool.connect()
  try {
    const { rows } = await client.query(`
      SELECT id, url, headline, summary, authority, published_date, area
      FROM regulatory_updates WHERE content_type = 'Other'
      ORDER BY id OFFSET $1 LIMIT $2
    `, [OFFSET, LIMIT])

    console.log(`📊 Processing ${rows.length} records...\n`)

    let updated = 0, unchanged = 0, errors = 0

    for (let i = 0; i < rows.length; i += PARALLEL) {
      const batch = rows.slice(i, i + PARALLEL)
      const results = await Promise.all(batch.map(r => processRecord(client, r)))

      results.forEach(r => {
        if (r.status === 'updated') { updated++; process.stdout.write(`✅`) }
        else if (r.status === 'error') { errors++; process.stdout.write(`❌`) }
        else { unchanged++; process.stdout.write(`⏭️`) }
      })

      if ((i + PARALLEL) % 50 === 0) {
        console.log(` [${Math.round((i+PARALLEL)/rows.length*100)}%]`)
      }
    }

    console.log(`\n\n✅ CHUNK COMPLETE: Updated=${updated} Unchanged=${unchanged} Errors=${errors}`)
  } finally {
    client.release()
  }
  process.exit(0)
}

run()
