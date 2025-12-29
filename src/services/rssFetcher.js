const Parser = require('rss-parser')
const axios = require('axios')
const cheerio = require('cheerio')

const aiAnalyzer = require('./aiAnalyzer')
const dbService = require('./dbService')
const {
  scrapeFATF,
  scrapeFCA,
  scrapeSFO,
  scrapePensionRegulator,
  scrapeICO,
  scrapeFRC,
  scrapeFOS,
  scrapeJMLSG,
  scrapeBoE,
  scrapePRA,
  scrapeEBA,
  // New regulators - December 2025
  scrapeGamblingCommission,
  scrapeHSE,
  scrapeOfcom,
  scrapeSRA,
  normalizeAuthority
} = require('./webScraper')
const puppeteerScraper = require('../scrapers/puppeteerScraper')

const { feedSources } = require('./rss/config')
const applyUtilityMethods = require('./rss/utils')
const applyRssMethods = require('./rss/rss')
const applyWebMethods = require('./rss/web')
const applyPuppeteerMethods = require('./rss/puppeteer')
const applyPersistenceMethods = require('./rss/persistence')
const applyOrchestratorMethods = require('./rss/orchestrator')

class EnhancedRSSFetcher {
  constructor() {
    this.parser = new Parser({
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    this.fetchTimeout = 15000
    this.maxConcurrentProcessing = 3
    this.processingStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      startTime: null,
      rssSuccess: 0,
      webScrapingSuccess: 0,
      aiAnalysisSuccess: 0,
      puppeteerSuccess: 0
    }

    this.feedSources = feedSources
    this.activeFeedCount = this.feedSources.filter(source => source.priority !== 'disabled').length
    this.rssFeedCount = this.feedSources.filter(source => source.type === 'rss' && source.priority !== 'disabled').length
    this.webScrapingCount = this.feedSources.filter(source => source.type === 'web_scraping' && source.priority !== 'disabled').length
    this.puppeteerCount = this.feedSources.filter(source => source.type === 'puppeteer' && source.priority !== 'disabled').length

    console.log('📡 Enhanced RSS Fetcher initialized')
    console.log(`✅ Configured ${this.activeFeedCount} active sources:`)
    console.log(`   📰 ${this.rssFeedCount} RSS feeds`)
    console.log(`   🌐 ${this.webScrapingCount} web scraping sources`)
    console.log(`   🤖 ${this.puppeteerCount} Puppeteer sources`)
    console.log('   🎯 Dedicated scrapers: FATF, FCA, SFO, TPR, ICO, FRC, FOS, JMLSG, BoE, PRA, EBA')
    console.log('   🚀 Puppeteer scrapers: FATF, Aquis Exchange, LSE')
  }

  async initialize() {
    this.isInitialized = true
    return true
  }

  getActiveFeedCount() {
    return this.activeFeedCount
  }

  getFeedSources() {
    return this.feedSources
      .filter(source => source.priority !== 'disabled')
      .map(source => ({
        name: source.name,
        authority: source.authority,
        type: source.type,
        priority: source.priority,
        description: source.description,
        sectors: source.sectors || [],
        recencyDays: source.recencyDays || 7,
        url: source.url.substring(0, 100) + (source.url.length > 100 ? '...' : '')
      }))
  }

  getStatistics() {
    return {
      totalSources: this.activeFeedCount,
      rssSources: this.rssFeedCount,
      webScrapingSources: this.webScrapingCount,
      processingStats: this.processingStats
    }
  }

  async checkUpdateExists(url) {
    if (!dbService.checkUpdateExists) {
      const updates = await dbService.getAllUpdates()
      return updates.some(u => u.url === url)
    }
    return await dbService.checkUpdateExists(url)
  }
}

applyUtilityMethods(EnhancedRSSFetcher)
applyRssMethods(EnhancedRSSFetcher, { axios, cheerio })
applyWebMethods(EnhancedRSSFetcher, {
  axios,
  cheerio,
  scrapeFATF,
  scrapeFCA,
  scrapeSFO,
  scrapePensionRegulator,
  scrapeICO,
  scrapeFRC,
  scrapeFOS,
  scrapeJMLSG,
  scrapeBoE,
  scrapePRA,
  scrapeEBA,
  // New regulators - December 2025
  scrapeGamblingCommission,
  scrapeHSE,
  scrapeOfcom,
  scrapeSRA,
  normalizeAuthority
})
applyPuppeteerMethods(EnhancedRSSFetcher, { puppeteerScraper })
applyPersistenceMethods(EnhancedRSSFetcher, { dbService, aiAnalyzer })
applyOrchestratorMethods(EnhancedRSSFetcher)

const enhancedRSSFetcher = new EnhancedRSSFetcher()

module.exports = enhancedRSSFetcher
module.exports.fetchAll = async () => {
  return await enhancedRSSFetcher.fetchAllFeeds()
}
