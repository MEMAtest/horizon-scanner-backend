// Quick test for AQUIS summaries only
const puppeteerScraper = require('./src/scrapers/puppeteerScraper');

async function testAquisSummaries() {
  console.log('🧪 Testing AQUIS Summary Generation\n');

  try {
    await puppeteerScraper.initBrowser();

    console.log('📊 Scraping AQUIS...');
    const aquisResults = await puppeteerScraper.scrapeAquis();

    await puppeteerScraper.closeBrowser();

    console.log(`\n✅ Scraped ${aquisResults.length} AQUIS items\n`);

    // Check summaries
    let missingCount = 0;
    let hasCount = 0;

    console.log('📋 Summary Check:\n');
    aquisResults.forEach((item, index) => {
      const summary = item.raw_data?.summary;

      if (!summary || summary.length < 10) {
        console.log(`❌ Item ${index + 1}: "${item.headline}"`);
        console.log(`   Summary: ${summary || 'NONE'}\n`);
        missingCount++;
      } else {
        hasCount++;
        if (index < 3) {
          // Show first 3 as examples
          console.log(`✅ Item ${index + 1}: "${item.headline}"`);
          console.log(`   Summary: ${summary.slice(0, 100)}...\n`);
        }
      }
    });

    console.log(`\n📈 Results:`);
    console.log(`   ✅ Items with summaries: ${hasCount}`);
    console.log(`   ❌ Items missing summaries: ${missingCount}`);
    console.log(`   Total: ${aquisResults.length}`);

    if (missingCount === 0) {
      console.log('\n🎉 SUCCESS: All AQUIS items have summaries!');
      return true;
    } else {
      console.log(`\n⚠️  ${missingCount} items still missing summaries`);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

testAquisSummaries()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
