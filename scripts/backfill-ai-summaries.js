#!/usr/bin/env node
/**
 * Backfill AI summaries for records that have NULL or empty ai_summary
 * Re-runs AI analysis to generate accurate summaries
 */

require('dotenv').config()
const dbService = require('../src/services/dbService')
const aiAnalyzer = require('../src/services/aiAnalyzer')

const BATCH_SIZE = 10
const DELAY_BETWEEN_BATCHES = 3000 // 3 seconds to avoid rate limits

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function backfillAISummaries() {
  console.log('Starting AI summary backfill for records with missing summaries...\n')

  try {
    const client = await dbService.pool.connect()

    try {
      // Get records with NULL or empty ai_summary
      const result = await client.query(`
        SELECT id, url, headline, summary, authority, published_date, area, content_type
        FROM regulatory_updates
        WHERE ai_summary IS NULL OR ai_summary = ''
        ORDER BY published_date DESC
        LIMIT 350
      `)

      const records = result.rows
      console.log(`Found ${records.length} records with missing AI summaries\n`)

      if (records.length === 0) {
        console.log('No records to update!')
        return
      }

      let updated = 0
      let errors = 0
      let skipped = 0

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE)
        console.log(`\nProcessing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(records.length/BATCH_SIZE)} (${batch.length} records)`)

        for (const record of batch) {
          try {
            // Clean HTML from summary
            const cleanSummary = stripHtml(record.summary)

            // Skip if headline is too short or non-English looking
            if (!record.headline || record.headline.length < 10) {
              skipped++
              console.log(`  [SKIP] ${record.id}: Headline too short`)
              continue
            }

            // Run AI analysis
            const analysisResult = await aiAnalyzer.analyzeUpdate({
              headline: record.headline,
              summary: cleanSummary || record.headline,
              url: record.url,
              authority: record.authority,
              publishedDate: record.published_date,
              area: record.area
            })

            const aiData = analysisResult?.data || analysisResult

            // Extract the AI summary
            const newAISummary = aiData?.ai_summary || aiData?.impact || aiData?.summary
            const newContentType = aiData?.content_type || aiData?.contentType || 'OTHER'
            const newImpactLevel = aiData?.impactLevel || aiData?.impact_level || 'Informational'
            const newUrgency = aiData?.urgency || 'Low'
            const newBusinessImpactScore = aiData?.businessImpactScore || aiData?.business_impact_score || 3
            const newConfidence = aiData?.confidence || aiData?.ai_confidence_score || 0.6

            if (newAISummary && newAISummary.length > 20) {
              // Update the record with AI analysis results
              await client.query(`
                UPDATE regulatory_updates
                SET
                  ai_summary = $1,
                  content_type = COALESCE(NULLIF($2, 'OTHER'), content_type, 'OTHER'),
                  impact_level = COALESCE($3, impact_level, 'Informational'),
                  urgency = COALESCE($4, urgency, 'Low'),
                  business_impact_score = COALESCE($5, business_impact_score, 3),
                  ai_confidence_score = $6
                WHERE id = $7
              `, [
                newAISummary,
                newContentType,
                newImpactLevel,
                newUrgency,
                newBusinessImpactScore,
                newConfidence,
                record.id
              ])

              updated++
              console.log(`  [OK] ${record.id}: "${record.headline?.substring(0, 50)}..."`)
            } else {
              skipped++
              console.log(`  [SKIP] ${record.id}: AI returned insufficient summary`)
            }
          } catch (error) {
            errors++
            console.error(`  [ERROR] ${record.id}: ${error.message}`)
          }
        }

        // Progress update
        const progress = Math.min(100, Math.round(((i + batch.length) / records.length) * 100))
        console.log(`\nProgress: ${progress}% | Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`)

        // Delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < records.length) {
          console.log(`Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...`)
          await sleep(DELAY_BETWEEN_BATCHES)
        }
      }

      console.log('\n' + '='.repeat(50))
      console.log('BACKFILL COMPLETE')
      console.log('='.repeat(50))
      console.log(`Updated: ${updated}`)
      console.log(`Skipped: ${skipped}`)
      console.log(`Errors: ${errors}`)
      console.log(`Total processed: ${records.length}`)

    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Backfill failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

backfillAISummaries()
