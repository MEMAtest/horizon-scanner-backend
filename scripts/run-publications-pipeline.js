#!/usr/bin/env node
/**
 * FCA Publications Pipeline - GitHub Actions Runner
 *
 * Runs incremental update to scrape recent FCA publications,
 * download PDFs, parse text, and AI-analyze enforcement notices.
 *
 * Run via: node scripts/run-publications-pipeline.js
 *
 * Requires: DATABASE_URL environment variable
 */

const PipelineOrchestrator = require('../src/services/fcaPublications/pipelineOrchestrator')

async function main() {
  console.log('='.repeat(60))
  console.log('FCA Publications Pipeline - GitHub Actions')
  console.log('='.repeat(60))
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log()

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const orchestrator = new PipelineOrchestrator({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await orchestrator.initialize()
    console.log('Pipeline initialized')
    console.log()

    // Run incremental update (scrapes last 10 pages of recent publications)
    console.log('Running incremental update...')
    const result = await orchestrator.runIncrementalUpdate({
      maxPages: 10,
      onProgress: (progress) => {
        console.log(`  Progress: ${JSON.stringify(progress)}`)
      }
    })

    console.log()
    console.log('='.repeat(60))
    console.log('RESULTS')
    console.log('='.repeat(60))
    console.log(`Total new publications: ${result.totalNew || 0}`)
    console.log(`Total processed: ${result.totalProcessed || 0}`)
    console.log()
    console.log(`Completed at: ${new Date().toISOString()}`)

    // Get pipeline status for summary
    const status = await orchestrator.getStatus()
    if (status) {
      console.log()
      console.log('Pipeline Status:')
      console.log(`  Total indexed: ${status.pipelineStats?.total_indexed || 'N/A'}`)
      console.log(`  Pending download: ${status.statusCounts?.pending || 0}`)
      console.log(`  Downloaded: ${status.statusCounts?.downloaded || 0}`)
      console.log(`  Parsed: ${status.statusCounts?.parsed || 0}`)
      console.log(`  Processed: ${status.statusCounts?.processed || 0}`)
    }

    // Close browser if still open
    if (orchestrator.searchScraper?.browser) {
      await orchestrator.searchScraper.closeBrowser()
    }

    process.exit(0)
  } catch (error) {
    console.error()
    console.error('Fatal error:', error.message)
    console.error(error.stack)

    // Try to close browser on error
    try {
      if (orchestrator?.searchScraper?.browser) {
        await orchestrator.searchScraper.closeBrowser()
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    process.exit(1)
  }
}

main()
