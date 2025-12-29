function resolveReviewSchedule(data = {}) {
  const rawReviewMonths = data.reviewFrequencyMonths || data.review_frequency_months || null
  const rawReviewDays = data.reviewFrequencyDays || data.review_frequency_days || null
  const parsedReviewMonths = parseInt(rawReviewMonths)
  const parsedReviewDays = parseInt(rawReviewDays)
  const reviewMonths = Number.isFinite(parsedReviewMonths)
    ? parsedReviewMonths
    : Number.isFinite(parsedReviewDays)
      ? Math.max(1, Math.round(parsedReviewDays / 30))
      : 12

  const requestedNextReview = data.nextReviewDate || data.next_review_date || null
  const nextReview = new Date()
  nextReview.setMonth(nextReview.getMonth() + reviewMonths)
  const nextReviewDate = requestedNextReview
    ? new Date(requestedNextReview)
    : nextReview
  const nextReviewValue = Number.isNaN(nextReviewDate.getTime())
    ? nextReview.toISOString().split('T')[0]
    : nextReviewDate.toISOString().split('T')[0]

  return { reviewMonths, nextReviewValue }
}

function normalizePolicyUpdates(updates = {}) {
  const normalizedUpdates = { ...updates }
  if (normalizedUpdates.name === undefined && normalizedUpdates.title !== undefined) {
    normalizedUpdates.name = normalizedUpdates.title
  }
  if (normalizedUpdates.title === undefined && normalizedUpdates.name !== undefined) {
    normalizedUpdates.title = normalizedUpdates.name
  }
  if (normalizedUpdates.ownerName === undefined && normalizedUpdates.owner !== undefined) {
    normalizedUpdates.ownerName = normalizedUpdates.owner
  }
  if (normalizedUpdates.owner === undefined && normalizedUpdates.ownerName !== undefined) {
    normalizedUpdates.owner = normalizedUpdates.ownerName
  }
  if (normalizedUpdates.nextReviewDate === undefined && normalizedUpdates.next_review_date !== undefined) {
    normalizedUpdates.nextReviewDate = normalizedUpdates.next_review_date
  }
  if (normalizedUpdates.next_review_date === undefined && normalizedUpdates.nextReviewDate !== undefined) {
    normalizedUpdates.next_review_date = normalizedUpdates.nextReviewDate
  }

  return normalizedUpdates
}

function deriveNextVersionNumber(latestVersionNumber, changeSummary) {
  const parts = latestVersionNumber.split('.')
  if (changeSummary && changeSummary.toLowerCase().includes('major')) {
    return `${parseInt(parts[0]) + 1}.0`
  }
  return `${parts[0]}.${parseInt(parts[1] || 0) + 1}`
}

module.exports = {
  resolveReviewSchedule,
  normalizePolicyUpdates,
  deriveNextVersionNumber
}
