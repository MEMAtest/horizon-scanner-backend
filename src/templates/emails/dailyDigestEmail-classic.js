// src/templates/emails/dailyDigestEmail-classic.js
// Classic corporate design - Navy/Gold theme

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
          <div style="font-size: 15px; color: #475569; line-height: 1.6;">
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

    // Determine priority styling based on relevance score
    let priorityLabel = 'MONITOR'
    let priorityBg = '#475569'
    let priorityBorder = '#94A3B8'

    if (insight.relevanceScore >= 80) {
      priorityLabel = 'HIGH IMPACT'
      priorityBg = '#B91C1C'
      priorityBorder = '#DC2626'
    } else if (insight.relevanceScore >= 70) {
      priorityLabel = 'ENFORCEMENT'
      priorityBg = '#D97706'
      priorityBorder = '#F59E0B'
    }

    const sectorLabel = Array.isArray(insight.sectors) && insight.sectors.length
      ? insight.sectors.join(', ')
      : (insight.sector || 'Cross-sector')

    return `
      <tr>
        <td style="padding: 24px 0; border-bottom: 1px solid #E5E7EB;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 50px; vertical-align: top; padding-right: 16px;">
                <div style="width: 32px; height: 32px; border-radius: 6px; background: #1E3A8A; color: white; text-align: center; line-height: 32px; font-weight: 700; font-size: 14px;">
                  ${index + 1}
                </div>
              </td>
              <td style="vertical-align: top;">
                <div style="margin-bottom: 12px;">
                  <span style="display: inline-block; background: ${priorityBg}; color: white; padding: 5px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; border-radius: 3px; border-left: 3px solid ${priorityBorder};">
                    ${priorityLabel}
                  </span>
                </div>
                <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; line-height: 1.5; color: #1F2937;">
                  ${insight.url
                    ? `<a href="${insight.url}" style="color: #1F2937; text-decoration: none; border-bottom: 2px solid #D97706;">${insight.headline || 'Untitled update'}</a>`
                    : (insight.headline || 'Untitled update')}
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.7; color: #4B5563;">
                  ${truncate(insight.summary || insight.ai_summary || insight.description || '')}
                </p>
                <div style="font-size: 13px; color: #6B7280; line-height: 1.6;">
                  <div style="margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #1F2937;">Authority:</span> ${insight.authority || 'Pending'}
                  </div>
                  <div style="margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #1F2937;">Sector:</span> ${sectorLabel}
                  </div>
                  <div>
                    <span style="font-weight: 600; color: #1F2937;">Published:</span> ${published}
                  </div>
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
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #1E3A8A; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="width: 25%; padding: 32px 20px; border-right: 1px solid #E5E7EB; text-align: center; background: #F9FAFB;">
              <div style="font-size: 42px; font-weight: 700; color: #B91C1C; margin-bottom: 8px;">${metrics.highCount ?? 0}</div>
              <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">High Impact</div>
            </td>
            <td style="width: 25%; padding: 32px 20px; border-right: 1px solid #E5E7EB; text-align: center; background: #F9FAFB;">
              <div style="font-size: 42px; font-weight: 700; color: #D97706; margin-bottom: 8px;">${metrics.mediumCount ?? 0}</div>
              <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Enforcement</div>
            </td>
            <td style="width: 25%; padding: 32px 20px; border-right: 1px solid #E5E7EB; text-align: center; background: #F9FAFB;">
              <div style="font-size: 42px; font-weight: 700; color: #475569; margin-bottom: 8px;">${metrics.lowCount ?? 0}</div>
              <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Monitor</div>
            </td>
            <td style="width: 25%; padding: 32px 20px; text-align: center; background: #F9FAFB;">
              <div style="font-size: 42px; font-weight: 700; color: #1E3A8A; margin-bottom: 8px;">${metrics.uniqueAuthorities ?? 0}</div>
              <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Authorities</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

function buildDailyDigestEmail({ date, summary, insights, metrics, personaLabel = 'Executive', brand = {} }) {
  const formattedDate = formatDate(date)
  const limitedInsights = Array.isArray(insights) ? insights.slice(0, 10) : []
  const title = brand.title || 'Regulatory Horizon Scanner'
  const heroTitle = `${personaLabel} Intelligence Digest`

  // Premium subject line format
  const dateShort = formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' })
  const subject = `Regulatory Horizon Scanner — Executive Intelligence Brief | ${dateShort}`

  const dashboardUrl = process.env.DASHBOARD_URL || 'https://horizon-scanner-backend.vercel.app/dashboard'

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Lato:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        @media screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 16px !important; }
          .stat-cell { display: block !important; width: 100% !important; border-right: none !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F3F4F6;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #F3F4F6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table class="container" width="640" cellpadding="0" cellspacing="0" role="presentation" style="background: white; border: 3px solid #1E3A8A; border-radius: 0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden;">

              <!-- Header with navy background -->
              <tr>
                <td style="background: #1E3A8A; padding: 50px 40px; text-align: center; border-bottom: 4px solid #D97706;">
                  <h1 style="margin: 0 0 12px 0; font-family: 'Merriweather', Georgia, serif; font-size: 32px; font-weight: 700; color: white; letter-spacing: 0.02em;">
                    ${heroTitle}
                  </h1>
                  <div style="font-size: 14px; color: #93C5FD; font-weight: 500; letter-spacing: 0.05em;">
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
                      <td style="padding-bottom: 32px; border-bottom: 2px solid #E5E7EB;">
                        <div style="border-left: 4px solid #D97706; padding-left: 16px; margin-bottom: 16px;">
                          <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.05em;">
                            Executive Summary
                          </h2>
                        </div>
                        <p style="margin: 0 0 12px 0; font-size: 15px; color: #374151; line-height: 1.8;">
                          ${summary || 'No material intelligence surfaced in the last cycle. Monitoring continues across all configured sources.'}
                        </p>
                        <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.6; font-style: italic;">
                          Each update is classified as HIGH IMPACT (immediate attention required), ENFORCEMENT (regulatory actions and penalties), or MONITOR (notable developments for ongoing awareness).
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Metrics -->
                  ${buildMetricsRow(metrics)}

                  <!-- Insights -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 40px 0 16px 0;">
                        <div style="border-left: 4px solid #D97706; padding-left: 16px;">
                          <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.05em;">
                            Priority Signals
                          </h2>
                        </div>
                      </td>
                    </tr>
                    ${buildInsightRows(limitedInsights)}
                  </table>

                </td>
              </tr>

              <!-- CTA Section -->
              <tr>
                <td style="padding: 32px 40px; background: #F8FAFC; border-top: 1px solid #E5E7EB; border-bottom: 2px solid #E5E7EB;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center; padding: 20px 0;">
                        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1F2937;">
                          Explore Full Intelligence Dashboard
                        </h3>
                        <p style="margin: 0 0 24px 0; font-size: 14px; color: #6B7280; line-height: 1.6;">
                          Access real-time regulatory updates, advanced filtering, and comprehensive analytics
                        </p>
                        <a href="${dashboardUrl}" style="display: inline-block; background: #1E3A8A; color: white; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);">
                          Open Horizon Scanner
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #F9FAFB; padding: 32px 40px;">
                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #6B7280; line-height: 1.7; text-align: center;">
                    Your comprehensive intelligence briefing, curated from real-time regulatory movements across all major financial authorities. Stay informed, stay compliant, stay ahead.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #6B7280; text-align: center; font-weight: 500;">
                    © ${new Date().getFullYear()} MEMA Financial Services
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
