// Script to clear corrupted FCA fines data from database
// This will remove all data from fca_fines and fca_fine_trends tables
// Run this before re-scraping with the fixed date parsing logic

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

async function clearData() {
  console.log('='.repeat(60));
  console.log('Clearing FCA Fines Data from Database');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Get current counts
    const finesCountResult = await pool.query('SELECT COUNT(*) FROM fca_fines');
    const trendsCountResult = await pool.query('SELECT COUNT(*) FROM fca_fine_trends');

    const finesCount = parseInt(finesCountResult.rows[0].count);
    const trendsCount = parseInt(trendsCountResult.rows[0].count);

    console.log(`Current data in database:`);
    console.log(`  - fca_fines: ${finesCount} records`);
    console.log(`  - fca_fine_trends: ${trendsCount} records`);
    console.log('');

    if (finesCount === 0 && trendsCount === 0) {
      console.log('✅ Database is already empty. Nothing to clear.');
      return;
    }

    console.log('⚠️  WARNING: This will delete all FCA fines data!');
    console.log('');

    // Clear the tables
    console.log('Clearing fca_fine_trends table...');
    await pool.query('DELETE FROM fca_fine_trends');
    console.log('✅ fca_fine_trends cleared');

    console.log('Clearing fca_fines table...');
    await pool.query('DELETE FROM fca_fines');
    console.log('✅ fca_fines cleared');

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Database cleared successfully!');
    console.log('='.repeat(60));
    console.log('');
    console.log('You can now run the re-scrape script to populate with corrected data.');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

clearData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
