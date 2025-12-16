#!/usr/bin/env node

/**
 * Run AI Analysis on FCA Fines
 * This script processes all unanalyzed fines using Claude AI to extract:
 * - breach_categories
 * - affected_sectors (firm_category)
 * - ai_summary
 * - risk_score
 * - customer_impact_level
 */

require('dotenv').config()
const FCAFinesAI = require('./src/services/fcaFinesAI')
const aiAnalyzer = require('./src/services/aiAnalyzer')  // Already an instance

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
}

async function main() {
  console.log('🚀 Starting AI Analysis of FCA Fines...')
  console.log('=' .repeat(60))

  // Initialize FCA AI service (aiAnalyzer is already initialized)
  const fcaAI = new FCAFinesAI(dbConfig, aiAnalyzer)

  try {
    // Check how many fines need processing
    const { Pool } = require('pg')
    const db = new Pool(dbConfig)

    const countResult = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN processed_by_ai = false THEN 1 END) as unprocessed
      FROM fca_fines
    `)

    const { total, unprocessed } = countResult.rows[0]
    console.log(`📊 Database Status:`)
    console.log(`   Total fines: ${total}`)
    console.log(`   Unprocessed: ${unprocessed}`)
    console.log(`   Already processed: ${total - unprocessed}`)
    console.log()

    if (unprocessed === 0) {
      console.log('✅ All fines have been processed!')
      await db.end()
      await fcaAI.close()
      process.exit(0)
    }

    // Process in batches
    const batchSize = 10
    let totalProcessed = 0
    let totalErrors = 0

    console.log(`🔄 Processing ${unprocessed} fines in batches of ${batchSize}...`)
    console.log()

    while (totalProcessed + totalErrors < unprocessed) {
      console.log(`\n📦 Batch ${Math.floor(totalProcessed / batchSize) + 1}`)
      console.log('-'.repeat(60))

      const result = await fcaAI.processUnanalyzedFines(batchSize)

      totalProcessed += result.processed
      totalErrors += result.errors

      console.log(`   ✅ Processed: ${result.processed}`)
      console.log(`   ❌ Errors: ${result.errors}`)
      console.log(`   📈 Total progress: ${totalProcessed}/${unprocessed} (${Math.round(totalProcessed/unprocessed*100)}%)`)

      // If no more fines processed, break
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

    await db.end()
    await fcaAI.close()
    process.exit(0)

  } catch (error) {
    console.error('❌ Fatal error:', error)
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
