// src/templates/emails/dailyDigestEmail.js
// Builds the HTML + text representation for the daily intelligence digest email.

function formatDate(value, options) {
  if (!value) return 'Unknown'
  try {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown'
    return date.toLocaleDateString('en-GB', options || {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch (error) {
    return 'Unknown'
  }
}

function truncate(text, length = 200) {
  if (!text) return ''
  const cleaned = String(text).replace(/\s+/g, ' ').trim()
  return cleaned.length > length ? `${cleaned.slice(0, length).trim()}…` : cleaned
}

function buildInsightRows(insights) {
  if (!Array.isArray(insights) || insights.length === 0) {
    return `
      <tr>
        <td style="padding: 32px 0; text-align: center;">
          <div style="font-size: 15px; color: #64748B; line-height: 1.6;">
            No high-priority insights were captured in the last cycle.<br/>
            The intelligence engine will continue monitoring all configured sources.
          </div>
        </td>
      </tr>
    `
  }

  return insights.map((insight, index) => {
    const published = formatDate(insight.published || insight.publishedDate || insight.createdAt, {
      day: 'numeric',
      month: 'short'
    })
    const priorityLabel = insight.relevanceScore >= 80 ? 'HIGH IMPACT' : 'MONITOR'
    const priorityColor = insight.relevanceScore >= 80 ? '#DC2626' : '#2563EB'

    const sectorLabel = Array.isArray(insight.sectors) && insight.sectors.length
      ? insight.sectors.join(', ')
      : (insight.sector || 'Cross-sector')

    return `
      <tr>
        <td style="padding: 28px 0; border-bottom: 1px solid #E2E8F0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 50px; vertical-align: top; padding-right: 16px;">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px;">
                  ${index + 1}
                </div>
              </td>
              <td style="vertical-align: top;">
                <div style="margin-bottom: 8px;">
                  <span style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${priorityColor};">
                    ${priorityLabel}
                  </span>
                </div>
                <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; line-height: 1.4; color: #0F172A;">
                  ${insight.url
                    ? `<a href="${insight.url}" style="color: #0F172A; text-decoration: none;">${insight.headline || 'Untitled update'}</a>`
                    : (insight.headline || 'Untitled update')}
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.7; color: #475569;">
                  ${truncate(insight.summary || insight.ai_summary || insight.description || '')}
                </p>
                <div style="font-size: 13px; color: #64748B;">
                  <strong style="color: #1E293B;">${insight.authority || 'Authority pending'}</strong>
                  <span style="margin: 0 8px;">·</span>
                  <span>${sectorLabel}</span>
                  <span style="margin: 0 8px;">·</span>
                  <span>${published}</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')
}

function buildMetricsRow(metrics) {
  if (!metrics) return ''

  return `
    <tr>
      <td style="padding: 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
          <tr style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);">
            <td style="padding: 20px 24px;">
              <div style="color: white; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                Intelligence Summary
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 25%; padding: 24px; border-right: 1px solid #E2E8F0; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${metrics.highCount ?? 0}</div>
                    <div style="font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">High Impact</div>
                  </td>
                  <td style="width: 25%; padding: 24px; border-right: 1px solid #E2E8F0; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${metrics.mediumCount ?? 0}</div>
                    <div style="font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">Monitor</div>
                  </td>
                  <td style="width: 25%; padding: 24px; border-right: 1px solid #E2E8F0; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${metrics.uniqueAuthorities ?? 0}</div>
                    <div style="font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">Authorities</div>
                  </td>
                  <td style="width: 25%; padding: 24px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${metrics.deadlineCount ?? 0}</div>
                    <div style="font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em;">Deadlines</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

function buildDailyDigestEmail({ date, summary, insights, metrics, personaLabel = 'Executive', brand = {} }) {
  const formattedDate = formatDate(date)
  const limitedInsights = Array.isArray(insights) ? insights.slice(0, 8) : []
  const title = brand.title || 'Regulatory Horizon Scanner'
  const heroTitle = `${personaLabel} Intelligence Digest`
  const subject = `${title} — Daily Digest (${formattedDate})`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @media screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 16px !important; }
          .stat-cell { display: block !important; width: 100% !important; border-right: none !important; border-bottom: 1px solid #E2E8F0 !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFC;">
      <!-- Subtle regulatory-themed background pattern -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(to bottom, #F8FAFC 0%, #EFF6FF 100%); padding: 40px 0;">
        <tr>
          <td align="center">
            <!-- Main container with shadow -->
            <table class="container" width="640" cellpadding="0" cellspacing="0" role="presentation" style="background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">

              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); padding: 48px 40px; text-align: center;">
                  <div style="background: rgba(255, 255, 255, 0.15); display: inline-block; padding: 8px 16px; border-radius: 24px; margin-bottom: 16px;">
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: white;">
                      ${title}
                    </span>
                  </div>
                  <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: white; letter-spacing: -0.02em;">
                    ${heroTitle}
                  </h1>
                  <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">
                    ${formattedDate}
                  </div>
                </td>
              </tr>

              <!-- Content area -->
              <tr>
                <td style="padding: 40px;">

                  <!-- Executive Summary -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 32px;">
                        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em;">
                          Executive Summary
                        </h2>
                        <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
                          ${summary || 'No material intelligence surfaced in the last cycle. Monitoring continues across all configured sources.'}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Metrics -->
                  ${buildMetricsRow(metrics)}

                  <!-- Insights -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 40px 0 12px 0;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em;">
                          Priority Signals
                        </h2>
                      </td>
                    </tr>
                    ${buildInsightRows(limitedInsights)}
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #F8FAFC; padding: 32px 40px; border-top: 1px solid #E2E8F0;">
                  <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748B; line-height: 1.6;">
                    This digest is generated automatically from the intelligence centre. Pin, annotate, or reprioritise updates directly from the workspace to tailor future briefs.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94A3B8; text-align: center;">
                    © ${new Date().getFullYear()} ${title}. ${brand.footer || 'All rights reserved.'}
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

  const text = [
    `${title} — ${heroTitle}`,
    formattedDate,
    '',
    `Executive Summary: ${summary || 'No material intelligence surfaced in the last cycle.'}`,
    '',
    ...(limitedInsights.length
      ? limitedInsights.map((insight, index) => {
          return [
            `${index + 1}. ${insight.headline || 'Untitled update'}`,
            `   Authority: ${insight.authority || 'Unknown'} | Sector: ${Array.isArray(insight.sectors) && insight.sectors.length ? insight.sectors.join(', ') : insight.sector || 'Cross-sector'}`,
            `   Reason: ${insight.priorityReason || `Relevance score ${insight.relevanceScore || '—'}%`}`,
            insight.url ? `   Link: ${insight.url}` : ''
          ].filter(Boolean).join('\n')
        })
      : ['No high-priority insights were captured in the last cycle.']),
    '',
    'You can adjust digest preferences inside the Intelligence Workspace.',
    ''
  ].join('\n')

  return { subject, html, text }
}

module.exports = {
  buildDailyDigestEmail
}
