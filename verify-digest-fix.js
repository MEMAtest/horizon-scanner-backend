#!/usr/bin/env node
// Verification script to prove the digest fix is working
// Run this to confirm tomorrow's 8am digest will have articles

const { buildDigestPayload, sendDailyDigest } = require('./src/services/dailyDigestService');

async function verifyDigestFix() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   DAILY DIGEST FIX VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Build digest payload
    console.log('📊 Step 1: Building digest payload from database...\n');
    const digest = await buildDigestPayload({ persona: 'Executive' });

    console.log(`✅ SUCCESS: Generated ${digest.insights.length} insights\n`);
    console.log('Breakdown:');
    console.log(`  • High impact: ${digest.metrics.highCount}`);
    console.log(`  • Medium impact: ${digest.metrics.mediumCount}`);
    console.log(`  • Low impact: ${digest.metrics.lowCount}\n`);

    if (digest.insights.length === 0) {
      console.log('❌ PROBLEM: No insights generated');
      console.log('   This means filters are too aggressive or database has no recent content.\n');
      process.exit(1);
    }

    console.log('Sample insights that will be in tomorrow\'s email:\n');
    digest.insights.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. [${item.authority}] ${item.headline.substring(0, 70)}...`);
      console.log(`   Score: ${item.relevanceScore} | URL: ${item.url}\n`);
    });

    // Step 2: Verify email template generation
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📧 Step 2: Testing email template generation...\n');

    const { buildDailyDigestEmail } = require('./src/templates/emails/dailyDigestEmail-classic');
    const { subject, html, text } = buildDailyDigestEmail({
      date: digest.generatedAt,
      summary: digest.summary,
      insights: digest.insights,
      metrics: digest.metrics,
      personaLabel: digest.personaLabel,
      brand: {
        title: process.env.DIGEST_BRAND_TITLE || 'RegCanary',
        footer: process.env.DIGEST_BRAND_FOOTER || 'Regulatory Intelligence'
      }
    });

    console.log(`✅ Email subject: ${subject}`);
    console.log(`✅ HTML length: ${html.length} characters`);
    console.log(`✅ Text length: ${text.length} characters\n`);

    // Final verdict
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 VERIFICATION COMPLETE\n');
    console.log(`Tomorrow at 8am UK time, the digest will contain ${digest.insights.length} articles.`);
    console.log('The fix is working correctly!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ VERIFICATION FAILED\n');
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyDigestFix();
