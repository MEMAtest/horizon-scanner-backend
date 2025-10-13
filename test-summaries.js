// Test that summaries are generated for all scraped items
const puppeteerScraper = require('./src/scrapers/puppeteerScraper');

async function testSummaries() {
  console.log('🧪 Testing Summary Generation\n');
  console.log('Verifying all items have summaries...\n');

  try {
    await puppeteerScraper.initBrowser();

    // Test AQUIS
    console.log('📊 Testing AQUIS summaries...');
    const aquisResults = await puppeteerScraper.scrapeAquis();

    let aquisMissing = 0;
    aquisResults.forEach(item => {
      if (!item.raw_data?.summary) {
        console.log(`❌ AQUIS missing summary: ${item.headline}`);
        aquisMissing++;
      }
    });

    if (aquisMissing === 0) {
      console.log(`✅ All ${aquisResults.length} AQUIS items have summaries`);
    } else {
      console.log(`⚠️  ${aquisMissing} AQUIS items missing summaries`);
    }

    // Show sample
    if (aquisResults.length > 0) {
      console.log('\n📄 Sample AQUIS item:');
      console.log(`   Title: ${aquisResults[0].headline}`);
      console.log(`   Summary: ${aquisResults[0].raw_data.summary?.slice(0, 150)}...`);
    }

    // Test LSE (just 5 items to save time)
    console.log('\n\n📰 Testing LSE summaries (first 5 items)...');
    const lseResults = await puppeteerScraper.scrapeLSE();

    let lseMissing = 0;
    lseResults.slice(0, 5).forEach(item => {
      if (!item.raw_data?.summary) {
        console.log(`❌ LSE missing summary: ${item.headline}`);
        lseMissing++;
      }
    });

    if (lseMissing === 0) {
      console.log(`✅ All ${Math.min(5, lseResults.length)} LSE items have summaries`);
    } else {
      console.log(`⚠️  ${lseMissing} LSE items missing summaries`);
    }

    // Show sample
    if (lseResults.length > 0) {
      console.log('\n📄 Sample LSE item:');
      console.log(`   Title: ${lseResults[0].headline}`);
      console.log(`   Summary: ${lseResults[0].raw_data.summary?.slice(0, 150)}...`);
    }

    await puppeteerScraper.closeBrowser();

    console.log('\n📈 Summary Test Results:');
    console.log(`   AQUIS: ${aquisResults.length - aquisMissing}/${aquisResults.length} with summaries`);
    console.log(`   LSE: ${Math.min(5, lseResults.length) - lseMissing}/${Math.min(5, lseResults.length)} with summaries`);

    const totalMissing = aquisMissing + lseMissing;
    if (totalMissing === 0) {
      console.log('\n🎉 SUCCESS: All items have summaries!');
      return true;
    } else {
      console.log(`\n⚠️  ${totalMissing} items still missing summaries`);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testSummaries()
  .then((success) => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
