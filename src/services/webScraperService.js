const axios = require('axios')
const applyBaseMethods = require('./webScraper/base')
const applyFcaMethods = require('./webScraper/fca')
const applySimpleSourceMethods = require('./webScraper/simple')
const applyInternationalMethods = require('./webScraper/international')
const applyFatfMethods = require('./webScraper/fatf')
const applyProcessingMethods = require('./webScraper/processing')
const applyStatsMethods = require('./webScraper/stats')
const applyOrchestratorMethods = require('./webScraper/orchestrator')
const applyHealthMethods = require('./webScraper/health')

class WebScraperService {
  constructor() {
    this.processingStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      startTime: null,
      bySource: {},
      byType: {
        rss: 0,
        deepScraping: 0,
        international: 0,
        fatf: 0,
        fca: 0,
        simple: 0
      }
    }

    this.rateLimiters = new Map()
    this.retryQueues = new Map()
    this.activeRequests = new Set()

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0; +https://regulatory-scanner.com)'
      },
      maxRedirects: 5
    })

    this.fcaConfig = {
      baseUrl: 'https://www.fca.org.uk',
      authority: 'FCA',
      rateLimit: 2000,
      maxRetries: 3,
      scrapingTargets: {
        consultations: {
          name: 'Consultations',
          urls: [
            'https://www.fca.org.uk/publications/search-results?np_category=policy%20and%20guidance-consultation%20papers'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary',
            deadline: '.consultation-deadline, .deadline',
            status: '.consultation-status',
            documentType: '.search-result__type'
          },
          pagination: {
            nextPage: '.pagination .pagination__next',
            maxPages: 15
          }
        },
        policyStatements: {
          name: 'Policy Statements',
          urls: [
            'https://www.fca.org.uk/publications?category%5B%5D=policy-statement'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary',
            reference: '.search-result__reference'
          },
          pagination: {
            maxPages: 5
          }
        },
        guidance: {
          name: 'Guidance',
          urls: [
            'https://www.fca.org.uk/publications?category%5B%5D=guidance',
            'https://www.fca.org.uk/publications?category%5B%5D=finalised-guidance'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary'
          },
          pagination: {
            maxPages: 5
          }
        },
        speeches: {
          name: 'Speeches',
          urls: [
            'https://www.fca.org.uk/news/search-results?np_category=speeches'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary',
            speaker: '.search-result__speaker, .speaker'
          },
          pagination: {
            maxPages: 3
          }
        },
        newsAndUpdates: {
          name: 'News & Updates',
          urls: [
            'https://www.fca.org.uk/news',
            'https://www.fca.org.uk/news/search-results?np_category=press%20releases'
          ],
          selectors: {
            container: '.search-results, .news-list',
            items: '.search-result, .news-item',
            title: '.search-result__title a, .news-item__title a',
            url: '.search-result__title a, .news-item__title a',
            date: '.search-result__date, .news-item__date',
            summary: '.search-result__summary, .news-item__summary'
          },
          pagination: {
            maxPages: 5
          }
        },
        enforcementNotices: {
          name: 'Enforcement',
          urls: [
            'https://www.fca.org.uk/publications?category%5B%5D=enforcement'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary',
            firm: '.search-result__firm, .firm-name'
          },
          pagination: {
            maxPages: 3
          }
        }
      }
    }

    this.setupAxiosInterceptors()
  }
}

applyBaseMethods(WebScraperService)
applyFcaMethods(WebScraperService)
applySimpleSourceMethods(WebScraperService)
applyInternationalMethods(WebScraperService)
applyFatfMethods(WebScraperService)
applyProcessingMethods(WebScraperService)
applyStatsMethods(WebScraperService)
applyOrchestratorMethods(WebScraperService)
applyHealthMethods(WebScraperService)

module.exports = new WebScraperService()
