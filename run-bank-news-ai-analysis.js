#!/usr/bin/env node

/**
 * Run AI Analysis on Bank News Items
 * This script processes all bank news items without AI summaries
 * using the enhanced AI analyzer service
 */

require('dotenv').config()
const { Pool } = require('pg')
const aiAnalyzer = require('./src/services/aiAnalyzer')

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
}

class BankNewsAI {
  constructor(dbConfig, aiAnalyzer) {
    this.db = new Pool(dbConfig)
    this.aiAnalyzer = aiAnalyzer
  }

  async processUnanalyzedBankNews(batchSize = 10) {
    console.log('🏦 Starting AI analysis of bank news items...')

    try {
      // Get unprocessed bank news items
      const unprocessed = await this.db.query(
        `SELECT id, headline, summary, url, authority, published_date,
                sector, area, content_type
         FROM regulatory_updates
         WHERE source_category = 'bank_news'
         AND (ai_summary IS NULL OR ai_summary = '')
         ORDER BY published_date DESC
         LIMIT $1`,
        [batchSize]
      )

      if (unprocessed.rows.length === 0) {
        console.log('✅ No unprocessed bank news items found')
        return { processed: 0, errors: 0 }
      }

      console.log(`📊 Processing ${unprocessed.rows.length} bank news items...`)

      let processed = 0
      let errors = 0

      for (const item of unprocessed.rows) {
        try {
          console.log(`   🔍 Analyzing: ${item.headline?.substring(0, 60)}...`)

          const analysis = await this.analyzeBankNewsItem(item)
          await this.saveAnalysis(item.id, analysis)

          processed++
          console.log(`   ✅ Completed: ${item.headline?.substring(0, 60)}...`)

          // Rate limiting - respect API limits
          await this.delay(1000)
        } catch (error) {
          console.error(`   ❌ Error analyzing item ${item.id}:`, error.message)
          errors++

          // Continue processing even if one fails
          await this.markAnalysisFailed(item.id, error.message)
        }
      }

      console.log(`🎉 AI analysis completed: ${processed} processed, ${errors} errors`)
      return { processed, errors }
    } catch (error) {
      console.error('❌ Error in AI analysis process:', error)
      throw error
    }
  }

  async analyzeBankNewsItem(item) {
    // Build the content for analysis
    const contentForAnalysis = `
Title: ${item.headline || 'No title'}
Source: ${item.authority || 'Unknown'}
Published: ${item.published_date || 'Unknown date'}
${item.summary ? `Summary: ${item.summary}` : ''}
URL: ${item.url || 'No URL'}
    `.trim()

    if (contentForAnalysis.length < 50) {
      throw new Error('Insufficient content for analysis')
    }

    // Use the AI analyzer to analyze the content
    const metadata = {
      authority: item.authority,
      sector: item.sector,
      area: item.area,
      contentType: 'bank_news',
      sourceCategory: 'bank_news'
    }

    try {
      const analysis = await this.aiAnalyzer.analyzeUpdate({
        headline: item.headline,
        summary: item.summary,
        url: item.url,
        authority: item.authority,
        published_date: item.published_date,
        sector: item.sector,
        area: item.area,
        content_type: item.content_type
      })

      return analysis
    } catch (error) {
      console.error('AI analysis failed:', error.message)
      throw error
    }
  }

  async saveAnalysis(updateId, analysis) {
    try {
      await this.db.query(
        `UPDATE regulatory_updates
         SET ai_summary = $1,
             ai_tags = $2,
             firm_types_affected = $3,
             business_impact_score = $4,
             ai_confidence_score = $5,
             sector_relevance_scores = $6
         WHERE id = $7`,
        [
          analysis.ai_summary || analysis.summary || null,
          JSON.stringify(analysis.ai_tags || []),
          JSON.stringify(analysis.firm_types_affected || []),
          analysis.business_impact_score || 0,
          analysis.ai_confidence_score || 0.0,
          JSON.stringify(analysis.sector_relevance_scores || {}),
          updateId
        ]
      )
    } catch (error) {
      console.error('Error saving analysis:', error)
      throw error
    }
  }

  async markAnalysisFailed(updateId, errorMessage) {
    try {
      await this.db.query(
        `UPDATE regulatory_updates
         SET ai_summary = $1
         WHERE id = $2`,
        [`Error during AI analysis: ${errorMessage}`, updateId]
      )
    } catch (error) {
      console.error('Error marking failed analysis:', error)
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async close() {
    await this.db.end()
  }
}

async function main() {
  console.log('🚀 Starting AI Analysis of Bank News Items...')
  console.log('=' .repeat(60))

  // Initialize Bank News AI service
  const bankNewsAI = new BankNewsAI(dbConfig, aiAnalyzer)

  try {
    // Check how many items need processing
    const countResult = await bankNewsAI.db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN ai_summary IS NULL OR ai_summary = '' THEN 1 END) as unprocessed
      FROM regulatory_updates
      WHERE source_category = 'bank_news'
    `)

    const { total, unprocessed } = countResult.rows[0]
    console.log(`📊 Database Status:`)
    console.log(`   Total bank news items: ${total}`)
    console.log(`   Unprocessed: ${unprocessed}`)
    console.log(`   Already processed: ${total - unprocessed}`)
    console.log()

    if (unprocessed === '0' || unprocessed === 0) {
      console.log('✅ All bank news items have been processed!')
      await bankNewsAI.close()
      process.exit(0)
    }

    // Process in batches
    const batchSize = 10
    let totalProcessed = 0
    let totalErrors = 0

    console.log(`🔄 Processing ${unprocessed} items in batches of ${batchSize}...`)
    console.log()

    while (totalProcessed + totalErrors < unprocessed) {
      console.log(`\n📦 Batch ${Math.floor(totalProcessed / batchSize) + 1}`)
      console.log('-'.repeat(60))

      const result = await bankNewsAI.processUnanalyzedBankNews(batchSize)

      totalProcessed += result.processed
      totalErrors += result.errors

      console.log(`   ✅ Processed: ${result.processed}`)
      console.log(`   ❌ Errors: ${result.errors}`)
      console.log(`   📈 Total progress: ${totalProcessed}/${unprocessed} (${Math.round(totalProcessed/unprocessed*100)}%)`)

      // If no more items processed, break
      if (result.processed === 0 && result.errors === 0) {
        break
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('🎉 AI Analysis Complete!')
    console.log(`   ✅ Successfully processed: ${totalProcessed}`)
    console.log(`   ❌ Errors: ${totalErrors}`)
    console.log(`   📊 Success rate: ${Math.round(totalProcessed/(totalProcessed+totalErrors)*100)}%`)

    await bankNewsAI.close()
    process.exit(0)

  } catch (error) {
    console.error('❌ Fatal error:', error)
    await bankNewsAI.close()
    process.exit(1)
  }
}

// Handle interruptions gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted by user')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Process terminated')
  process.exit(0)
})

main()
