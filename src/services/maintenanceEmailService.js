// Maintenance report email generator
// Sends daily maintenance reports with auto-fixed issues and items needing attention

const { sendEmail } = require('./email/resendClient')

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://www.regcanary.com/dashboard'
const GITHUB_ACTIONS_URL = 'https://github.com/MEMAtest/horizon-scanner-backend/actions'

/**
 * Build HTML email for maintenance report
 */
function buildMaintenanceReportHTML(data) {
  const {
    summary,
    aiSummary,
    needsAttention,
    results,
    date
  } = data

  const healthScore = summary?.healthScore || 100
  const totals = summary?.totals || {}
  const healthColor = healthScore >= 90 ? '#10B981' : healthScore >= 70 ? '#F59E0B' : '#EF4444'
  const healthStatus = healthScore >= 90 ? 'Healthy' : healthScore >= 70 ? 'Degraded' : 'Critical'

  // Build auto-fixed items list
  const autoFixedHTML = results?.fixAttempts?.filter(f => f.success).map(fix => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">${fix.sourceName}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">${fix.method}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB; color: #10B981;">✓ Fixed</td>
    </tr>
  `).join('') || ''

  // Build needs attention list
  const needsAttentionHTML = (needsAttention || []).slice(0, 5).map(issue => {
    const diagnosis = issue.ai_diagnosis || {}
    return `
    <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="font-weight: 600; color: #92400E; margin-bottom: 8px;">
        ${issue.source_name} <span style="font-weight: 400; color: #B45309;">(${issue.source_type})</span>
      </div>
      <div style="font-size: 13px; color: #78350F; margin-bottom: 8px;">
        <strong>Issue:</strong> ${issue.error_message || issue.issue_detail || 'Unknown error'}
      </div>
      ${diagnosis.rootCause ? `
      <div style="font-size: 13px; color: #78350F; margin-bottom: 8px;">
        <strong>AI Analysis:</strong> ${diagnosis.rootCause}
      </div>
      ` : ''}
      ${issue.ai_suggested_fix ? `
      <div style="font-size: 13px; color: #78350F;">
        <strong>Suggested Fix:</strong> ${issue.ai_suggested_fix}
      </div>
      ` : ''}
    </div>
    `
  }).join('') || '<p style="color: #6B7280;">No issues requiring attention.</p>'

  // Build recurring issues list
  const recurringHTML = (summary?.recurringIssues || []).slice(0, 5).map(r => `
    <li style="margin-bottom: 4px;">
      <strong>${r.source_name}</strong> (${r.source_type}): ${r.issue_count} failures this week
    </li>
  `).join('') || '<li style="color: #6B7280;">No recurring issues detected.</li>'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RegCanary Maintenance Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #F3F4F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F3F4F6; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%); padding: 24px 32px; text-align: center;">
              <span style="font-size: 28px;">🐤</span>
              <h1 style="margin: 8px 0 0 0; font-size: 22px; color: white; font-weight: 600;">
                RegCanary Maintenance Report
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #93C5FD;">
                ${date}
              </p>
            </td>
          </tr>

          <!-- Health Score -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-bottom: 1px solid #E5E7EB;">
              <div style="display: inline-block; background: ${healthColor}; color: white; padding: 12px 24px; border-radius: 50px; font-size: 18px; font-weight: 600;">
                Health Score: ${healthScore}% — ${healthStatus}
              </div>
            </td>
          </tr>

          <!-- Executive Summary -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; border-left: 4px solid #1E3A8A; padding-left: 12px;">
                Executive Summary
              </h2>
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
                ${aiSummary || 'No summary available.'}
              </p>
            </td>
          </tr>

          <!-- Stats Grid -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="25%" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #10B981;">${totals.healthy || 0}</div>
                    <div style="font-size: 11px; color: #6B7280; text-transform: uppercase;">Healthy</div>
                  </td>
                  <td width="25%" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #3B82F6;">${totals.autoFixed || 0}</div>
                    <div style="font-size: 11px; color: #6B7280; text-transform: uppercase;">Auto-Fixed</div>
                  </td>
                  <td width="25%" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #EF4444;">${totals.errors || 0}</div>
                    <div style="font-size: 11px; color: #6B7280; text-transform: uppercase;">Errors</div>
                  </td>
                  <td width="25%" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #F59E0B;">${totals.needsAttention || 0}</div>
                    <div style="font-size: 11px; color: #6B7280; text-transform: uppercase;">Needs Attention</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${autoFixedHTML ? `
          <!-- Auto-Fixed Issues -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; border-left: 4px solid #10B981; padding-left: 12px;">
                ✅ Auto-Fixed Issues
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                <tr style="background: #F9FAFB;">
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #E5E7EB;">Source</th>
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #E5E7EB;">Method</th>
                  <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #E5E7EB;">Status</th>
                </tr>
                ${autoFixedHTML}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Needs Attention -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; border-left: 4px solid #F59E0B; padding-left: 12px;">
                ⚠️ Needs Your Attention
              </h2>
              ${needsAttentionHTML}
            </td>
          </tr>

          <!-- Recurring Issues -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1F2937; border-left: 4px solid #8B5CF6; padding-left: 12px;">
                🔄 Recurring Problems (Last 7 Days)
              </h2>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #374151;">
                ${recurringHTML}
              </ul>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; background: #F9FAFB;">
              <a href="${DASHBOARD_URL}" style="display: inline-block; background: #1E3A8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 0 8px;">
                📊 View Dashboard
              </a>
              <a href="${GITHUB_ACTIONS_URL}" style="display: inline-block; background: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 0 8px;">
                🔧 GitHub Actions
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px; text-align: center; background: #F3F4F6;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                🐤 RegCanary Maintenance Agent • Powered by MEMA Consultants
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

/**
 * Build plain text version of the report
 */
function buildMaintenanceReportText(data) {
  const { summary, aiSummary, needsAttention, results } = data
  const healthScore = summary?.healthScore || 100
  const totals = summary?.totals || {}

  let text = `
REGCANARY MAINTENANCE REPORT
${data.date}
${'='.repeat(40)}

HEALTH SCORE: ${healthScore}%

EXECUTIVE SUMMARY
${aiSummary || 'No summary available.'}

STATISTICS
- Healthy: ${totals.healthy || 0}
- Auto-Fixed: ${totals.autoFixed || 0}
- Errors: ${totals.errors || 0}
- Needs Attention: ${totals.needsAttention || 0}
`

  if (results?.fixAttempts?.filter(f => f.success).length > 0) {
    text += `
AUTO-FIXED ISSUES
${results.fixAttempts.filter(f => f.success).map(f => `- ${f.sourceName}: ${f.method}`).join('\n')}
`
  }

  if (needsAttention?.length > 0) {
    text += `
NEEDS ATTENTION
${needsAttention.slice(0, 5).map(i => `- ${i.source_name}: ${i.error_message || i.issue_detail}`).join('\n')}
`
  }

  text += `
---
View Dashboard: ${DASHBOARD_URL}
GitHub Actions: ${GITHUB_ACTIONS_URL}
`

  return text
}

/**
 * Send maintenance report email
 */
async function sendMaintenanceReport(data) {
  const recipients = (process.env.MAINTENANCE_REPORT_TO || '').split(',').map(e => e.trim()).filter(Boolean)

  if (recipients.length === 0) {
    console.log('⚠️ MAINTENANCE_REPORT_TO not configured, skipping email')
    return { sent: false, reason: 'no_recipients' }
  }

  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const reportData = { ...data, date }
  const healthScore = data.summary?.healthScore || 100
  const statusEmoji = healthScore >= 90 ? '🟢' : healthScore >= 70 ? '🟡' : '🔴'

  try {
    const result = await sendEmail({
      from: process.env.DIGEST_FROM_EMAIL || 'RegCanary <alerts@regcanary.com>',
      to: recipients,
      subject: `${statusEmoji} RegCanary Maintenance Report — ${healthScore}% Health | ${date}`,
      html: buildMaintenanceReportHTML(reportData),
      text: buildMaintenanceReportText(reportData)
    })

    console.log(`✅ Maintenance report sent to ${recipients.length} recipient(s)`)
    return { sent: true, recipients, result }

  } catch (error) {
    console.error('❌ Failed to send maintenance report:', error.message)
    return { sent: false, error: error.message }
  }
}

module.exports = {
  buildMaintenanceReportHTML,
  buildMaintenanceReportText,
  sendMaintenanceReport
}
