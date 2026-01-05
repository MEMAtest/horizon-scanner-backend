const scraper = require('./src/scrapers/puppeteerScraper');

async function testScrapers() {
  console.log('='.repeat(80));
  console.log('TESTING PUPPETEER SCRAPERS');
  console.log('='.repeat(80));

  // Test 1: FSCA
  console.log('\n\n1. Testing FSCA (South Africa)...');
  console.log('-'.repeat(80));
  try {
    const fscaResults = await scraper.scrapeFSCA();
    console.log(`✓ Number of items extracted: ${fscaResults.length}`);

    if (fscaResults.length > 0) {
      console.log('\nFirst 3 headlines:');
      fscaResults.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.headline || item.title}`);
        console.log(`     URL: ${item.url || item.link}`);
        console.log(`     Date: ${item.published_date || item.date}`);
        console.log(`     Authority: ${item.authority}`);
        console.log(`     Description: ${item.description ? item.description.substring(0, 100) + '...' : 'N/A'}`);
      });
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    console.error(error.stack);
  }

  // Test 2: FIC SA
  console.log('\n\n2. Testing FIC SA (South Africa)...');
  console.log('-'.repeat(80));
  try {
    const ficResults = await scraper.scrapeFICSA();
    console.log(`✓ Number of items extracted: ${ficResults.length}`);

    if (ficResults.length > 0) {
      console.log('\nFirst 3 headlines:');
      ficResults.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.headline || item.title}`);
        console.log(`     URL: ${item.url || item.link}`);
        console.log(`     Date: ${item.published_date || item.date}`);
        console.log(`     Authority: ${item.authority}`);
        console.log(`     Description: ${item.description ? item.description.substring(0, 100) + '...' : 'N/A'}`);
      });
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    console.error(error.stack);
  }

  // Test 3: CNBV
  console.log('\n\n3. Testing CNBV (Mexico)...');
  console.log('-'.repeat(80));
  try {
    const cnbvResults = await scraper.scrapeCNBV();
    console.log(`✓ Number of items extracted: ${cnbvResults.length}`);

    if (cnbvResults.length > 0) {
      console.log('\nFirst 3 headlines:');
      cnbvResults.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.headline || item.title}`);
        console.log(`     URL: ${item.url || item.link}`);
        console.log(`     Date: ${item.published_date || item.date}`);
        console.log(`     Authority: ${item.authority}`);
        console.log(`     Description: ${item.description ? item.description.substring(0, 100) + '...' : 'N/A'}`);
      });
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    console.error(error.stack);
  }

  // Test 4: EU Council
  console.log('\n\n4. Testing EU Council...');
  console.log('-'.repeat(80));
  try {
    const euResults = await scraper.scrapeEUCouncil();
    console.log(`✓ Number of items extracted: ${euResults.length}`);

    if (euResults.length > 0) {
      console.log('\nFirst 3 headlines:');
      euResults.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.headline || item.title}`);
        console.log(`     URL: ${item.url || item.link}`);
        console.log(`     Date: ${item.published_date || item.date}`);
        console.log(`     Authority: ${item.authority}`);
        console.log(`     Description: ${item.description ? item.description.substring(0, 100) + '...' : 'N/A'}`);
      });
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    console.error(error.stack);
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(80));

  // Clean up
  await scraper.closeBrowser();
  process.exit(0);
}

testScrapers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
