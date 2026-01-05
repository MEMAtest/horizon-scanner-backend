const { Client } = require('pg');

const DATABASE_URL = 'postgresql://horizon-scanning_owner:npg_ThUNJ1dmXg5u@ep-summer-art-ab0r6nxf-pooler.eu-west-2.aws.neon.tech/horizon-scanning?sslmode=require';

async function checkSummaries() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check for entries needing summaries in last 24 hours
    const query = `
      SELECT
        authority,
        COUNT(*) as needs_summary
      FROM regulatory_updates
      WHERE ai_summary IS NULL
        AND created_at > NOW() - INTERVAL '24 hours'
      GROUP BY authority
      ORDER BY needs_summary DESC;
    `;

    console.log('=== ENTRIES NEEDING AI SUMMARIES (Last 24 hours) ===\n');
    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log('No entries found needing summaries in the last 24 hours.');
    } else {
      result.rows.forEach(row => {
        console.log(`${row.authority}: ${row.needs_summary} entries`);
      });
    }

    // Also check total entries in last 24 hours
    const totalQuery = `
      SELECT
        authority,
        COUNT(*) as total_entries,
        COUNT(CASE WHEN ai_summary IS NOT NULL THEN 1 END) as with_summary,
        COUNT(CASE WHEN ai_summary IS NULL THEN 1 END) as without_summary
      FROM regulatory_updates
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY authority
      ORDER BY total_entries DESC;
    `;

    console.log('\n\n=== ALL ENTRIES IN LAST 24 HOURS ===\n');
    const totalResult = await client.query(totalQuery);

    if (totalResult.rows.length === 0) {
      console.log('No entries found in the last 24 hours.');
    } else {
      console.log('Authority | Total | With Summary | Without Summary');
      console.log('-'.repeat(60));
      totalResult.rows.forEach(row => {
        console.log(`${row.authority.padEnd(20)} | ${row.total_entries.toString().padStart(5)} | ${row.with_summary.toString().padStart(12)} | ${row.without_summary.toString().padStart(15)}`);
      });
    }

  } catch (error) {
    console.error('Database error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkSummaries().catch(console.error);
