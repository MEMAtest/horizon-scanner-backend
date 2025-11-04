const puppeteer = require('puppeteer')
const dbService = require('../dbService')
const aiAnalyzer = require('../aiAnalyzer')

function applyHealthMethods(ServiceClass) {
  ServiceClass.prototype.healthCheck = async function() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        aiAnalyzer: false,
        networkConnectivity: false,
        puppeteer: false
      },
      stats: {
        activeRequests: this.activeRequests.size,
        rateLimiters: this.rateLimiters.size
      }
    }

    try {
      await dbService.initialize()
      health.checks.database = true
    } catch (error) {
      health.checks.database = false
    }

    try {
      health.checks.aiAnalyzer = typeof aiAnalyzer?.analyzeUpdate === 'function'
    } catch (error) {
      health.checks.aiAnalyzer = false
    }

    try {
      await this.makeRequest('https://www.google.com', { timeout: 5000 })
      health.checks.networkConnectivity = true
    } catch (error) {
      health.checks.networkConnectivity = false
    }

    try {
      const browser = await puppeteer.launch({ headless: 'new' })
      await browser.close()
      health.checks.puppeteer = true
    } catch (error) {
      health.checks.puppeteer = false
    }

    const allChecks = Object.values(health.checks)
    const healthyChecks = allChecks.filter(check => check === true)

    if (healthyChecks.length === allChecks.length) {
      health.status = 'healthy'
    } else if (healthyChecks.length > 0) {
      health.status = 'degraded'
    } else {
      health.status = 'unhealthy'
    }

    return health
  }
}

module.exports = applyHealthMethods
