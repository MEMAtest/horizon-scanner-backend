export async function loadYearSummary(year, summaryEl) {
  try {
    // First try to get pre-generated summary
    const summaryRes = await fetch(`/api/publications/summary/${year}`)
    const summaryData = await summaryRes.json()

    if (summaryData.success && summaryData.data?.summary_html) {
      summaryEl.innerHTML = `
            <div class="summary-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Executive Summary
            </div>
            <div class="summary-text">${summaryData.data.summary_html}</div>
          `
    } else {
      // Generate a basic summary from the data
      this.generateBasicYearSummary(year, summaryEl)
    }
  } catch (err) {
    console.log('[publications] No AI summary available for', year)
    this.generateBasicYearSummary(year, summaryEl)
  }
}

export function generateBasicYearSummary(year, summaryEl) {
  const yearData = this.yearlyBreakdown?.find(y => y.year === year)
  if (!yearData) {
    summaryEl.innerHTML = ''
    return
  }

  // Get previous year for comparison
  const prevYearData = this.yearlyBreakdown?.find(y => y.year === year - 1)
  const actionChange = prevYearData?.totalCount > 0
    ? ((yearData.totalCount - prevYearData.totalCount) / prevYearData.totalCount * 100).toFixed(0)
    : null
  const fineChange = prevYearData?.totalFines > 0
    ? ((yearData.totalFines - prevYearData.totalFines) / prevYearData.totalFines * 100).toFixed(0)
    : null

  // Get top outcomes
  const outcomes = Object.entries(yearData.outcomes || {})
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)

  const outcomeLabels = {
    cancellation: 'cancellations',
    fine: 'financial penalties',
    prohibition: 'prohibition orders',
    restriction: 'restrictions',
    censure: 'public censures',
    warning: 'warnings',
    supervisory_notice: 'supervisory notices',
    public_statement: 'public statements',
    voluntary_requirement: 'voluntary requirements',
    other: 'other actions'
  }

  const topOutcomes = outcomes.map(([type, data]) =>
    `<strong>${data.count} ${outcomeLabels[type] || type}</strong>`
  ).join(', ')

  // Build comparison text
  let comparisonText = ''
  if (actionChange !== null) {
    const direction = actionChange > 0 ? 'increase' : 'decrease'
    comparisonText = ` This represents a <strong>${Math.abs(actionChange)}% ${direction}</strong> in enforcement activity compared to ${year - 1}`
    if (fineChange !== null) {
      const fineDirection = fineChange > 0 ? 'increase' : 'decrease'
      comparisonText += `, with total fines showing a <strong>${Math.abs(fineChange)}% ${fineDirection}</strong>`
    }
    comparisonText += '.'
  }

  // Biggest case with breach type
  const biggestNote = yearData.biggestCase
    ? `<div class="summary-highlight">
            <strong>📌 Largest Fine:</strong> ${yearData.biggestCase.entityName} received a
            <strong>${this.formatCurrency(yearData.biggestCase.fineAmount)}</strong> penalty
            ${yearData.biggestCase.breachType ? `for <em>${this.formatBreachType(yearData.biggestCase.breachType)}</em> failings` : ''}.
          </div>`
    : ''

  // Average fine calculation
  const avgFine = yearData.finesWithAmount > 0
    ? yearData.totalFines / yearData.finesWithAmount
    : 0

  summaryEl.innerHTML = `
        <div class="summary-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Executive Summary
        </div>
        <div class="summary-text">
          <p>In <strong>${year}</strong>, the FCA took <strong>${this.formatNumber(yearData.totalCount)} enforcement actions</strong>
          totalling <strong>${this.formatCurrency(yearData.totalFines)}</strong> in fines.${comparisonText}</p>

          <p><strong>Key Enforcement Actions:</strong> The primary outcomes included ${topOutcomes || 'various regulatory measures'}.
          ${avgFine > 0 ? `The average fine for penalized entities was <strong>${this.formatCurrency(avgFine)}</strong>.` : ''}</p>

          ${biggestNote}

          <p class="summary-insight"><strong>💡 Key Insight:</strong> ${this.generateYearInsight(yearData, prevYearData)}</p>
        </div>
      `
}

export function generateYearInsight(yearData, prevYearData) {
  // Determine the dominant trend
  const totalFines = yearData.totalFines || 0
  const prevFines = prevYearData?.totalFines || 0
  const actionCount = yearData.totalCount || 0
  const prevActions = prevYearData?.totalCount || 0

  if (actionCount > prevActions * 1.2 && totalFines > prevFines * 1.2) {
    return 'This year saw increased regulatory intensity across both enforcement volume and penalty amounts, suggesting heightened FCA scrutiny.'
  } else if (totalFines > prevFines * 1.5 && actionCount <= prevActions) {
    return 'Despite similar case volumes, significantly higher fines indicate the FCA is targeting more serious breaches or increasing penalty severity.'
  } else if (actionCount > prevActions * 1.3) {
    return 'The increased number of actions suggests expanded regulatory focus, with compliance teams advised to review recent enforcement themes.'
  } else if (totalFines < prevFines * 0.7) {
    return 'Lower fine totals may reflect successful industry remediation or a shift in FCA priorities toward non-financial enforcement outcomes.'
  } else {
    return 'Firms should review the specific breach types and outcomes to identify relevant compliance priorities for their operations.'
  }
}

export function formatBreachType(breachType) {
  const labels = {
    'PRINCIPLES': 'Principles for Business',
    'AML': 'Anti-Money Laundering',
    'SYSTEMS_CONTROLS': 'Systems and Controls',
    'MARKET_ABUSE': 'Market Abuse',
    'MIS_SELLING': 'Mis-selling',
    'CLIENT_MONEY': 'Client Money',
    'CONDUCT': 'Conduct',
    'PRUDENTIAL': 'Prudential',
    'FINANCIAL_CRIME': 'Financial Crime'
  }
  return labels[breachType] || breachType?.replace(/_/g, ' ').toLowerCase() || 'Unknown'
}
