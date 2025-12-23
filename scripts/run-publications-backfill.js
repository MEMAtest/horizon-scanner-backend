#!/usr/bin/env node

/**
 * FCA Publications Backfill Script
 *
 * CLI tool to run the full publications backfill pipeline
 *
 * Usage:
 *   node scripts/run-publications-backfill.js [options]
 *
 * Options:
 *   --stage=<stage>     Run specific stage only (index, download, parse, ai)
 *   --skip=<stages>     Skip stages (comma-separated: index,download,parse,ai)
 *   --max-pages=<n>     Limit index stage to n pages
 *   --dry-run           Show what would be done without executing
 */

require('dotenv').config();
const PipelineOrchestrator = require('../src/services/fcaPublications/pipelineOrchestrator');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

async function main() {
  console.log('========================================');
  console.log('FCA Publications Backfill');
  console.log('========================================\n');

  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY not set. AI classification will fail.\n');
  }

  // Show configuration
  console.log('Configuration:');
  console.log(`  Database: ${process.env.DATABASE_URL.substring(0, 30)}...`);
  console.log(`  Stage: ${args.stage || 'all'}`);
  console.log(`  Skip: ${args.skip || 'none'}`);
  console.log(`  Max Pages: ${args['max-pages'] || 'unlimited'}`);
  console.log(`  Dry Run: ${args['dry-run'] || false}\n`);

  if (args['dry-run']) {
    console.log('DRY RUN MODE - No changes will be made\n');
    process.exit(0);
  }

  // Initialize pipeline
  const pipeline = new PipelineOrchestrator();

  // Progress callback
  const onProgress = (progress) => {
    const { stage, overallStage, totalStages } = progress;

    if (stage === 'index') {
      console.log(
        `[Stage ${overallStage}/${totalStages}] Index: Page ${progress.pageNumber}, ` +
        `${progress.totalScraped} scraped, ${progress.totalInserted} new`
      );
    } else {
      console.log(
        `[Stage ${overallStage}/${totalStages}] ${stage}: ` +
        `${progress.batchResults?.successful || 0} successful, ` +
        `${progress.batchResults?.failed || 0} failed`
      );
    }
  };

  // Handle graceful shutdown
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log('\n\nShutdown requested, saving progress...');
    pipeline.pause();

    // Wait a bit for current operation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Progress saved. Run again to resume.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await pipeline.initialize();
    console.log('Pipeline initialized\n');

    // Parse skip stages
    const skipStages = args.skip
      ? args.skip.split(',').map(s => s.trim())
      : [];

    // Run specific stage or full backfill
    if (args.stage) {
      const stage = args.stage;
      console.log(`Running stage: ${stage}\n`);

      const stageOptions = {};
      if (args['max-pages']) {
        stageOptions.maxPages = parseInt(args['max-pages']);
      }
      stageOptions.onProgress = onProgress;

      switch (stage) {
        case 'index':
          await pipeline.runIndexStage(stageOptions);
          break;
        case 'download':
          await pipeline.runDownloadStage(stageOptions);
          break;
        case 'parse':
          await pipeline.runParseStage(stageOptions);
          break;
        case 'ai':
          await pipeline.runAIStage(stageOptions);
          break;
        default:
          console.error(`Unknown stage: ${stage}`);
          process.exit(1);
      }
    } else {
      console.log('Running full backfill...\n');

      const options = {
        skipStages,
        onProgress
      };

      if (args['max-pages']) {
        // Note: max-pages only affects index stage in full backfill
        console.warn('Note: --max-pages only affects index stage\n');
      }

      await pipeline.runFullBackfill(options);
    }

    // Print final statistics
    console.log('\n========================================');
    console.log('Backfill Complete!');
    console.log('========================================\n');

    const stats = await pipeline.getStatus();
    console.log('Final Statistics:');
    console.log(`  Total Publications: ${stats.pipeline.total_publications}`);
    console.log(`  Processed: ${stats.pipeline.processed}`);
    console.log(`  Enforcement Notices: ${stats.pipeline.enforcement_notices}`);
    console.log(`  Total Fines: £${(stats.pipeline.total_fines || 0).toLocaleString()}`);

    await pipeline.close();
    process.exit(0);

  } catch (error) {
    if (error.message === 'Job paused') {
      console.log('\n\nJob paused. Run again to resume.');
    } else if (error.message === 'Job cancelled') {
      console.log('\n\nJob cancelled.');
    } else {
      console.error('\nBackfill failed:', error.message);
      console.error(error.stack);
    }

    await pipeline.close();
    process.exit(1);
  }
}

main();
