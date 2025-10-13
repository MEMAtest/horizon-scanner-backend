// Test FATF scraper with informational page filtering
const puppeteerScraper = require('./src/scrapers/puppeteerScraper');

async function testFATFFilter() {
  console.log('🧪 Testing FATF Scraper with Informational Page Filter\n');
  console.log('Expected behavior:');
  console.log('  ✅ Should capture actual news and publications');
  console.log('  ❌ Should exclude: Job opportunities, FATF Secretariat, History, Code of Conduct, etc.\n');

  try {
    const results = await puppeteerScraper.scrapeAll();

    // Filter for FATF items only
    const fatfItems = results.filter(item => item.authority === 'FATF');

    console.log(`\n📊 Results: Found ${fatfItems.length} FATF items\n`);

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
    fatfItems.forEach((item, index) => {
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
        console.log(`✅ PASS: ${item.headline.slice(0, 80)}...`);
        passedCount++;
      }
    });

    console.log('\n📈 Summary:');
    console.log(`   Total FATF items: ${fatfItems.length}`);
    console.log(`   ✅ Passed (actual content): ${passedCount}`);
    console.log(`   ❌ Failed (should be filtered): ${filteredCount}`);

    if (filteredCount === 0) {
      console.log('\n🎉 SUCCESS: All informational pages were filtered out!');
    } else {
      console.log('\n⚠️  WARNING: Some informational pages were not filtered');
    }

    // Show sample of captured items
    console.log('\n📄 Sample captured items (first 5):');
    fatfItems.slice(0, 5).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.headline}`);
      console.log(`   Area: ${item.area}`);
      console.log(`   URL: ${item.url}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testFATFFilter()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
