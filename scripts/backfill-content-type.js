#!/usr/bin/env node
/**
 * Backfill content_type for records currently set to 'Other'
 * Re-runs AI analysis to get accurate content type classification
 */

require('dotenv').config()
const dbService = require('../src/services/dbService')
const aiAnalyzer = require('../src/services/aiAnalyzer')

const BATCH_SIZE = 20
const DELAY_BETWEEN_BATCHES = 2000 // 2 seconds

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function backfillContentType() {
  console.log('🔄 Starting content_type backfill for "Other" records...\n')

  try {
    // Get records with content_type = 'Other'
    const client = await dbService.pool.connect()

    try {
      const result = await client.query(`
        SELECT id, url, headline, summary, authority, published_date, area
        FROM regulatory_updates
        WHERE content_type = 'Other'
        ORDER BY published_date DESC
      `)

      const records = result.rows
      console.log(`📊 Found ${records.length} records with content_type = 'Other'\n`)

      if (records.length === 0) {
        console.log('✅ No records to update!')
        return
      }

      let updated = 0
      let errors = 0
      let unchanged = 0

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE)
        console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(records.length/BATCH_SIZE)} (${batch.length} records)`)

        for (const record of batch) {
          try {
            // Run AI analysis
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
              // Update the record with new content_type
              await client.query(`
                UPDATE regulatory_updates
                SET content_type = $1
                WHERE id = $2
              `, [newContentType, record.id])

              updated++
              console.log(`  ✅ ${record.id}: "${record.headline?.substring(0, 40)}..." → ${newContentType}`)
            } else {
              unchanged++
              console.log(`  ⏭️  ${record.id}: Remains "Other"`)
            }
          } catch (error) {
            errors++
            console.error(`  ❌ ${record.id}: Error - ${error.message}`)
          }
        }

        // Progress update
        const progress = Math.min(100, Math.round(((i + batch.length) / records.length) * 100))
        console.log(`\n📈 Progress: ${progress}% | Updated: ${updated} | Unchanged: ${unchanged} | Errors: ${errors}`)

        // Delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < records.length) {
          console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...`)
          await sleep(DELAY_BETWEEN_BATCHES)
        }
      }

      console.log('\n' + '='.repeat(50))
      console.log('📊 BACKFILL COMPLETE')
      console.log('='.repeat(50))
      console.log(`✅ Updated: ${updated}`)
      console.log(`⏭️  Unchanged: ${unchanged}`)
      console.log(`❌ Errors: ${errors}`)
      console.log(`📝 Total processed: ${records.length}`)

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

backfillContentType()
