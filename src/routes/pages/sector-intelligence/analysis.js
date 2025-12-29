const {
  normalizeDateValue,
  getPublishedDate,
  isEnforcementUpdate,
  isConsultationUpdate,
  formatDate
} = require('./utils')

function calculateSectorStats(updates, sector) {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  const previousWeekStart = new Date(weekAgo)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)

  const recentUpdates = []
  const highImpactUpdates = []
  const enforcementUpdates = []
  const consultationUpdates = []
  const policyUpdates = []
  const timelineCandidates = []

  let currentWeek = 0
  let previousWeek = 0

  updates.forEach(update => {
    const published = getPublishedDate(update)
    if (published) {
      if (published >= weekAgo) currentWeek += 1
      else if (published >= previousWeekStart) previousWeek += 1
      if (published >= thisMonth) recentUpdates.push(update)
    }

    const impactScore = update.businessImpactScore || update.business_impact_score || 0
    const impactLevel = (update.impactLevel || update.impact_level || '').toLowerCase()
    if (impactLevel === 'significant' || impactScore >= 7) {
      highImpactUpdates.push(update)
    }

    if (isEnforcementUpdate(update)) enforcementUpdates.push(update)
    if (isConsultationUpdate(update)) consultationUpdates.push(update)
    if ((update.contentType || update.content_type || '').toLowerCase().includes('policy')) {
      policyUpdates.push(update)
    }

    const deadline = normalizeDateValue(update)
    if (deadline) {
      const diffDays = Math.round((deadline - now) / (1000 * 60 * 60 * 24))
      if (diffDays >= -5) {
        const severity = diffDays <= 14 ? 'critical' : diffDays <= 30 ? 'elevate' : 'monitor'
        const type = isConsultationUpdate(update)
          ? 'Consultation'
          : isEnforcementUpdate(update)
            ? 'Enforcement Follow-up'
            : 'Regulatory Milestone'
        const owner = type === 'Consultation'
          ? 'Policy & Public Affairs'
          : type === 'Enforcement Follow-up'
            ? 'Compliance & Legal'
            : 'Business Operations'

        timelineCandidates.push({
          title: update.headline || 'Regulatory deadline',
          authority: update.authority || 'Unknown Authority',
          deadline,
          daysUntil: diffDays,
          severity,
          type,
          owner,
          url: update.url || null
        })
      }
    }
  })

  const impactScores = updates
    .filter(update => update.businessImpactScore || update.business_impact_score)
    .map(update => update.businessImpactScore || update.business_impact_score)

  const avgImpactScore = impactScores.length > 0
    ? Math.round((impactScores.reduce((a, b) => a + b, 0) / impactScores.length) * 10) / 10
    : 0

  const baseScore = (updates.length * 2) +
    (highImpactUpdates.length * 10) +
    (recentUpdates.length * 5) +
    (avgImpactScore * 3)

  const enforcementWeight = enforcementUpdates.length * 8
  const consultationWeight = consultationUpdates.length * 6
  const velocityWeight = Math.max(0, currentWeek - previousWeek) * 4

  const rawScore = baseScore + enforcementWeight + consultationWeight + velocityWeight
  const pressureScore = Math.min(100, Math.round(rawScore))

  let riskLevel = 'Low'
  if (pressureScore > 70) riskLevel = 'High'
  else if (pressureScore > 40) riskLevel = 'Medium'

  const keyFindings = []
  if (highImpactUpdates.length > 0) {
    keyFindings.push(`${highImpactUpdates.length} high-impact regulatory changes affecting the sector`)
  }
  if (consultationUpdates.length > 0) {
    keyFindings.push(`${consultationUpdates.length} active consultation items to track`)
  }
  if (enforcementUpdates.length > 0) {
    keyFindings.push(`${enforcementUpdates.length} enforcement-related notices requiring response planning`)
  }
  if (currentWeek > previousWeek) {
    keyFindings.push(`Publication velocity up ${currentWeek - previousWeek} week over week`)
  }

  const driverCounts = {
    enforcement: enforcementUpdates.length,
    consultation: consultationUpdates.length,
    policy: policyUpdates.length
  }

  const driverTotal = driverCounts.enforcement + driverCounts.consultation + driverCounts.policy
  const driverShare = driverTotal > 0
    ? {
        enforcement: Math.round((driverCounts.enforcement / driverTotal) * 100),
        consultation: Math.round((driverCounts.consultation / driverTotal) * 100),
        policy: Math.round((driverCounts.policy / driverTotal) * 100)
      }
    : { enforcement: 0, consultation: 0, policy: 0 }

  const timeline = timelineCandidates
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 6)
    .map(item => ({
      title: item.title,
      authority: item.authority,
      deadline: formatDate(item.deadline),
      daysUntil: item.daysUntil,
      severity: item.severity,
      type: item.type,
      owner: item.owner,
      url: item.url
    }))

  const velocity = {
    currentWeek,
    previousWeek,
    trendLabel: currentWeek > previousWeek ? 'rising' : currentWeek < previousWeek ? 'cooling' : 'steady'
  }

  const playbookSuggestions = buildPlaybookSuggestions({
    riskLevel,
    consultationCount: consultationUpdates.length,
    enforcementCount: enforcementUpdates.length,
    timelineCount: timeline.length,
    velocityTrend: velocity.trendLabel,
    sector
  })

  const alertRules = buildAlertRules({
    sector,
    riskLevel,
    pressureScore,
    consultations: consultationUpdates.length,
    enforcement: enforcementUpdates.length,
    velocity
  })

  const priorities = []
  if (highImpactUpdates.length > 0) {
    priorities.push({
      title: 'Review High-Impact Changes',
      description: `Assess ${highImpactUpdates.length} significant regulatory updates for compliance gaps`
    })
  }
  if (recentUpdates.length > 5) {
    priorities.push({
      title: 'Monitor Recent Developments',
      description: `Track ${recentUpdates.length} recent updates for emerging requirements`
    })
  }
  priorities.push({
    title: 'Sector-Specific Training',
    description: `Ensure teams are updated on ${sector}-specific regulatory requirements`
  })

  return {
    totalUpdates: updates.length,
    highImpact: highImpactUpdates.length,
    recentActivity: recentUpdates.length,
    pressureScore,
    riskLevel,
    keyFindings: keyFindings.slice(0, 3),
    priorities: priorities.slice(0, 5),
    pressureDrivers: {
      counts: driverCounts,
      share: driverShare
    },
    timeline,
    playbookSuggestions,
    alertRules,
    velocity
  }
}

function buildPlaybookSuggestions(context) {
  const suggestions = []

  if (context.riskLevel === 'High') {
    suggestions.push({
      title: 'Activate Sector War Room',
      description: 'Schedule daily stand-up with compliance, legal, and business owners to coordinate response.',
      level: 'Critical'
    })
  } else if (context.riskLevel === 'Medium') {
    suggestions.push({
      title: 'Weekly Monitoring Cadence',
      description: 'Lock weekly review with sector stakeholders to track developing obligations.',
      level: 'Elevate'
    })
  }

  if (context.consultationCount > 0) {
    suggestions.push({
      title: 'Consultation Response Plan',
      description: 'Map accountable owners and draft response timeline for active consultations.',
      level: context.consultationCount >= 3 ? 'Elevate' : 'Monitor'
    })
  }

  if (context.enforcementCount > 0) {
    suggestions.push({
      title: 'Enforcement Readiness',
      description: 'Brief legal/compliance on enforcement notices impacting this sector and identify exposures.',
      level: 'Elevate'
    })
  }

  if (context.timelineCount > 0) {
    suggestions.push({
      title: 'Deadline Ownership Check',
      description: 'Confirm accountable owners and evidence for upcoming sector deadlines.',
      level: 'Monitor'
    })
  }

  if (context.velocityTrend === 'rising') {
    suggestions.push({
      title: 'Increase Analyst Coverage',
      description: 'Allocate additional analyst hours to manage surge in sector updates.',
      level: 'Elevate'
    })
  }

  return suggestions.slice(0, 4)
}

function buildAlertRules(context) {
  return [
    {
      title: 'Pressure score crosses 70',
      detail: 'Send immediate alert to sector leadership and compliance mailbox.',
      severity: context.pressureScore >= 70 ? 'High' : 'Medium'
    },
    {
      title: 'New consultation due within 30 days',
      detail: 'Notify policy/operations leads to trigger response workflow.',
      severity: context.consultations > 0 ? 'Medium' : 'Low'
    },
    {
      title: 'Enforcement notice published for sector firms',
      detail: 'Escalate to legal for case review and remediation tracking.',
      severity: context.enforcement > 0 ? 'Medium' : 'Low'
    },
    {
      title: 'Velocity spike week-over-week',
      detail: 'Ping sector channel if weekly updates exceed prior period.',
      severity: context.velocity.trendLabel === 'rising' ? 'Medium' : 'Low'
    }
  ]
}

module.exports = {
  calculateSectorStats,
  buildPlaybookSuggestions,
  buildAlertRules
}
