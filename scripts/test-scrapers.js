/**
 * Test and save results from scrapers
 */

const scraper = require('../src/scrapers/puppeteerScraper');
const dbService = require('../src/services/dbService');

async function savePuppeteerResults(results) {
  let saved = 0;
  for (const item of results) {
    try {
      await dbService.saveUpdate(item);
      saved++;
    } catch (e) {
      if (e.message && !e.message.includes('duplicate')) {
        console.error('Save error:', e.message);
      }
    }
  }
  return saved;
}

async function run() {
  // Test FSCA scraper
  console.log('=== Scraping and saving FSCA ===');
  const fsca = await scraper.scrapeFSCA();
  const fscaSaved = await savePuppeteerResults(fsca);
  console.log('FSCA: scraped', fsca.length, '| saved', fscaSaved);

  if (fsca.length > 0) {
    console.log('\nSample FSCA headlines:');
    fsca.slice(0, 5).forEach((item, i) => {
      console.log(`${i+1}. ${item.headline.substring(0, 70)}...`);
      console.log(`   URL: ${item.url.substring(0, 60)}...`);
    });
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
