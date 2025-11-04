const dbService = require('../../services/dbService')
const { getSidebar } = require('../templates/sidebar')
const { getCommonStyles } = require('../templates/commonStyles')
const { getCommonClientScripts } = require('../templates/clientScripts')
const { formatDateDisplay } = require('../../utils/dateHelpers')

async function renderUpdateDetailPage(req, res) {
  try {
    const updateId = req.params.id
    const update = await dbService.getUpdateById(updateId)

    if (!update) {
      return res.status(404).send(`
        <div style="padding: 2rem; text-align: center; font-family: system-ui;">
          <h1>Update Not Found</h1>
          <p style="color: #6b7280; margin: 1rem 0;">The requested update could not be found.</p>
          <a href="/dashboard" style="color: #3b82f6; text-decoration: none;"><- Back to Dashboard</a>
        </div>
      `)
    }

    const updates = await dbService.getAllUpdates()
    const counts = {
      totalUpdates: updates.length,
      urgentCount: updates.filter(u => u.urgency === 'High' || u.impactLevel === 'Significant').length,
      moderateCount: updates.filter(u => u.urgency === 'Medium' || u.impactLevel === 'Moderate').length,
      informationalCount: updates.filter(u => u.urgency === 'Low' || u.impactLevel === 'Informational').length
    }

    const sidebarHtml = await getSidebar('detail', counts)
    const commonStyles = getCommonStyles()
    const clientScripts = getCommonClientScripts()

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${update.headline || 'Update Details'} - Horizon Scanner</title>
  ${commonStyles}
  <style>
    .detail-container { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
    .detail-main { padding: 2rem; overflow-y: auto; background: #fafbfc; }
    .detail-header { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #e5e7eb; }
    .detail-title { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem; line-height: 1.3; }
    .detail-meta { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
    .detail-badge { padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; }
    .authority-badge { background: #dbeafe; color: #1e40af; }
    .urgency-high { background: #fee2e2; color: #dc2626; }
    .urgency-medium { background: #fef3c7; color: #d97706; }
    .urgency-low { background: #d1fae5; color: #065f46; }
    .detail-content { background: white; padding: 2rem; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 2rem; }
    .detail-section { margin-bottom: 2rem; }
    .detail-section h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem; }
    .detail-section p { color: #4b5563; line-height: 1.6; margin-bottom: 1rem; }
    .detail-actions { display: flex; gap: 1rem; margin-top: 2rem; }
    .btn { padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.15s; border: none; cursor: pointer; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .btn-secondary:hover { background: #e5e7eb; }
  </style>
</head>
<body>
  <div class="detail-container">
    ${sidebarHtml}

    <div class="detail-main">
      <div class="detail-header">
        <a href="/dashboard" style="color: #6b7280; text-decoration: none; font-size: 0.875rem; margin-bottom: 1rem; display: inline-block;"><- Back to Dashboard</a>
        <h1 class="detail-title">${update.headline || 'Regulatory Update'}</h1>
        <div class="detail-meta">
          <span class="detail-badge authority-badge">${update.authority || 'Unknown Authority'}</span>
          <span class="detail-badge urgency-${(update.urgency || 'low').toLowerCase()}">${update.urgency || 'Low'} Priority</span>
          <span class="detail-badge" style="background: #f3f4f6; color: #374151;">${formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)}</span>
        </div>
      </div>

      <div class="detail-content">
        ${update.impact
? `
        <div class="detail-section">
          <h3>Note Summary</h3>
          <p>${update.impact}</p>
        </div>
        `
: ''}

        ${update.business_impact_score
? `
        <div class="detail-section">
          <h3>Analytics Business Impact</h3>
          <p>Impact Score: <strong>${update.business_impact_score}/10</strong></p>
          ${update.business_impact_analysis ? `<p>${update.business_impact_analysis}</p>` : ''}
        </div>
        `
: ''}

        ${update.compliance_deadline || update.complianceDeadline
? `
        <div class="detail-section">
          <h3>Clock Compliance Deadline</h3>
          <p><strong>${formatDateDisplay(update.compliance_deadline || update.complianceDeadline)}</strong></p>
        </div>
        `
: ''}

        ${update.primarySectors?.length
? `
        <div class="detail-section">
          <h3>Firm Affected Sectors</h3>
          <p>${update.primarySectors.join(', ')}</p>
        </div>
        `
: ''}

        ${update.ai_tags?.length
? `
        <div class="detail-section">
          <h3>AI AI Analysis Tags</h3>
          <p>${update.ai_tags.join(', ')}</p>
        </div>
        `
: ''}

        <div class="detail-actions">
          ${update.url ? `<a href="${update.url}" target="_blank" class="btn btn-primary">Link View Original Source</a>` : ''}
          <a href="/dashboard" class="btn btn-secondary"><- Back to Dashboard</a>
        </div>
      </div>
    </div>
  </div>

  ${clientScripts}
</body>
</html>`

    res.send(html)
  } catch (error) {
    console.error('Detail page error:', error)
    res.status(500).send(`
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1>Error</h1>
        <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
        <a href="/dashboard" style="color: #3b82f6; text-decoration: none;"><- Back to Dashboard</a>
      </div>
    `)
  }
}

module.exports = renderUpdateDetailPage
