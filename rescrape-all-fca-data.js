// Script to re-scrape all FCA fines data from 2013 to 2025
// This uses the fixed date parsing logic to ensure accurate dates

const FCAFinesScraper = require('./src/services/fcaFinesScraper');
require('dotenv').config();

async function rescrapeAll() {
  console.log('='.repeat(60));
  console.log('Re-scraping All FCA Fines Data (2013-2025)');
  console.log('='.repeat(60));
  console.log('');

  const currentYear = new Date().getFullYear();
  const startYear = 2013;

  console.log(`Will scrape years: ${startYear} to ${currentYear}`);
  console.log(`Total years: ${currentYear - startYear + 1}`);
  console.log('');
  console.log('⚠️  This will take approximately 1-2 hours to complete.');
  console.log('');

  // Initialize scraper with database config
  const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  };

  const scraper = new FCAFinesScraper(dbConfig);

  try {
    // Use the built-in startScraping method
    const result = await scraper.startScraping({
      startYear,
      endYear: currentYear,
      useHeadless: true,
      forceScrape: true  // Force re-scrape even if data exists
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ Re-scraping Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify data quality by checking sample records');
    console.log('2. Update trends table (may happen automatically)');
    console.log('3. Test the FCA Enforcement Widget on your website');
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error during re-scraping:', error);
    throw error;
  } finally {
    // Close database connection
    if (scraper.db) {
      await scraper.db.end();
    }
  }
}

// Run the re-scrape
rescrapeAll()
  .then(() => {
    console.log('');
    console.log('Process completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('');
    console.error('Process failed:', err);
    process.exit(1);
  });
