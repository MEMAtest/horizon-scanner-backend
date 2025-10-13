// Test FATF scraper only (no Aquis/LSE) to verify filtering
const puppeteerScraper = require('./src/scrapers/puppeteerScraper');

async function testFATFOnly() {
  console.log('🧪 Testing FATF Scraper Only - Informational Page Filter\n');
  console.log('Expected behavior:');
  console.log('  ✅ Should capture actual news and publications');
  console.log('  ❌ Should exclude: Job opportunities, FATF Secretariat, History, Code of Conduct, etc.\n');

  try {
    // Call only FATF scraping
    await puppeteerScraper.initBrowser();

    const fatfResults = await puppeteerScraper.scrapeFATF();

    await puppeteerScraper.closeBrowser();

    console.log(`\n📊 Results: Found ${fatfResults.length} FATF items\n`);

    // Check for informational pages that should be filtered
    const informationalKeywords = [
      'job opportunities', 'job opportunity',
      'fatf secretariat', 'secretariat',
      'code of conduct', 'fatf code',
      'history of the fatf', 'history of',
      'presidency', 'mandate',
      'outcomes of meetings',
      'about us', 'contact', 'members', 'membership'
    ];

    let filteredCount = 0;
    let passedCount = 0;

    console.log('📋 Checking filtered results:\n');
    fatfResults.forEach((item, index) => {
      const titleLower = item.headline.toLowerCase();
      const urlLower = item.url.toLowerCase();

      const isInformational = informationalKeywords.some(keyword =>
        titleLower.includes(keyword) || urlLower.includes(keyword)
      );

      if (isInformational) {
        console.log(`❌ FAIL: Informational page was NOT filtered:`);
        console.log(`   Title: ${item.headline}`);
        console.log(`   URL: ${item.url}\n`);
        filteredCount++;
      } else {
        const displayTitle = item.headline.length > 80 ? item.headline.slice(0, 80) + '...' : item.headline;
        console.log(`✅ PASS: ${displayTitle}`);
        passedCount++;
      }
    });

    console.log('\n📈 Summary:');
    console.log(`   Total FATF items: ${fatfResults.length}`);
    console.log(`   ✅ Passed (actual content): ${passedCount}`);
    console.log(`   ❌ Failed (should be filtered): ${filteredCount}`);

    if (filteredCount === 0) {
      console.log('\n🎉 SUCCESS: All informational pages were filtered out!');
    } else {
      console.log('\n⚠️  WARNING: Some informational pages were not filtered');
    }

    // Show all captured items
    console.log('\n📄 All captured items:');
    fatfResults.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.headline}`);
      console.log(`   Area: ${item.area}`);
      console.log(`   URL: ${item.url}`);
      if (item.raw_data?.originalDate) {
        console.log(`   Date: ${item.raw_data.originalDate}`);
      }
    });

    return filteredCount === 0;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

testFATFOnly()
  .then((success) => {
    if (success) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\nTest error:', error);
    process.exit(1);
  });
