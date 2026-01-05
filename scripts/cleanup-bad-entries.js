/**
 * Clean up bad navigation entries from database
 */
require('dotenv').config();
const dbService = require('../src/services/dbService');

async function cleanupBadEntries() {
  console.log('Cleaning up bad navigation entries...\n');

  try {
    const client = await dbService.pool.connect();

    try {
      // Delete entries that look like navigation pages
      const result = await client.query(`
        DELETE FROM regulatory_updates
        WHERE source_category = 'international_scraping'
          AND (
            headline IN ('Fraud & scams', 'Submit an enquiry or complaint', 'Credit Rating Agencies')
            OR url LIKE '%enquiry.aspx%'
            OR url LIKE '%Entity-Persons-Search%'
            OR url LIKE '%Logon%'
            OR url LIKE '%Login%'
            OR url LIKE '%/news/fraud/%'
          )
        RETURNING id, authority, headline
      `);

      console.log(`Deleted ${result.rows.length} bad entries:`);
      for (const row of result.rows) {
        console.log(`  - [${row.authority}] ${row.headline}`);
      }

      // Show updated counts
      const counts = await client.query(`
        SELECT authority, COUNT(*) as total
        FROM regulatory_updates
        WHERE source_category = 'international_scraping'
        GROUP BY authority
        ORDER BY total DESC
      `);

      console.log('\nUpdated counts by authority:');
      for (const row of counts.rows) {
        console.log(`  ${row.authority}: ${row.total}`);
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }

  process.exit(0);
}

cleanupBadEntries();
