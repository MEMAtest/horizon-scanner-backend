const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const applyBrowserMethods = require('./puppeteer/browser')
const applyFatfMethods = require('./puppeteer/fatf')
const applyAquisMethods = require('./puppeteer/aquis')
const applyLseMethods = require('./puppeteer/lse')
const applyPayUKMethods = require('./puppeteer/payuk')
const applyJMLSGMethods = require('./puppeteer/jmlsg')
const applyASAMethods = require('./puppeteer/asa')
const applyWolfsbergMethods = require('./puppeteer/wolfsberg')
const applyEgmontMethods = require('./puppeteer/egmont')
const applyEiopaMethods = require('./puppeteer/eiopa')
const applyIoscoMethods = require('./puppeteer/iosco')
const applyMiddleEastMethods = require('./puppeteer/middleeast')
const applyRBIMethods = require('./puppeteer/rbi')
const applyCIMAMethods = require('./puppeteer/cima')
const applySARBMethods = require('./puppeteer/sarb')
const applyAustraliaMethods = require('./puppeteer/australia')
const applyNCAMethods = require('./puppeteer/nca')
const applyFCADearCeoMethods = require('./puppeteer/fca-dear-ceo')
const applyPRASupervisoryMethods = require('./puppeteer/pra-supervisory')
const applyCBNMethods = require('./puppeteer/cbn')
const applyCBEMethods = require('./puppeteer/cbe')
const applyFSCSMethods = require('./puppeteer/fscs')
const applyNFRAMethods = require('./puppeteer/nfra')
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
applyWolfsbergMethods(PuppeteerScraper)
applyEgmontMethods(PuppeteerScraper)
applyEiopaMethods(PuppeteerScraper)
applyIoscoMethods(PuppeteerScraper)
applyMiddleEastMethods(PuppeteerScraper)
applyRBIMethods(PuppeteerScraper)
applyCIMAMethods(PuppeteerScraper)
applySARBMethods(PuppeteerScraper)
applyAustraliaMethods(PuppeteerScraper)
applyNCAMethods(PuppeteerScraper)
applyFCADearCeoMethods(PuppeteerScraper)
applyPRASupervisoryMethods(PuppeteerScraper)
applyCBNMethods(PuppeteerScraper)
applyCBEMethods(PuppeteerScraper)
applyFSCSMethods(PuppeteerScraper)
applyNFRAMethods(PuppeteerScraper)
applyOrchestratorMethods(PuppeteerScraper)

module.exports = new PuppeteerScraper()
