#!/usr/bin/env node
// Send a properly formatted test email using the actual digest template
require('dotenv').config();

async function sendProperTestEmail() {
  console.log('📧 Generating and sending properly formatted test digest email...\n');

  try {
    // Step 1: Build digest payload using production code
    const { buildDigestPayload } = require('./src/services/dailyDigestService');
    console.log('📊 Building digest payload from database...\n');

    const digest = await buildDigestPayload({ persona: 'Executive' });
    console.log(`✅ Generated ${digest.insights.length} insights\n`);

    if (digest.insights.length === 0) {
      console.log('❌ No insights generated - cannot send email');
      process.exit(1);
    }

    // Step 2: Build email using proper template
    const { buildDailyDigestEmail } = require('./src/templates/emails/dailyDigestEmail-classic');
    console.log('📧 Building email with proper template...\n');

    const { subject, html, text } = buildDailyDigestEmail({
      date: digest.generatedAt,
      summary: digest.summary,
      insights: digest.insights,
      metrics: digest.metrics,
      personaLabel: digest.personaLabel,
      brand: {
        title: process.env.DIGEST_BRAND_TITLE || 'Regulatory Horizon Scanner',
        footer: 'TEST EMAIL - Verifying proper template design'
      }
    });

    console.log(`✅ Subject: ${subject}`);
    console.log(`✅ HTML length: ${html.length.toLocaleString()} characters`);
    console.log(`✅ Text length: ${text.length.toLocaleString()} characters\n`);

    // Step 3: Send via Resend API
    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_H2dJHTUj_QJpDPXfwUj4QjcM8P9jPUpN1';
    const recipient = process.env.DAILY_DIGEST_RECIPIENTS || 'contact@memaconsultants.com';

    console.log(`📤 Sending email to ${recipient}...\n`);

    const fetch = require('node-fetch');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Regulatory Horizon Scanner <onboarding@resend.dev>',
        to: [recipient],
        subject: subject + ' [TEST]',
        html: html,
        text: text,
        headers: {
          'X-Entity-Ref-ID': `test-digest-${Date.now()}`,
          'List-Unsubscribe': '<mailto:unsubscribe@regcanary.com>'
        },
        tags: [
          {
            name: 'category',
            value: 'daily-digest-test'
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Email send failed:', error);
      process.exit(1);
    }

    const responseData = await response.json();
    console.log('✅ EMAIL SENT SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Email ID:', responseData.id);
    console.log(`Recipients: ${recipient}`);
    console.log(`Articles: ${digest.insights.length}`);
    console.log(`High impact: ${digest.metrics.highCount}`);
    console.log(`Medium impact: ${digest.metrics.mediumCount}`);
    console.log(`Low impact: ${digest.metrics.lowCount}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 This email uses the EXACT SAME template as tomorrow\'s 8am digest.');
    console.log('📧 Check your inbox to verify the proper design and formatting.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

sendProperTestEmail();
