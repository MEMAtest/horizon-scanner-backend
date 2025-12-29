const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const applyBrowserMethods = require('./puppeteer/browser')
const applyFatfMethods = require('./puppeteer/fatf')
const applyAquisMethods = require('./puppeteer/aquis')
const applyLseMethods = require('./puppeteer/lse')
const applyPayUKMethods = require('./puppeteer/payuk')
const applyJMLSGMethods = require('./puppeteer/jmlsg')
const applyASAMethods = require('./puppeteer/asa')
const applyUtilityMethods = require('./puppeteer/utils')
const applyOrchestratorMethods = require('./puppeteer/orchestrator')

puppeteer.use(StealthPlugin())

class PuppeteerScraper {
  constructor() {
    this.browser = null
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    }
  }
}

applyUtilityMethods(PuppeteerScraper)
applyBrowserMethods(PuppeteerScraper, puppeteer)
applyFatfMethods(PuppeteerScraper)
applyAquisMethods(PuppeteerScraper)
applyLseMethods(PuppeteerScraper)
applyPayUKMethods(PuppeteerScraper)
applyJMLSGMethods(PuppeteerScraper)
applyASAMethods(PuppeteerScraper)
applyOrchestratorMethods(PuppeteerScraper)

module.exports = new PuppeteerScraper()
