import { getBreachIcon } from '../../modules/breachIcons.js'

export function renderBreachTypeGrid() {
  const container = document.getElementById('breach-type-grid')
  if (!container) return

  if (!this.breachSummary || this.breachSummary.length === 0) {
    container.innerHTML = '<div class="empty-deep">No breach data available</div>'
    return
  }

  const totalFines = this.breachSummary.reduce((sum, b) => sum + b.totalFines, 0)

  container.innerHTML = this.breachSummary.map(breach => {
    const finesPercent = totalFines > 0 ? ((breach.totalFines / totalFines) * 100).toFixed(1) : 0
    const icon = getBreachIcon(breach.breachType)
    return `
          <div class="breach-type-card" data-breach="${breach.breachType}">
            <div class="breach-type-header">
              <div class="breach-type-icon">${icon}</div>
              <div class="breach-type-info">
                <span class="breach-type-name">${this.formatBreachLabel(breach.breachType)}</span>
                <span class="breach-type-cases">${breach.caseCount} cases</span>
              </div>
            </div>
            <div class="breach-type-fines">
              <span class="breach-type-total">${this.formatCurrency(breach.totalFines)}</span>
              <span class="breach-type-pct">${finesPercent}% of all fines</span>
            </div>
            <div class="breach-type-example">
              <span class="breach-example-label">Largest:</span>
              ${breach.topCase?.entity || 'N/A'} - ${this.formatCurrency(breach.topCase?.fine || 0)}
            </div>
            <button class="breach-expand-btn">View Details</button>
          </div>
        `
  }).join('')

  // Initialize breach charts
  this.initBreachCharts()
}

export function initBreachCharts() {
  if (!this.breachSummary || this.breachSummary.length === 0) return

  // Destroy existing charts
  if (this.breachCharts) {
    Object.values(this.breachCharts).forEach(chart => chart?.destroy())
  }
  this.breachCharts = {}

  const breachColors = {
    PRINCIPLES: '#8b5cf6',
    AML: '#f97316',
    SYSTEMS_CONTROLS: '#3b82f6',
    MARKET_ABUSE: '#ef4444',
    MIS_SELLING: '#10b981',
    CLIENT_MONEY: '#f59e0b',
    CONDUCT: '#6366f1',
    PRUDENTIAL: '#14b8a6',
    FINANCIAL_CRIME: '#ec4899'
  }

  const getColor = (type) => breachColors[type] || '#64748b'

  // Sort breach data
  const sortedByCount = [...this.breachSummary].sort((a, b) => b.caseCount - a.caseCount).slice(0, 8)
  const sortedByFines = [...this.breachSummary].sort((a, b) => b.totalFines - a.totalFines).slice(0, 6)

  // Chart 1: Breach Distribution (Doughnut - simulating treemap visual)
  const treemapCtx = document.getElementById('breach-treemap-chart')
  if (treemapCtx) {
    this.breachCharts.treemap = new Chart(treemapCtx, {
      type: 'doughnut',
      data: {
        labels: sortedByCount.map(b => this.formatBreachLabel(b.breachType)),
        datasets: [{
          data: sortedByCount.map(b => b.caseCount),
          backgroundColor: sortedByCount.map(b => getColor(b.breachType)),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '50%',
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { size: 11 },
              padding: 8
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
                const pct = ((ctx.raw / total) * 100).toFixed(1)
                return `${ctx.label}: ${ctx.raw} cases (${pct}%)`
              }
            }
          }
        }
      }
    })
  }

  // Chart 2: Fines by Breach Type (Horizontal Bar)
  const finesCtx = document.getElementById('breach-fines-bar-chart')
  if (finesCtx) {
    this.breachCharts.fines = new Chart(finesCtx, {
      type: 'bar',
      data: {
        labels: sortedByFines.map(b => this.formatBreachLabel(b.breachType)),
        datasets: [{
          label: 'Total Fines',
          data: sortedByFines.map(b => b.totalFines),
          backgroundColor: sortedByFines.map(b => getColor(b.breachType)),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `£${(ctx.raw / 1000000).toFixed(1)}M in fines`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (val) => '£' + (val / 1000000).toFixed(0) + 'M'
            },
            grid: { display: false }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    })
  }
}

export async function showBreachDetail(breachType) {
  const panel = document.getElementById('breach-detail-panel')
  const content = document.getElementById('breach-detail-content')
  if (!panel || !content) return

  content.innerHTML = '<div class="loading-deep">Loading breach details...</div>'
  panel.style.display = 'block'

  try {
    const response = await fetch(`/api/publications/insights/breach-analysis/${encodeURIComponent(breachType)}`)
    const data = await response.json()

    if (!data.success || !data.data) {
      content.innerHTML = '<div class="empty-deep">Failed to load breach details</div>'
      return
    }

    const breach = data.data

    content.innerHTML = `
          <div class="breach-detail-header">
            <h3>${this.formatBreachLabel(breach.breachType)}</h3>
            <div class="breach-detail-stats">
              <div class="breach-stat">
                <span class="breach-stat-value">${breach.stats.totalCases}</span>
                <span class="breach-stat-label">Cases</span>
              </div>
              <div class="breach-stat">
                <span class="breach-stat-value">${this.formatCurrency(breach.stats.totalFines)}</span>
                <span class="breach-stat-label">Total Fines</span>
              </div>
              <div class="breach-stat">
                <span class="breach-stat-value">${this.formatCurrency(breach.stats.avgFine)}</span>
                <span class="breach-stat-label">Average</span>
              </div>
              <div class="breach-stat">
                <span class="breach-stat-value">${this.formatCurrency(breach.stats.maxFine)}</span>
                <span class="breach-stat-label">Largest</span>
              </div>
            </div>
          </div>

          ${breach.topHandbookRefs?.length > 0 ? `
            <div class="breach-detail-section">
              <h4>Common Handbook References</h4>
              <div class="handbook-ref-list">
                ${breach.topHandbookRefs.map(ref => `
                  <div class="handbook-ref-item">
                    <span class="handbook-ref-name">${this.escapeHtml(ref.ref)}</span>
                    <span class="handbook-ref-count">${ref.count} citations</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="breach-detail-section">
            <h4>Example Cases</h4>
            <div class="breach-examples-list">
              ${breach.examples?.map(ex => `
                <div class="breach-example-card">
                  <div class="breach-example-header">
                    <span class="breach-example-entity">${this.escapeHtml(ex.entity_name)}</span>
                    <span class="breach-example-fine">${this.formatCurrency(ex.fine_amount)}</span>
                  </div>
                  <div class="breach-example-year">${ex.year || 'N/A'}</div>
                  <div class="breach-example-summary">${this.escapeHtml(ex.ai_summary || 'No summary')}</div>
                </div>
              `).join('') || '<div class="empty-deep">No examples available</div>'}
            </div>
          </div>
        `
  } catch (error) {
    console.error('[publications] Failed to load breach details:', error)
    content.innerHTML = '<div class="empty-deep">Failed to load breach details</div>'
  }
}
