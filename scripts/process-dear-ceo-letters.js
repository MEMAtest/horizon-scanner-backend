#!/usr/bin/env node

/**
 * Process Dear CEO letters individually with AI analysis
 * Avoids database pool timeout issues by processing one at a time with delays
 */

require('dotenv').config()
const dearCeoAnalyzer = require('../src/services/dearCeoAnalyzer')
const dbService = require('../src/services/dbService')

async function processLettersIndividually() {
  console.log('Starting individual Dear CEO letter AI analysis...')
  console.log('================================================\n')

  let client

  try {
    // Get all letters
    console.log('Fetching letters from database...')
    const letters = await dearCeoAnalyzer.getLetters({ limit: 500 })
    console.log(`Found ${letters.length} total letters\n`)

    // Filter for letters without AI analysis
    const lettersNeedingAnalysis = letters.filter(letter => {
      const aiSummary = letter.ai_summary
      if (!aiSummary || !aiSummary.trim().startsWith('{')) {
        return true
      }
      try {
        const parsed = JSON.parse(aiSummary)
        // Only process if it doesn't have aiModel field (old analysis)
        return !parsed.aiModel
      } catch (e) {
        return true
      }
    })

    console.log(`Letters needing AI analysis: ${lettersNeedingAnalysis.length}`)
    console.log('================================================\n')

    if (lettersNeedingAnalysis.length === 0) {
      console.log('No letters need analysis. All done!')
      process.exit(0)
    }

    // Process statistics
    let successCount = 0
    let failedCount = 0
    const failedIds = []

    // Process each letter individually
    for (let i = 0; i < lettersNeedingAnalysis.length; i++) {
      const letter = lettersNeedingAnalysis[i]
      const current = i + 1
      const total = lettersNeedingAnalysis.length

      console.log(`[${current}/${total}] Processing letter ID ${letter.id}`)
      console.log(`  Headline: ${letter.headline.substring(0, 70)}...`)

      try {
        // Generate AI analysis (this handles its own DB connection)
        const analysis = await dearCeoAnalyzer.generateAIOnePager(letter.id)

        // Save to database using a fresh connection
        client = await dbService.pool.connect()
        try {
          await client.query(`
            UPDATE regulatory_updates
            SET ai_summary = $1
            WHERE id = $2
          `, [JSON.stringify(analysis), letter.id])

          console.log(`  ✓ Success - AI analysis generated and saved`)
          successCount++
        } finally {
          client.release()
          client = null
        }

      } catch (error) {
        console.log(`  ✗ Failed - ${error.message}`)
        failedCount++
        failedIds.push(letter.id)
      }

      // Delay between requests to avoid overwhelming the API
      if (current < total) {
        console.log(`  Waiting 2 seconds before next request...\n`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.log('')
      }
    }

    // Summary
    console.log('================================================')
    console.log('Processing Complete!')
    console.log('================================================')
    console.log(`Total letters processed: ${lettersNeedingAnalysis.length}`)
    console.log(`Successfully analyzed: ${successCount}`)
    console.log(`Failed: ${failedCount}`)

    if (failedCount > 0) {
      console.log('\nFailed letter IDs:')
      failedIds.forEach(id => console.log(`  - ${id}`))
    }

    console.log('')

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    if (client) {
      client.release()
    }
    // Close the database pool
    await dbService.pool.end()
  }
}

// Run the script
processLettersIndividually()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
