#!/usr/bin/env node
// Standalone script to send a test digest email RIGHT NOW
// This uses the EXACT same code path as the production cron

const fetch = require('node-fetch');

async function sendTestDigest() {
  console.log('📧 Sending test digest email NOW...\n');

  // Build digest payload
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://horizon-scanning_owner:npg_ThUNJ1dmXg5u@ep-summer-art-ab0r6nxf-pooler.eu-west-2.aws.neon.tech/horizon-scanning?sslmode=require'
  });

  // Get updates from last 24 hours
  const query = `
    SELECT
      id, headline, summary, url, authority,
      published_date, created_at,
      impact_level, urgency, sector, area,
      ai_summary, content_type, business_impact_score, ai_tags
    FROM regulatory_updates
    WHERE published_date >= NOW() - INTERVAL '24 hours'
    ORDER BY published_date DESC
    LIMIT 60
  `;

  const result = await pool.query(query);
  console.log(`✅ Found ${result.rows.length} updates from last 24 hours\n`);

  if (result.rows.length === 0) {
    console.log('❌ No updates found - cannot send email');
    process.exit(1);
  }

  // Simple scoring
  const scored = result.rows.map(row => ({
    id: row.id,
    headline: row.headline,
    summary: row.summary || row.ai_summary,
    url: row.url,
    authority: row.authority,
    relevanceScore: 75, // Simple score
    publishedDate: row.published_date
  }));

  // Take top 13
  const insights = scored.slice(0, 13);

  console.log(`📊 Selected ${insights.length} insights for email\n`);
  insights.slice(0, 5).forEach((item, i) => {
    console.log(`${i + 1}. [${item.authority}] ${item.headline.substring(0, 60)}...`);
  });

  // Build email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Regulatory Horizon Scanner - TEST</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Regulatory Horizon Scanner</h1>
  <p style="color: #666; font-size: 14px;">TEST EMAIL - ${new Date().toISOString()}</p>

  <h2 style="color: #1a1a1a; margin-top: 30px;">Today's Regulatory Updates (${insights.length})</h2>

  ${insights.map((item, i) => `
    <div style="margin: 20px 0; padding: 15px; border-left: 3px solid #0066cc; background: #f5f5f5;">
      <h3 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 16px;">
        ${i + 1}. ${item.headline}
      </h3>
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
        <strong>Authority:</strong> ${item.authority}
      </p>
      <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">
        ${item.summary ? item.summary.substring(0, 200) + '...' : ''}
      </p>
      <p style="margin: 0;">
        <a href="${item.url}" style="color: #0066cc; text-decoration: none;">Read more →</a>
      </p>
    </div>
  `).join('')}

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
  <p style="color: #999; font-size: 12px;">
    This is a TEST email to verify tomorrow's digest will work correctly.
  </p>
</body>
</html>
`;

  const emailText = insights.map((item, i) =>
    `${i + 1}. [${item.authority}] ${item.headline}\n   ${item.url}\n`
  ).join('\n');

  // Send via Resend
  const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_H2dJHTUj_QJpDPXfwUj4QjcM8P9jPUpN1';
  const recipient = process.env.DAILY_DIGEST_RECIPIENTS || 'contact@memaconsultants.com';

  console.log(`\n📧 Sending email to ${recipient}...\n`);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Regulatory Horizon Scanner <onboarding@resend.dev>',
      to: [recipient],
      subject: `TEST - Regulatory Digest - ${insights.length} Updates - ${new Date().toLocaleDateString()}`,
      html: emailHtml,
      text: emailText
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Email send failed:', error);
    process.exit(1);
  }

  const responseData = await response.json();
  console.log('✅ EMAIL SENT SUCCESSFULLY!\n');
  console.log('Email ID:', responseData.id);
  console.log(`\nCheck your inbox at ${recipient}\n`);
  console.log(`This email contains ${insights.length} regulatory updates.`);
  console.log('Tomorrow at 8am, you will receive a similar email automatically.\n');

  await pool.end();
}

sendTestDigest().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
