// Comprehensive smoke test for daily digest system
const { buildDigestPayload, sendDailyDigest } = require('../src/services/dailyDigestService');

(async () => {
  console.log('🧪 DAILY DIGEST COMPREHENSIVE SMOKE TEST');
  console.log('='.repeat(70));
  console.log();

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // TEST 1: Build digest payload
    console.log('TEST 1: Building digest payload...');
    const digest = await buildDigestPayload({ persona: 'Executive' });

    if (!digest || typeof digest !== 'object') {
      throw new Error('Digest payload is invalid');
    }

    console.log('✅ Digest payload built successfully');
    console.log(`   Total insights: ${digest.insights.length}`);
    console.log(`   High impact: ${digest.metrics.highCount}`);
    console.log(`   Medium impact: ${digest.metrics.mediumCount}`);
    console.log(`   Low impact: ${digest.metrics.lowCount}`);
    results.passed.push('Digest payload generation');

    if (digest.insights.length < 10) {
      results.warnings.push(`Only ${digest.insights.length} insights (target: 10+)`);
    }
    console.log();

    // TEST 2: Verify insight structure
    console.log('TEST 2: Verifying insight structure...');
    if (digest.insights.length === 0) {
      throw new Error('No insights generated');
    }

    const firstInsight = digest.insights[0];
    const requiredFields = ['id', 'headline', 'summary', 'authority', 'relevanceScore', 'url'];
    const missingFields = requiredFields.filter(field => !firstInsight[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('✅ All required fields present in insights');
    results.passed.push('Insight structure validation');
    console.log();

    // TEST 3: Verify metrics calculation
    console.log('TEST 3: Verifying metrics calculation...');
    const totalInsights = digest.metrics.highCount + digest.metrics.mediumCount + digest.metrics.lowCount;

    if (totalInsights !== digest.insights.length) {
      throw new Error(`Metrics mismatch: ${totalInsights} vs ${digest.insights.length} insights`);
    }

    console.log('✅ Metrics calculation correct');
    console.log(`   Total: ${totalInsights}`);
    results.passed.push('Metrics calculation');
    console.log();

    // TEST 4: Verify summary generation
    console.log('TEST 4: Verifying summary generation...');
    if (!digest.summary || digest.summary.length < 20) {
      throw new Error('Summary is too short or missing');
    }

    console.log('✅ Summary generated successfully');
    console.log(`   Length: ${digest.summary.length} characters`);
    results.passed.push('Summary generation');
    console.log();

    // TEST 5: Sample insights
    console.log('TEST 5: Sample insights (first 5)...');
    digest.insights.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. [${item.authority}] ${item.headline.substring(0, 60)}...`);
      console.log(`      Score: ${item.relevanceScore} | Impact: ${item.impactLevel || 'N/A'}`);
    });
    results.passed.push('Insight sampling');
    console.log();

    // TEST 6: Email template generation
    console.log('TEST 6: Testing email template generation...');
    const { buildDailyDigestEmail } = require('../src/templates/emails/dailyDigestEmail-classic');
    const { subject, html, text } = buildDailyDigestEmail({
      date: digest.generatedAt,
      summary: digest.summary,
      insights: digest.insights,
      metrics: digest.metrics,
      personaLabel: digest.personaLabel,
      brand: {
        title: 'RegCanary',
        footer: 'Test footer'
      }
    });

    if (!subject || !html || !text) {
      throw new Error('Email template missing required fields');
    }

    if (!html.includes('RegCanary')) {
      results.warnings.push('Email HTML may be missing branding');
    }

    if (!html.includes(digest.insights[0].headline)) {
      throw new Error('Email HTML missing first insight');
    }

    console.log('✅ Email template generated successfully');
    console.log(`   Subject: ${subject}`);
    console.log(`   HTML length: ${html.length} characters`);
    console.log(`   Text length: ${text.length} characters`);
    results.passed.push('Email template generation');
    console.log();

    // TEST 7: Check for duplicates
    console.log('TEST 7: Checking for duplicate insights...');
    const urls = digest.insights.map(item => item.url);
    const uniqueUrls = new Set(urls);

    if (urls.length !== uniqueUrls.size) {
      const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
      throw new Error(`Found duplicate URLs: ${duplicates.length}`);
    }

    console.log('✅ No duplicate insights found');
    results.passed.push('Duplicate checking');
    console.log();

    // TEST 8: Verify diversity
    console.log('TEST 8: Verifying authority diversity...');
    const authorities = {};
    digest.insights.forEach(item => {
      authorities[item.authority] = (authorities[item.authority] || 0) + 1;
    });

    const maxPerAuthority = Math.max(...Object.values(authorities));
    console.log('   Authority breakdown:');
    Object.entries(authorities)
      .sort((a, b) => b[1] - a[1])
      .forEach(([auth, count]) => {
        console.log(`   - ${auth}: ${count}`);
      });

    if (maxPerAuthority > 5) {
      results.warnings.push(`One authority has ${maxPerAuthority} items (limit: 5)`);
    }

    results.passed.push('Authority diversity check');
    console.log();

    // FINAL SUMMARY
    console.log('='.repeat(70));
    console.log('📊 SMOKE TEST SUMMARY');
    console.log('='.repeat(70));
    console.log();
    console.log(`✅ PASSED: ${results.passed.length} tests`);
    results.passed.forEach(test => console.log(`   - ${test}`));
    console.log();

    if (results.warnings.length > 0) {
      console.log(`⚠️  WARNINGS: ${results.warnings.length}`);
      results.warnings.forEach(warning => console.log(`   - ${warning}`));
      console.log();
    }

    if (results.failed.length > 0) {
      console.log(`❌ FAILED: ${results.failed.length} tests`);
      results.failed.forEach(failure => console.log(`   - ${failure}`));
      console.log();
      process.exit(1);
    }

    console.log('🎉 ALL TESTS PASSED!');
    console.log();
    console.log('Next steps:');
    console.log('1. Tomorrow at 8am UK time, the digest will run automatically');
    console.log('2. Expected: 10-15 regulatory insights');
    console.log('3. Email will include proper headers to avoid spam');
    console.log();

  } catch (error) {
    console.error('❌ SMOKE TEST FAILED');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
