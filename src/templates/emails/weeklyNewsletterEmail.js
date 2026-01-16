// src/templates/emails/weeklyNewsletterEmail.js
// Weekly analytical newsletter with curated articles and AI firm impact analysis

const { getRegulatorIcon, getCanaryIconSimple } = require('./regulatorIcons')

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

function getCategoryColor(category) {
  const colors = {
    ENFORCEMENT: '#DC2626',
    CONSULTATION: '#7C3AED',
    GUIDANCE: '#059669',
    SPEECH: '#0284C7',
    INTERNATIONAL: '#D97706',
    STRATEGIC: '#1E3A8A'
  }
  return colors[category] || colors.STRATEGIC
}

function getCategoryLabel(category) {
  const labels = {
    ENFORCEMENT: 'Enforcement Action',
    CONSULTATION: 'Consultation',
    GUIDANCE: 'Regulatory Guidance',
    SPEECH: 'Leadership Remarks',
    INTERNATIONAL: 'International',
    STRATEGIC: 'Strategic Signal'
  }
  return labels[category] || 'Regulatory Update'
}

function formatAnalysis(analysis) {
  if (!analysis) return ''

  // Convert markdown-style formatting to HTML
  let html = analysis
    // Bold headers
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #1E3A8A;">$1</strong>')
    // Bullet points
    .replace(/^- /gm, '• ')
    // Line breaks for paragraphs
    .split('\n\n').join('</p><p style="margin: 12px 0; font-size: 14px; color: #374151; line-height: 1.7;">')
    // Line breaks within sections
    .replace(/\n/g, '<br/>')

  return `<p style="margin: 12px 0; font-size: 14px; color: #374151; line-height: 1.7;">${html}</p>`
}

function buildArticleCard(article, index) {
  const categoryColor = getCategoryColor(article.category)
  const categoryLabel = getCategoryLabel(article.category)

  const published = formatDate(article.publishedDate || article.published_date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const summary = article.ai_summary || article.summary || ''
  // Truncate at sentence boundary, no trailing "..."
  let truncatedSummary = summary
  if (summary.length > 350) {
    const cutPoint = summary.slice(0, 350).lastIndexOf('.')
    truncatedSummary = cutPoint > 150 ? summary.slice(0, cutPoint + 1) : summary.slice(0, 300)
  }

  return `
    <!-- Article ${index + 1} -->
    <tr>
      <td style="padding: 0 0 32px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border: 2px solid #E5E7EB; border-radius: 12px; overflow: hidden;">

          <!-- Article Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%); padding: 20px 24px; border-bottom: 2px solid ${categoryColor};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 48px; vertical-align: top;">
                    ${getRegulatorIcon(article.authority, 40)}
                  </td>
                  <td style="padding-left: 16px; vertical-align: middle;">
                    <div style="margin-bottom: 4px;">
                      <span style="display: inline-block; padding: 4px 10px; background: ${categoryColor}; color: #FFFFFF; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; border-radius: 4px; text-transform: uppercase;">
                        ${categoryLabel}
                      </span>
                      <span style="font-size: 11px; color: #6B7280; margin-left: 12px;">
                        ${article.authority || 'Unknown'} • ${published}
                      </span>
                    </div>
                    <h3 style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; line-height: 1.4; color: #111827;">
                      ${article.url
                        ? `<a href="${article.url}" style="color: #111827; text-decoration: none;">${article.title || article.headline}</a>`
                        : (article.title || article.headline)}
                    </h3>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Article Summary -->
          <tr>
            <td style="padding: 20px 24px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
              <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.7; font-style: italic;">
                ${truncatedSummary}
              </p>
            </td>
          </tr>

          <!-- Firm Impact Analysis -->
          <tr>
            <td style="padding: 24px;">
              <div style="border-left: 4px solid ${categoryColor}; padding-left: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #1E3A8A; text-transform: uppercase; letter-spacing: 0.05em;">
                  What This Means For Your Firm
                </h4>
              </div>
              <div style="font-size: 14px; color: #374151; line-height: 1.7;">
                ${formatAnalysis(article.firmImpactAnalysis)}
              </div>
            </td>
          </tr>

          <!-- Read More -->
          ${article.url ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <a href="${article.url}" style="display: inline-block; padding: 10px 20px; background: ${categoryColor}; color: #FFFFFF; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 0.03em;">
                READ FULL ARTICLE →
              </a>
            </td>
          </tr>
          ` : ''}

        </table>
      </td>
    </tr>
  `
}

function buildDeadlinesSection(deadlines) {
  if (!deadlines || deadlines.length === 0) return ''

  const deadlineRows = deadlines.slice(0, 5).map(d => {
    const daysText = d.daysRemaining <= 7
      ? `<span style="color: #DC2626; font-weight: 600;">${d.daysRemaining} days</span>`
      : `${d.daysRemaining} days`

    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 80px; font-size: 12px; color: #6B7280; vertical-align: top;">
                ${daysText}
              </td>
              <td style="font-size: 13px; color: #374151; line-height: 1.5;">
                <strong>${d.authority}</strong>: ${d.description ? d.description.slice(0, 80) : 'Upcoming deadline'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  return `
    <tr>
      <td style="padding: 24px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 20px 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.05em;">
                ⏰ Looking Ahead: Upcoming Deadlines
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${deadlineRows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

function buildWeeklyNewsletterEmail({
  weekRange,
  overview,
  totalUpdates,
  stats,
  articles,
  upcomingDeadlines,
  generatedAt,
  brand = {}
}) {
  const title = brand.title || 'RegCanary'
  const subject = `${title} Weekly Intelligence — ${weekRange.shortDisplay}`

  const dashboardUrl = process.env.DASHBOARD_URL || 'https://horizon-scanner-backend.vercel.app/dashboard'

  const articleCards = (articles || []).map((article, i) => buildArticleCard(article, i)).join('')

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
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #F3F4F6;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #F3F4F6; padding: 32px 0;">
        <tr>
          <td align="center">
            <table class="container" width="680" cellpadding="0" cellspacing="0" role="presentation" style="background: white; border: 3px solid #1E3A8A; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden;">

              <!-- Premium Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%); padding: 40px; text-align: center; border-bottom: 4px solid #F59E0B;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        ${getCanaryIconSimple(64)}
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 16px;">
                        <span style="font-size: 28px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">RegCanary</span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 8px;">
                        <span style="font-size: 18px; font-weight: 600; color: #F1F5F9; letter-spacing: 0.02em;">
                          WEEKLY INTELLIGENCE BRIEFING
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 12px;">
                        <span style="display: inline-block; padding: 8px 20px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 13px; color: #E0E7FF; letter-spacing: 0.05em;">
                          ${weekRange.display}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Area -->
              <tr>
                <td style="padding: 32px;">

                  <!-- Week at a Glance -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 24px; border-bottom: 2px solid #E5E7EB;">
                        <div style="border-left: 4px solid #D97706; padding-left: 14px; margin-bottom: 16px;">
                          <h2 style="margin: 0; font-size: 16px; font-weight: 700; color: #1F2937; text-transform: uppercase; letter-spacing: 0.05em;">
                            This Week at a Glance
                          </h2>
                        </div>
                        <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; line-height: 1.7;">
                          ${overview}
                        </p>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-right: 24px;">
                              <span style="font-size: 24px; font-weight: 700; color: #1E3A8A;">${totalUpdates}</span>
                              <span style="font-size: 12px; color: #6B7280; margin-left: 4px;">updates tracked</span>
                            </td>
                            <td style="padding-right: 24px;">
                              <span style="font-size: 24px; font-weight: 700; color: #DC2626;">${stats?.enforcement || 0}</span>
                              <span style="font-size: 12px; color: #6B7280; margin-left: 4px;">enforcement</span>
                            </td>
                            <td>
                              <span style="font-size: 24px; font-weight: 700; color: #059669;">${stats?.highImpact || 0}</span>
                              <span style="font-size: 12px; color: #6B7280; margin-left: 4px;">high impact</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section Header: Top Stories -->
                  <tr>
                    <td style="padding: 32px 0 16px 0;">
                      <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1E3A8A; border-bottom: 3px solid #1E3A8A; padding-bottom: 12px;">
                        TOP ${articles?.length || 5} STORIES THIS WEEK
                      </h2>
                      <p style="margin: 12px 0 0 0; font-size: 13px; color: #6B7280;">
                        Curated for impact • AI-powered analysis for your firm
                      </p>
                    </td>
                  </tr>

                  <!-- Article Cards -->
                  ${articleCards}

                  <!-- Upcoming Deadlines -->
                  ${buildDeadlinesSection(upcomingDeadlines)}

                  <!-- CTA -->
                  <tr>
                    <td style="padding: 24px 0; text-align: center;">
                      <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%); color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; letter-spacing: 0.03em; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.3);">
                        VIEW FULL INTELLIGENCE DASHBOARD
                      </a>
                    </td>
                  </tr>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #1E3A8A; padding: 24px 32px; text-align: center;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #93C5FD;">
                    ${brand.footer || 'RegCanary — Regulatory Intelligence for Financial Services'}
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #60A5FA;">
                    Generated ${formatDate(generatedAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

  // Plain text version
  const text = `
REGCANARY WEEKLY INTELLIGENCE BRIEFING
${weekRange.display}

THIS WEEK AT A GLANCE
${overview}

${totalUpdates} updates tracked | ${stats?.enforcement || 0} enforcement | ${stats?.highImpact || 0} high impact

---

TOP ${articles?.length || 5} STORIES THIS WEEK

${(articles || []).map((article, i) => `
${i + 1}. [${article.category}] ${article.title || article.headline}
   Authority: ${article.authority}

   ${article.ai_summary || article.summary || ''}

   WHAT THIS MEANS FOR YOUR FIRM:
   ${article.firmImpactAnalysis || 'Analysis not available'}

   ${article.url ? `Read more: ${article.url}` : ''}
`).join('\n---\n')}

${upcomingDeadlines?.length ? `
LOOKING AHEAD: UPCOMING DEADLINES
${upcomingDeadlines.map(d => `• ${d.daysRemaining} days: ${d.authority} - ${d.description || 'Deadline'}`).join('\n')}
` : ''}

---
View full dashboard: ${dashboardUrl}

${brand.footer || 'RegCanary — Regulatory Intelligence for Financial Services'}
  `.trim()

  return { subject, html, text }
}

module.exports = {
  buildWeeklyNewsletterEmail
}
