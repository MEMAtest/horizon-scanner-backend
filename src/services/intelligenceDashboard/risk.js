const { normalizeUrgency } = require('./updates')

function computeHighImpactScore(todayCount, averageCount) {
  if (todayCount === 0) return 0
  const ratio = averageCount > 0 ? todayCount / averageCount : 2
  return Math.min(10, Math.max(0, ratio * 5))
}

function computeUrgencyScore(updates) {
  if (!updates.length) return 0
  const weights = { High: 10, Medium: 6, Low: 2 }
  const total = updates.reduce((acc, update) => {
    const urgency = normalizeUrgency(update.urgency)
    return acc + (weights[urgency] || 2)
  }, 0)
  return Math.min(10, total / updates.length)
}

function computeAuthorityScore(todayCount, averageCount) {
  if (todayCount === 0) return 0
  const ratio = averageCount > 0 ? todayCount / averageCount : 2
  return Math.min(10, Math.max(0, ratio * 5))
}

function computeDeadlineScore(deadlinesCount) {
  if (deadlinesCount >= 3) return 10
  if (deadlinesCount >= 1) return 7
  return 3
}

function computeTaskScore(outstanding) {
  if (outstanding <= 0) return 2
  return Math.min(10, outstanding * 2)
}

function labelledRisk(score) {
  if (score >= 8) return 'Critical'
  if (score >= 5) return 'Elevated'
  return 'Stable'
}

function buildRiskComponents(details) {
  return [
    {
      label: 'Impact momentum',
      weight: 0.35,
      score: details.highImpactScore
    },
    {
      label: 'Urgency mix',
      weight: 0.20,
      score: details.urgencyScore
    },
    {
      label: 'Authority spread',
      weight: 0.15,
      score: details.authorityScore
    },
    {
      label: 'Deadline pressure',
      weight: 0.15,
      score: details.deadlineScore
    },
    {
      label: 'Open actions',
      weight: 0.15,
      score: details.taskScore
    }
  ]
}

module.exports = {
  computeHighImpactScore,
  computeUrgencyScore,
  computeAuthorityScore,
  computeDeadlineScore,
  computeTaskScore,
  labelledRisk,
  buildRiskComponents
}
