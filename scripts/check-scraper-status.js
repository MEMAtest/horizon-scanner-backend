/**
 * Check scraper status and data quality
 */
require('dotenv').config();
const dbService = require('../src/services/dbService');

async function checkScraperStatus() {
  console.log('Checking scraper data quality...\n');

  try {
    const client = await dbService.pool.connect();

    try {
      // Get counts by authority for international scrapers
      const result = await client.query(`
        SELECT
          authority,
          COUNT(*) as total,
          COUNT(CASE WHEN ai_summary IS NOT NULL AND ai_summary != '' THEN 1 END) as with_summary,
          MAX(published_date) as latest_date,
          MAX(created_at) as last_fetched
        FROM regulatory_updates
        WHERE source_category = 'international_scraping'
        GROUP BY authority
        ORDER BY total DESC
      `);

      console.log('='.repeat(80));
      console.log('INTERNATIONAL SCRAPER STATUS');
      console.log('='.repeat(80));
      console.log('Authority'.padEnd(20) + 'Total'.padEnd(10) + 'AI Summaries'.padEnd(15) + 'Latest Date');
      console.log('-'.repeat(80));

      for (const row of result.rows) {
        const pct = row.total > 0 ? Math.round((row.with_summary / row.total) * 100) : 0;
        console.log(
          row.authority.padEnd(20) +
          String(row.total).padEnd(10) +
          `${row.with_summary} (${pct}%)`.padEnd(15) +
          (row.latest_date ? new Date(row.latest_date).toISOString().split('T')[0] : 'N/A')
        );
      }

      // Get sample of recent entries with AI summaries
      console.log('\n' + '='.repeat(80));
      console.log('SAMPLE ENTRIES WITH AI SUMMARIES');
      console.log('='.repeat(80));

      const samples = await client.query(`
        SELECT authority, headline, LEFT(ai_summary, 100) as summary_preview
        FROM regulatory_updates
        WHERE source_category = 'international_scraping'
          AND ai_summary IS NOT NULL
          AND ai_summary != ''
        ORDER BY created_at DESC
        LIMIT 10
      `);

      for (const row of samples.rows) {
        console.log(`\n[${row.authority}] ${row.headline.substring(0, 60)}...`);
        if (row.summary_preview) {
          console.log(`  Summary: ${row.summary_preview}...`);
        }
      }

      // Check for potential bad data
      console.log('\n' + '='.repeat(80));
      console.log('DATA QUALITY CHECK');
      console.log('='.repeat(80));

      const badData = await client.query(`
        SELECT authority, headline, url
        FROM regulatory_updates
        WHERE source_category = 'international_scraping'
          AND (
            headline ~* '^(read more|learn more|click here|view all|home|about|contact)$'
            OR LENGTH(headline) < 15
            OR url LIKE '%#%'
            OR url LIKE '%javascript:%'
          )
        LIMIT 10
      `);

      if (badData.rows.length > 0) {
        console.log('⚠️  Potential bad entries found:');
        for (const row of badData.rows) {
          console.log(`  [${row.authority}] "${row.headline}" - ${row.url.substring(0, 50)}`);
        }
      } else {
        console.log('✅ No obvious bad data detected');
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Check failed:', error.message);
  }

  process.exit(0);
}

checkScraperStatus();
