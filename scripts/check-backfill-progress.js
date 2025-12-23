#!/usr/bin/env node

/**
 * FCA Publications Progress Checker
 *
 * CLI tool to check pipeline status and progress
 *
 * Usage:
 *   node scripts/check-backfill-progress.js [options]
 *
 * Options:
 *   --watch              Continuously monitor progress
 *   --interval=<ms>      Watch interval in milliseconds (default: 5000)
 *   --jobs               Show recent jobs
 *   --stats              Show detailed statistics
 */

require('dotenv').config();
const PipelineOrchestrator = require('../src/services/fcaPublications/pipelineOrchestrator');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

function formatNumber(num) {
  return (num || 0).toLocaleString();
}

function formatCurrency(num) {
  return '£' + formatNumber(Math.round(num || 0));
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

function formatDuration(ms) {
  if (!ms) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

async function printStatus(pipeline) {
  const status = await pipeline.getStatus();

  console.clear();
  console.log('========================================');
  console.log('FCA Publications Pipeline Status');
  console.log(`Updated: ${new Date().toLocaleString()}`);
  console.log('========================================\n');

  // Pipeline overview
  console.log('Pipeline Overview:');
  console.log(`  Total Publications:    ${formatNumber(status.pipeline.total_publications)}`);
  console.log(`  Pending:               ${formatNumber(status.pipeline.pending)}`);
  console.log(`  Downloaded:            ${formatNumber(status.pipeline.downloaded)}`);
  console.log(`  Parsed:                ${formatNumber(status.pipeline.parsed)}`);
  console.log(`  Processed:             ${formatNumber(status.pipeline.processed)}`);
  console.log(`  Failed:                ${formatNumber(status.pipeline.failed)}`);
  console.log('');

  // Enforcement notices
  console.log('Enforcement Notices:');
  console.log(`  Total Notices:         ${formatNumber(status.pipeline.enforcement_notices)}`);
  console.log(`  Total Fines:           ${formatCurrency(status.pipeline.total_fines)}`);
  console.log('');

  // Status breakdown
  console.log('Status Breakdown:');
  for (const [stat, count] of Object.entries(status.statusCounts || {})) {
    console.log(`  ${stat.padEnd(20)} ${formatNumber(count)}`);
  }
  console.log('');

  // Current job
  if (status.currentJob) {
    const job = status.currentJob;
    console.log('Current Job:');
    console.log(`  ID:                    ${job.job_id}`);
    console.log(`  Type:                  ${job.job_type}`);
    console.log(`  Status:                ${job.status}`);
    console.log(`  Progress:              ${formatNumber(job.processed_items)} / ${formatNumber(job.total_items)}`);

    if (job.items_per_minute) {
      console.log(`  Rate:                  ${job.items_per_minute.toFixed(1)} items/min`);
    }

    if (job.estimate) {
      console.log(`  Remaining:             ${formatNumber(job.estimate.remainingItems)} items`);
      console.log(`  Est. Time:             ${formatDuration(job.estimate.minutesRemaining * 60000)}`);
      console.log(`  Est. Completion:       ${formatDate(job.estimate.estimatedCompletion)}`);
    }

    if (job.last_error) {
      console.log(`  Last Error:            ${job.last_error}`);
    }
    console.log('');
  }

  // Jobs summary
  console.log('Jobs Summary:');
  console.log(`  Running:               ${formatNumber(status.jobs.running_jobs)}`);
  console.log(`  Completed:             ${formatNumber(status.jobs.completed_jobs)}`);
  console.log(`  Failed:                ${formatNumber(status.jobs.failed_jobs)}`);
  console.log(`  Total Processed:       ${formatNumber(status.jobs.total_processed)}`);
  console.log(`  Last Completion:       ${formatDate(status.jobs.last_completion)}`);
  console.log('');

  // Component stats
  if (status.components) {
    console.log('Component Stats:');
    if (status.components.searchScraper) {
      console.log(`  Scraper Requests:      ${formatNumber(status.components.searchScraper.requestCount)}`);
    }
    if (status.components.pdfDownloader) {
      console.log(`  PDFs Downloaded:       ${formatNumber(status.components.pdfDownloader.downloadCount)}`);
      console.log(`  Download Failed:       ${formatNumber(status.components.pdfDownloader.failedCount)}`);
    }
    if (status.components.pdfParser) {
      console.log(`  PDFs Parsed:           ${formatNumber(status.components.pdfParser.parseCount)}`);
    }
    if (status.components.aiClassifier) {
      console.log(`  AI Processed:          ${formatNumber(status.components.aiClassifier.processCount)}`);
    }
    console.log('');
  }
}

async function printJobs(pipeline) {
  const jobs = await pipeline.getJobs({ limit: 10 });

  console.log('Recent Jobs:');
  console.log('-'.repeat(100));
  console.log(
    'ID'.padEnd(35) +
    'Type'.padEnd(18) +
    'Status'.padEnd(12) +
    'Processed'.padEnd(12) +
    'Started'
  );
  console.log('-'.repeat(100));

  for (const job of jobs) {
    console.log(
      job.job_id.padEnd(35) +
      job.job_type.padEnd(18) +
      job.status.padEnd(12) +
      formatNumber(job.processed_items).padEnd(12) +
      formatDate(job.started_at)
    );
  }
  console.log('');
}

async function printStats(pipeline) {
  const stats = await pipeline.getStats();

  console.log('\nBreach Type Statistics:');
  console.log('-'.repeat(80));
  console.log(
    'Breach Type'.padEnd(25) +
    'Count'.padEnd(10) +
    'Total Fines'.padEnd(20) +
    'Avg Fine'
  );
  console.log('-'.repeat(80));

  for (const row of stats.breaches || []) {
    console.log(
      (row.primary_breach_type || 'Unknown').padEnd(25) +
      formatNumber(row.count).padEnd(10) +
      formatCurrency(row.total_fines).padEnd(20) +
      formatCurrency(row.avg_fine)
    );
  }

  console.log('\nYearly Statistics:');
  console.log('-'.repeat(60));
  console.log(
    'Year'.padEnd(10) +
    'Outcome'.padEnd(25) +
    'Count'.padEnd(10) +
    'Total Fines'
  );
  console.log('-'.repeat(60));

  for (const row of (stats.yearly || []).slice(0, 20)) {
    console.log(
      String(row.year || '').padEnd(10) +
      (row.outcome_type || '').padEnd(25) +
      formatNumber(row.count).padEnd(10) +
      formatCurrency(row.total_fines)
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pipeline = new PipelineOrchestrator();

  try {
    await pipeline.initialize();

    if (args.watch) {
      const interval = parseInt(args.interval) || 5000;
      console.log(`Watching progress (interval: ${interval}ms). Press Ctrl+C to stop.\n`);

      const update = async () => {
        try {
          await printStatus(pipeline);
        } catch (error) {
          console.error('Error updating status:', error.message);
        }
      };

      await update();
      setInterval(update, interval);

      // Keep process running
      process.on('SIGINT', async () => {
        console.log('\n\nStopping...');
        await pipeline.close();
        process.exit(0);
      });

    } else {
      await printStatus(pipeline);

      if (args.jobs) {
        await printJobs(pipeline);
      }

      if (args.stats) {
        await printStats(pipeline);
      }

      await pipeline.close();
    }

  } catch (error) {
    console.error('Error:', error.message);
    await pipeline.close();
    process.exit(1);
  }
}

main();
