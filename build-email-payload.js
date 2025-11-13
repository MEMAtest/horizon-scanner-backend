#!/usr/bin/env node
// Build the email payload and save it to a file for sending
require('dotenv').config();
const fs = require('fs');

async function buildEmailPayload() {
  console.log('📧 Building properly formatted digest email payload...\n');

  try {
    // Build digest payload
    const { buildDigestPayload } = require('./src/services/dailyDigestService');
    const digest = await buildDigestPayload({ persona: 'Executive' });
    console.log(`✅ Generated ${digest.insights.length} insights\n`);

    // Build email with proper template
    const { buildDailyDigestEmail } = require('./src/templates/emails/dailyDigestEmail-classic');
    const { subject, html, text } = buildDailyDigestEmail({
      date: digest.generatedAt,
      summary: digest.summary,
      insights: digest.insights,
      metrics: digest.metrics,
      personaLabel: digest.personaLabel,
      brand: {
        title: process.env.DIGEST_BRAND_TITLE || 'Regulatory Horizon Scanner',
        footer: 'TEST EMAIL - Verifying proper template design matches production format'
      }
    });

    const payload = {
      from: 'Regulatory Horizon Scanner <onboarding@resend.dev>',
      to: ['contact@memaconsultants.com'],
      subject: subject + ' [TEST - PROPER DESIGN]',
      html: html,
      text: text,
      headers: {
        'X-Entity-Ref-ID': `test-digest-proper-${Date.now()}`,
        'List-Unsubscribe': '<mailto:unsubscribe@regcanary.com>'
      },
      tags: [
        {
          name: 'category',
          value: 'daily-digest-test'
        }
      ]
    };

    // Save to file
    fs.writeFileSync('/tmp/proper-email-payload.json', JSON.stringify(payload, null, 2));

    console.log('✅ Email payload saved to /tmp/proper-email-payload.json');
    console.log(`✅ Subject: ${subject} [TEST - PROPER DESIGN]`);
    console.log(`✅ HTML length: ${html.length.toLocaleString()} characters`);
    console.log(`✅ Articles included: ${digest.insights.length}`);
    console.log(`   • High impact: ${digest.metrics.highCount}`);
    console.log(`   • Medium impact: ${digest.metrics.mediumCount}`);
    console.log(`   • Low impact: ${digest.metrics.lowCount}\n`);

    console.log('Sample articles in the email:\n');
    digest.insights.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. [${item.authority}] ${item.headline.substring(0, 70)}...`);
    });

    console.log('\n📧 Ready to send via curl command\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

buildEmailPayload();
