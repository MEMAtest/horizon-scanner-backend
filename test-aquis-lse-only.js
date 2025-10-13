// Quick test to verify Aquis and LSE scrapers still work
const puppeteerScraper = require('./src/scrapers/puppeteerScraper');

async function testAquisAndLSE() {
  console.log('🧪 Quick Test: Aquis and LSE Scrapers\n');
  console.log('Verifying existing functionality is not broken...\n');

  try {
    await puppeteerScraper.initBrowser();

    console.log('📊 Testing Aquis...');
    const aquisResults = await puppeteerScraper.scrapeAquis();
    console.log(`✅ Aquis: ${aquisResults.length} items`);

    console.log('\n📰 Testing LSE...');
    const lseResults = await puppeteerScraper.scrapeLSE();
    console.log(`✅ LSE: ${lseResults.length} items`);

    await puppeteerScraper.closeBrowser();

    console.log('\n📈 Summary:');
    console.log(`   Aquis items: ${aquisResults.length}`);
    console.log(`   LSE items: ${lseResults.length}`);
    console.log(`   Total: ${aquisResults.length + lseResults.length}`);

    if (aquisResults.length > 0 && lseResults.length > 0) {
      console.log('\n✅ SUCCESS: Both Aquis and LSE scrapers working correctly!');
      return true;
    } else {
      console.log('\n⚠️  WARNING: One or both scrapers returned 0 results');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testAquisAndLSE()
  .then((success) => {
    if (success) {
      console.log('\n✅ All existing functionality preserved!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\nTest error:', error);
    process.exit(1);
  });
