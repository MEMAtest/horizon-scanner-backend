export async function loadDeepInsights() {
  try {
    // Load all deep insight data in parallel
    const [
      caseStudiesRes,
      outcomeAnalysisRes,
      breachSummaryRes,
      handbookRes,
      findingsRes,
      yearlyBreakdownRes,
      reoffendersRes,
      ruleCitationsRes
    ] = await Promise.all([
      fetch('/api/publications/insights/case-studies?limit=5'),
      fetch('/api/publications/insights/outcome-analysis'),
      fetch('/api/publications/insights/breach-summary'),
      fetch('/api/publications/insights/handbook-stats?limit=12'),
      fetch('/api/publications/insights/common-findings?limit=10'),
      fetch('/api/publications/insights/yearly-breakdown'),
      fetch('/api/publications/insights/reoffenders?limit=50'),
      fetch('/api/publications/insights/rule-citations')
    ])

    const [caseStudies, outcomeAnalysis, breachSummary, handbook, findings, yearlyBreakdown, reoffenders, ruleCitations] = await Promise.all([
      caseStudiesRes.json(),
      outcomeAnalysisRes.json(),
      breachSummaryRes.json(),
      handbookRes.json(),
      findingsRes.json(),
      yearlyBreakdownRes.json(),
      reoffendersRes.json(),
      ruleCitationsRes.json()
    ])

    // Store data
    this.caseStudies = caseStudies.data || []
    this.outcomeAnalysis = outcomeAnalysis.data || { outcomes: [], total: 0, insight: null }
    this.ruleCitations = ruleCitations.data || []
    this.breachSummary = breachSummary.data || []
    this.handbookStats = handbook.data || []
    this.commonFindings = findings.data || []
    this.yearlyBreakdown = yearlyBreakdown.data || []
    this.reoffenders = reoffenders.data || []

    // Render all sections
    this.renderDeepQuickStats()
    this.renderOutcomeAnalysis()
    this.renderCommonFindings()
    this.renderCaseStudySpotlight()
    this.renderBreachTypeGrid()
    this.renderHandbookBars()
    this.renderDeepTakeaways()
    this.renderYearlyBreakdown()
    this.renderReoffenders()
    this.renderRiskIndicators()

  } catch (error) {
    console.error('[publications] Failed to load deep insights:', error)
  }
}
