function getDeadlineUrgencyBonus(update) {
  const content = (update.headline + ' ' + update.impact + ' ' + (update.keyDates || '')).toLowerCase()
  const deadlineBonus = this.calculateDeadlineUrgency(content)

  console.log(`📅 Consultation deadline bonus: +${deadlineBonus} for "${update.headline.substring(0, 50)}..."`)
  return deadlineBonus
}

function calculateDeadlineUrgency(content) {
  // Extract potential deadline dates
  const datePatterns = [
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    /(\d{4})-(\d{1,2})-(\d{1,2})/g,
    /by\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi,
    /deadline\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi
  ]

  let closestDeadline = null
  const now = new Date()

  datePatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        const date = new Date(match)
        if (date > now && date < new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
          if (!closestDeadline || date < closestDeadline) {
            closestDeadline = date
          }
        }
      })
    }
  })

  if (!closestDeadline) {
    // Default bonus for consultations without clear deadlines
    return 5
  }

  // Calculate urgency based on days until deadline
  const daysUntilDeadline = (closestDeadline - now) / (1000 * 60 * 60 * 24)

  if (daysUntilDeadline <= 7) {
    return 20 // Very urgent - deadline within a week
  } else if (daysUntilDeadline <= 14) {
    return 15 // Urgent - deadline within two weeks
  } else if (daysUntilDeadline <= 30) {
    return 10 // Moderate urgency - deadline within a month
  } else if (daysUntilDeadline <= 60) {
    return 5 // Some urgency - deadline within two months
  }

  return 0 // No urgency bonus for distant deadlines
}

module.exports = {
  calculateDeadlineUrgency,
  getDeadlineUrgencyBonus
}
