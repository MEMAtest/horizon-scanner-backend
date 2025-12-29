const dbService = require('../../../services/dbService')

async function getRecentUpdateCounts() {
  try {
    const counts = await dbService.getUpdateCounts()
    return {
      total: counts.total || 0,
      highImpact: counts.highImpact || 0,
      today: counts.today || 0,
      todayChange: counts.todayChange || 0,
      thisWeek: counts.thisWeek || 0,
      unread: counts.unread || 0
    }
  } catch (error) {
    console.error('Error getting update counts:', error)
    return {
      total: 0,
      highImpact: 0,
      today: 0,
      todayChange: 0,
      thisWeek: 0,
      unread: 0
    }
  }
}

module.exports = { getRecentUpdateCounts }
