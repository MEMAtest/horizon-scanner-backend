// Quick test to verify the URL fix works for a single year
const FCAFinesScraper = require('./src/services/fcaFinesScraper');
require('dotenv').config();

async function testSingleYear() {
  console.log('Testing URL fix with year 2024...\n');

  const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  };

  const scraper = new FCAFinesScraper(dbConfig);

  try {
    const result = await scraper.startScraping({
      startYear: 2024,
      endYear: 2024,
      useHeadless: true,
      forceScrape: true
    });

    console.log('\n✅ Test completed successfully!');
    console.log('Ready to run full re-scrape.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    if (scraper.db) {
      await scraper.db.end();
    }
  }
}

testSingleYear()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
