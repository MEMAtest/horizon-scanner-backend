// src/templates/emails/dailyDigestEmail-classic.js
// Classic corporate design - Navy/Gold theme with two-column layout

const { getRegulatorIcon, getCanaryIconSimple, getPriorityColor } = require('./regulatorIcons')

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

// Get the best available summary, preferring clean text over prefix-polluted text
function getBestSummary(insight) {
  const aiSummary = insight.ai_summary || ''
  const summary = insight.summary || ''
  const description = insight.description || ''
  const headline = insight.headline || ''

  // Pattern for common prefixes to strip
  const prefixPattern = /^(Informational regulatory update:|Regulatory update impacting business operations:|RegCanary Analysis:)\s*/i

  // Helper to check if text is meaningful (not just headline repeated)
  const isMeaningful = (text) => {
    if (!text || text.length < 20) return false
    // If text is at least 40 chars, it's probably meaningful
    if (text.length >= 40) return true
    const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const cleanHeadline = headline.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    // Only reject if it's basically just the headline
    if (cleanText === cleanHeadline || cleanText.length < cleanHeadline.length * 0.5) return false
    return true
  }

  // Clean the ai_summary
  let cleanedAi = aiSummary.replace(prefixPattern, '').trim()
  // Remove headline if it starts with it
  const headlineStart = headline.toLowerCase().slice(0, 30)
  if (cleanedAi.toLowerCase().startsWith(headlineStart)) {
    cleanedAi = cleanedAi.slice(headline.length).trim()
  }

  // Prefer AI summary if meaningful (cleaner and more contextual)
  if (cleanedAi && isMeaningful(cleanedAi)) {
    return cleanedAi
  }

  // Fall back to RSS summary if available and meaningful
  if (summary && summary.trim() && isMeaningful(summary)) {
    return summary.replace(prefixPattern, '').trim()
  }

  // Use description if available and meaningful
  if (description && description.trim() && isMeaningful(description)) {
    return description.replace(prefixPattern, '').trim()
  }

  // Return empty if nothing meaningful
  return ''
}

// Improved truncation - ALWAYS cuts at word boundary, never mid-word
function truncate(text, length = 360) {
  if (!text) return ''

  // Clean up the text - normalize whitespace and remove common prefixes
  let cleaned = String(text).replace(/\s+/g, ' ').trim()
  cleaned = cleaned.replace(/^(Informational regulatory update:|Regulatory update impacting business operations:|RegCanary Analysis:)\s*/i, '')

  // Helper: always cut at word boundary, never mid-word
  const cutAtWordBoundary = (str, maxLen) => {
    if (str.length <= maxLen) return str
    // Find last space before maxLen
    const lastSpace = str.lastIndexOf(' ', maxLen)
    if (lastSpace > maxLen * 0.3) {
      return str.slice(0, lastSpace).trim()
    }
    // If no good space, just take up to maxLen (rare edge case)
    return str.slice(0, maxLen).trim()
  }

  // If text is already truncated mid-word, clean it up
  // Check if it ends abruptly (not with punctuation or complete word)
  const lastChar = cleaned.slice(-1)
  const endsWithPunct = ['.', '!', '?', ':', ';', ',', '"', "'", ')'].includes(lastChar)
  const endsWithEllipsis = cleaned.endsWith('...')

  if (endsWithEllipsis || (!endsWithPunct && cleaned.length > 50)) {
    // Remove trailing ellipsis if present
    let base = endsWithEllipsis ? cleaned.slice(0, -3).trim() : cleaned

    // Look for sentence boundary first
    const lastPeriod = base.lastIndexOf('.')
    const lastExclaim = base.lastIndexOf('!')
    const lastQuestion = base.lastIndexOf('?')
    const boundary = Math.max(lastPeriod, lastExclaim, lastQuestion)

    // If we find a sentence ending after 40% of text, use it
    if (boundary > base.length * 0.4) {
      cleaned = base.slice(0, boundary + 1).trim()
    } else {
      // Otherwise cut at last space to avoid mid-word cutoff
      const lastSpace = base.lastIndexOf(' ')
      if (lastSpace > base.length * 0.5) {
        cleaned = base.slice(0, lastSpace).trim()
      }
    }
  }

  if (cleaned.length <= length) return cleaned

  // Find the portion within our limit
  const truncated = cleaned.slice(0, length)

  // Look for sentence endings first
  const lastPeriod = truncated.lastIndexOf('.')
  const lastExclaim = truncated.lastIndexOf('!')
  const lastQuestion = truncated.lastIndexOf('?')
  const boundary = Math.max(lastPeriod, lastExclaim, lastQuestion)

  // Use sentence boundary if it's after 35% of limit
  if (boundary > length * 0.35) {
    return cleaned.slice(0, boundary + 1).trim()
  }

  // Fallback: ALWAYS cut at word boundary
  return cutAtWordBoundary(cleaned, length)
}

// Build premium compact insight card for two-column layout
function buildCompactCard(insight, index) {
  const published = formatDate(insight.published || insight.publishedDate || insight.createdAt, {
    day: 'numeric',
    month: 'short'
  })

  const priorityColor = getPriorityColor(insight)
  let priorityLabel = 'AWARE'
  if (insight.relevanceScore >= 80) priorityLabel = 'REVIEW'
  else if (insight.relevanceScore >= 70) priorityLabel = 'MONITOR'

  const regionLabel = insight.region && insight.region !== 'UK'
    ? ` • ${insight.country || insight.region}`
    : ''

  return `
    <div style="padding: 16px 18px; background: #FFFFFF; border-radius: 8px; border-left: 4px solid ${priorityColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);">
      <!-- Header row with icon and authority -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width: 36px; vertical-align: top;">
            ${getRegulatorIcon(insight.authority, 32)}
          </td>
          <td style="padding-left: 12px; vertical-align: middle;">
            <span style="font-size: 11px; font-weight: 600; color: #64748B; letter-spacing: 0.05em;">
              ${insight.authority || 'Unknown'}${regionLabel}
            </span>
            <span style="font-size: 10px; color: #94A3B8; margin-left: 6px;">#${index}</span>
          </td>
        </tr>
      </table>

      <!-- Headline -->
      <h4 style="margin: 12px 0 8px 0; font-size: 15px; font-weight: 600; line-height: 1.45; color: #1E293B;">
        ${insight.url
          ? `<a href="${insight.url}" style="color: #1E293B; text-decoration: none;">${truncate(insight.headline || 'Untitled', 85)}</a>`
          : truncate(insight.headline || 'Untitled', 85)}
      </h4>

      <!-- Summary - use getBestSummary to get cleanest text -->
      ${getBestSummary(insight) ? `
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
        ${truncate(getBestSummary(insight), 280)}
      </p>
      ` : ''}

      <!-- Footer: Action + Date -->
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #F1F5F9;">
        <span style="display: inline-block; padding: 4px 10px; background: ${insight.relevanceScore >= 70 ? '#FEF3C7' : '#F0FDF4'}; color: ${insight.relevanceScore >= 70 ? '#92400E' : '#166534'}; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; border-radius: 4px;">
          ${priorityLabel}
        </span>
        <span style="font-size: 11px; color: #94A3B8; margin-left: 10px;">
          ${published}
        </span>
      </div>
    </div>
  `
}

// Build two-column grid of insights
function buildTwoColumnGrid(insights, startIndex = 1) {
  if (!Array.isArray(insights) || insights.length === 0) {
    return `
      <tr>
        <td colspan="2" style="padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
          No updates in this section.
        </td>
      </tr>
    `
  }

  const rows = []
  for (let i = 0; i < insights.length; i += 2) {
    const left = insights[i]
    const right = insights[i + 1]

    rows.push(`
      <tr>
        <td style="width: 50%; padding: 8px; vertical-align: top;">
          ${buildCompactCard(left, startIndex + i)}
        </td>
        ${right ? `
        <td style="width: 50%; padding: 8px; vertical-align: top;">
          ${buildCompactCard(right, startIndex + i + 1)}
        </td>
        ` : '<td style="width: 50%; padding: 8px;"></td>'}
      </tr>
    `)
  }

  return rows.join('')
}

function buildMetricsRow(metrics) {
  if (!metrics) return ''

  return `
    <tr>
      <td style="padding: 24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #1E3A8A; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="width: 25%; padding: 24px 16px; border-right: 1px solid #E5E7EB; text-align: center; background: #F9FAFB;">
              <div style="font-size: 36px; font-weight: 700; color: #B91C1C; margin-bottom: 4px;">${metrics.highCount ?? 0}</div>
              <div style="font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">High Impact</div>
            </td>
            <td style="width: 25%; padding: 24px 16px; border-right: 1px solid #E5E7EB; text-align: center; background: #F9FAFB;">
              <div style="font-size: 36px; font-weight: 700; color: #D97706; margin-bottom: 4px;">${metrics.mediumCount ?? 0}</div>
              <div style="font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Enforcement</div>
            </td>
            <td style="width: 25%; padding: 24px 16px; border-right: 1px solid #E5E7EB; text-align: center; background: #F9FAFB;">
              <div style="font-size: 36px; font-weight: 700; color: #475569; margin-bottom: 4px;">${metrics.lowCount ?? 0}</div>
              <div style="font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Monitor</div>
            </td>
            <td style="width: 25%; padding: 24px 16px; text-align: center; background: #F9FAFB;">
              <div style="font-size: 36px; font-weight: 700; color: #1E3A8A; margin-bottom: 4px;">${metrics.uniqueAuthorities ?? 0}</div>
              <div style="font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Authorities</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

function buildDailyDigestEmail({ date, summary, insights, metrics, personaLabel = 'Executive', brand = {} }) {
  const formattedDate = formatDate(date)
  const allInsights = Array.isArray(insights) ? insights : []

  // Split insights into UK and International sections
  const ukInsights = allInsights.filter(i => !i.region || i.region === 'UK').slice(0, 10)
  const intlInsights = allInsights.filter(i => i.region && i.region !== 'UK').slice(0, 5)

  const title = brand.title || 'Regulatory Horizon Scanner'
  const heroTitle = `${personaLabel} Intelligence Digest`

  // Premium subject line format
  const dateShort = formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' })
  const subject = `RegCanary — ${heroTitle} | ${dateShort}`

  const dashboardUrl = process.env.DASHBOARD_URL || 'https://horizon-scanner-backend.vercel.app/dashboard'

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        @media screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 12px !important; }
          .two-col td { display: block !important; width: 100% !important; }
          .stat-cell { display: block !important; width: 100% !important; border-right: none !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #F3F4F6;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #F3F4F6; padding: 32px 0;">
        <tr>
          <td align="center">
            <table class="container" width="680" cellpadding="0" cellspacing="0" role="presentation" style="background: white; border: 3px solid #1E3A8A; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden;">

              <!-- Premium Header with RegCanary branding -->
              <tr>
                <td style="background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%); padding: 32px 40px; text-align: center; border-bottom: 4px solid #F59E0B;">
                  <!-- RegCanary Logo -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        ${getCanaryIconSimple(56)}
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 12px;">
                        <span style="font-size: 26px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">RegCanary</span>
                        <span style="font-size: 14px; font-weight: 500; color: #94A3B8; margin-left: 8px; letter-spacing: 0.05em;">REG INTELLIGENCE</span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 6px;">
                        <span style="font-size: 12px; color: #F1F5F9; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600;">
                          EXECUTIVE DIGEST • ${formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content area -->
              <tr>
                <td style="padding: 32px;">

                  <!-- Executive Summary -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 24px; border-bottom: 2px solid #E5E7EB;">
                        <div style="border-left: 4px solid #D97706; padding-left: 14px; margin-bottom: 12px;">
                          <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.05em;">
                            Executive Summary
                          </h2>
                        </div>
                        <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; line-height: 1.7;">
                          ${summary || 'No material intelligence surfaced in the last cycle. Monitoring continues across all configured sources.'}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Metrics -->
                  ${buildMetricsRow(metrics)}

                  <!-- UK REGULATORY UPDATES (Navy theme) -->
                  ${ukInsights.length > 0 ? `
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 32px 0 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #EFF6FF; border-radius: 8px; padding: 16px;">
                          <tr>
                            <td>
                              <div style="border-left: 4px solid #1E3A8A; padding-left: 14px;">
                                <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #1E3A8A; text-transform: uppercase; letter-spacing: 0.05em;">
                                  UK Regulatory Updates
                                </h2>
                                <p style="margin: 4px 0 0 0; font-size: 11px; color: #3B82F6;">${ukInsights.length} updates from UK authorities</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Two-column grid for UK items -->
                    <tr>
                      <td>
                        <table class="two-col" width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; border-radius: 8px;">
                          ${buildTwoColumnGrid(ukInsights, 1)}
                        </table>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  <!-- INTERNATIONAL UPDATES -->
                  ${intlInsights.length > 0 ? `
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 32px 0 12px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; border-radius: 8px; padding: 16px;">
                          <tr>
                            <td>
                              <div style="border-left: 4px solid #6366F1; padding-left: 14px;">
                                <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #4338CA; text-transform: uppercase; letter-spacing: 0.05em;">
                                  International Updates
                                </h2>
                                <p style="margin: 4px 0 0 0; font-size: 11px; color: #6366F1;">${intlInsights.length} updates from global regulators</p>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Two-column grid for International items -->
                    <tr>
                      <td>
                        <table class="two-col" width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; border-radius: 8px;">
                          ${buildTwoColumnGrid(intlInsights, ukInsights.length + 1)}
                        </table>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                </td>
              </tr>

              <!-- CTA Section -->
              <tr>
                <td style="padding: 24px 32px; background: #F8FAFC; border-top: 1px solid #E5E7EB;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center; padding: 16px 0;">
                        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #1F2937;">
                          Explore Full Intelligence Dashboard
                        </h3>
                        <p style="margin: 0 0 20px 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
                          Access real-time regulatory updates, advanced filtering, and comprehensive analytics
                        </p>
                        <a href="${dashboardUrl}" style="display: inline-block; background: #1E3A8A; color: white; padding: 12px 28px; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 6px; box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);">
                          Open Horizon Scanner
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer with RegCanary branding -->
              <tr>
                <td style="background: #F9FAFB; padding: 24px 32px; border-top: 1px solid #E5E7EB;">
                  <p style="margin: 0 0 12px 0; font-size: 12px; color: #6B7280; line-height: 1.6; text-align: center;">
                    Your comprehensive intelligence briefing from real-time regulatory movements across major financial authorities.
                  </p>
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: #6B7280; text-align: center; font-weight: 600;">
                    ${brand.footer || 'Sent for QA – not for redistribution.'}
                  </p>
                  <p style="margin: 0; font-size: 10px; color: #9CA3AF; text-align: center;">
                    © ${new Date().getFullYear()} RegCanary • Powered by MEMA Consultants
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
    `RegCanary — ${heroTitle}`,
    formattedDate,
    '',
    `Executive Summary: ${summary || 'No material intelligence surfaced in the last cycle.'}`,
    '',
    '=== UK REGULATORY UPDATES ===',
    ...(ukInsights.length
      ? ukInsights.map((insight, index) => {
          return [
            `${index + 1}. ${insight.headline || 'Untitled update'}`,
            `   Authority: ${insight.authority || 'Unknown'} | Sector: ${Array.isArray(insight.sectors) && insight.sectors.length ? insight.sectors.join(', ') : insight.sector || 'Cross-sector'}`,
            `   Action: ${insight.relevanceScore >= 80 ? 'Review immediately' : insight.relevanceScore >= 70 ? 'Monitor closely' : 'Awareness only'}`,
            insight.url ? `   Link: ${insight.url}` : ''
          ].filter(Boolean).join('\n')
        })
      : ['No UK updates in this cycle.']),
    '',
    '=== INTERNATIONAL UPDATES ===',
    ...(intlInsights.length
      ? intlInsights.map((insight, index) => {
          return [
            `${index + 1}. ${insight.headline || 'Untitled update'}`,
            `   Authority: ${insight.authority || 'Unknown'} (${insight.country || insight.region || 'International'})`,
            `   Action: ${insight.relevanceScore >= 80 ? 'Review immediately' : insight.relevanceScore >= 70 ? 'Monitor closely' : 'Awareness only'}`,
            insight.url ? `   Link: ${insight.url}` : ''
          ].filter(Boolean).join('\n')
        })
      : ['No international updates in this cycle.']),
    '',
    'View full dashboard: ' + dashboardUrl,
    ''
  ].join('\n')

  return { subject, html, text }
}

module.exports = {
  buildDailyDigestEmail
}
