async function getEnforcementInsights() {
  try {
    return await this.aiService.generateInsights()
  } catch (error) {
    console.error('Error getting enforcement insights:', error)
    throw error
  }
}

module.exports = {
  getEnforcementInsights
}
