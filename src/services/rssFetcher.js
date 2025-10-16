// src/services/rssFetcher.js
// ENTERPRISE RSS & WEB FETCHER: Integrates Dedicated Scrapers + Enhanced Analytics + Content Processing
// ENHANCED: Multi-source data pipeline with intelligent content validation and AI analysis

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
  normalizeAuthority
} = require('./webScraper')
const puppeteerScraper = require('../scrapers/puppeteerScraper')

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
    this.maxConcurrentProcessing = 3
    this.processingStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      startTime: null,
      rssSuccess: 0,
      webScrapingSuccess: 0,
      aiAnalysisSuccess: 0
    }

    // Enhanced RSS feed configurations with all requested feeds
    this.feedSources = [
      // PRIMARY RSS FEEDS - UK Regulators
      {
        name: 'FCA News RSS',
        authority: 'FCA',
        url: 'https://www.fca.org.uk/news/rss.xml',
        type: 'rss',
        description: 'Financial Conduct Authority - News, Press Releases, Speeches, Statements',
        priority: 'high',
        recencyDays: 30, // Added configurable recency window
        sectors: ['Banking', 'Investment Management', 'Consumer Credit', 'Insurance']
      },
      {
        name: 'Bank of England News RSS',
        authority: 'Bank of England',
        url: 'https://www.bankofengland.co.uk/rss/news',
        type: 'rss',
        description: 'Bank of England - News and Speeches',
        priority: 'high',
        recencyDays: 30, // Added configurable recency window
        sectors: ['Banking', 'Capital Markets', 'Payments', 'Fintech']
      },

      // INTERNATIONAL RSS FEEDS - European & Global
      {
        name: 'ESMA All News',
        authority: 'ESMA',
        url: 'https://www.esma.europa.eu/rss.xml',
        type: 'rss',
        description: 'European Securities and Markets Authority - Full Press/News Feed',
        priority: 'high',
        recencyDays: 30, // Added configurable recency window
        sectors: ['Capital Markets', 'Investment Management', 'Cryptocurrency']
      },
      {
        name: 'FSB Publications',
        authority: 'FSB',
        url: 'https://www.fsb.org/feed/',
        type: 'rss',
        description: 'Financial Stability Board - Global Policy & Press Updates',
        priority: 'high',
        recencyDays: 30, // Added configurable recency window
        sectors: ['Banking', 'Capital Markets', 'Fintech', 'Cryptocurrency']
      },

      {
        name: 'FATF News & Publications',
        authority: 'FATF',
        url: 'https://www.fatf-gafi.org/en/the-fatf/news.html',
        type: 'puppeteer',
        description: 'Financial Action Task Force - News and Publications (Puppeteer)',
        priority: 'high',
        recencyDays: 30,
        sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
      },
      {
        name: 'Aquis Exchange Announcements',
        authority: 'AQUIS',
        url: 'https://www.aquis.eu/stock-exchange/announcements',
        type: 'puppeteer',
        description: 'Aquis Stock Exchange - Company Announcements',
        priority: 'medium',
        recencyDays: 30,
        sectors: ['Capital Markets', 'Listed Companies', 'Market News']
      },
      {
        name: 'London Stock Exchange News',
        authority: 'LSE',
        url: 'https://www.londonstockexchange.com/discover/news-and-insights?tab=latest',
        type: 'puppeteer',
        description: 'London Stock Exchange - Latest News and Insights',
        priority: 'medium',
        recencyDays: 30,
        sectors: ['Capital Markets', 'Market News', 'Investment']
      },
      // EXISTING RSS FEEDS
      {
        name: 'HMRC Updates RSS',
        authority: 'HMRC',
        url: 'https://www.gov.uk/government/organisations/hm-revenue-customs.atom',
        type: 'rss',
        description: 'HM Revenue & Customs Updates',
        priority: 'medium',
        recencyDays: 14, // Added configurable recency window
        sectors: ['Tax', 'AML & Financial Crime']
      },
      {
        name: 'Gov.UK Financial Services',
        authority: 'HM Government',
        url: 'https://www.gov.uk/search/news-and-communications.atom?keywords=financial+services',
        type: 'rss',
        description: 'UK Government Financial Services News',
        priority: 'medium',
        recencyDays: 14, // Added configurable recency window
        sectors: ['General', 'Banking', 'Insurance']
      },

      // WEB SCRAPING FALLBACKS - For sources without RSS feeds
      {
        name: 'TPR Updates',
        authority: 'The Pensions Regulator',
        url: 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases',
        type: 'web_scraping',
        selector: '.listing__item',
        titleSelector: '.listing__item-title a',
        linkSelector: '.listing__item-title a',
        dateSelector: '.listing__item-date',
        summarySelector: '.listing__item-summary',
        priority: 'medium',
        recencyDays: 30, // Added configurable recency window
        sectors: ['Pensions']
      },
      {
        name: 'SFO Press Releases',
        authority: 'Serious Fraud Office',
        url: 'https://www.sfo.gov.uk/press-room/',
        type: 'web_scraping',
        selector: '.news-item',
        titleSelector: '.news-item__title a',
        linkSelector: '.news-item__title a',
        dateSelector: '.news-item__date',
        summarySelector: '.news-item__excerpt',
        priority: 'medium',
        recencyDays: 30, // Added configurable recency window
        sectors: ['AML & Financial Crime', 'Banking']
      },
      {
        name: 'CMA News',
        authority: 'Competition and Markets Authority',
        url: 'https://www.gov.uk/search/news-and-communications?organisations%5B%5D=competition-and-markets-authority',
        type: 'web_scraping',
        selector: '.gem-c-document-list__item',
        titleSelector: '.gem-c-document-list__item-title a',
        linkSelector: '.gem-c-document-list__item-title a',
        dateSelector: '.gem-c-document-list__item-metadata',
        summarySelector: '.gem-c-document-list__item-description',
        priority: 'low',
        recencyDays: 14, // Added configurable recency window
        sectors: ['Competition', 'Consumer Protection']
      },
      {
        name: 'ICO News',
        authority: 'ICO',
        url: 'https://ico.org.uk/about-the-ico/media-centre/',
        type: 'web_scraping',
        selector: '.news-item',
        titleSelector: '.news-item__title a',
        linkSelector: '.news-item__title a',
        dateSelector: '.news-item__date',
        summarySelector: '.news-item__excerpt',
        priority: 'medium',
        recencyDays: 14, // Added configurable recency window
        sectors: ['Data Protection', 'Privacy']
      },
      {
        name: 'FRC News',
        authority: 'FRC',
        url: 'https://www.frc.org.uk/news-and-events/news',
        type: 'web_scraping',
        selector: '.news-listing__item',
        titleSelector: '.news-listing__title a',
        linkSelector: '.news-listing__title a',
        dateSelector: '.news-listing__date',
        summarySelector: '.news-listing__summary',
        priority: 'low',
        recencyDays: 14, // Added configurable recency window
        sectors: ['Audit & Accounting', 'Professional Services']
      },
      {
        name: 'JMLSG News',
        authority: 'JMLSG',
        url: 'https://www.jmlsg.org.uk/latest-news/',
        type: 'web_scraping',
        description: 'Joint Money Laundering Steering Group - Latest News',
        priority: 'high',
        recencyDays: 30,
        sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
      },
      {
        name: 'Financial Ombudsman Service News',
        authority: 'FOS',
        url: 'https://www.financial-ombudsman.org.uk/news',
        type: 'web_scraping',
        description: 'Financial Ombudsman Service - News and Updates',
        priority: 'medium',
        recencyDays: 30,
        sectors: ['Consumer Protection', 'Dispute Resolution', 'Financial Services']
      },

      // Demo feed for development
      {
        name: 'Demo Regulatory Updates',
        authority: 'Demo Authority',
        url: 'demo',
        type: 'demo',
        priority: 'disabled',
        recencyDays: 7
      }
    ]

    this.activeFeedCount = this.feedSources.filter(source => source.priority !== 'disabled').length
    this.rssFeedCount = this.feedSources.filter(source => source.type === 'rss' && source.priority !== 'disabled').length
    this.webScrapingCount = this.feedSources.filter(source => source.type === 'web_scraping' && source.priority !== 'disabled').length
    this.puppeteerCount = this.feedSources.filter(source => source.type === 'puppeteer' && source.priority !== 'disabled').length

    console.log('📡 Enhanced RSS Fetcher initialized')
    console.log(`✅ Configured ${this.activeFeedCount} active sources:`)
    console.log(`   📰 ${this.rssFeedCount} RSS feeds`)
    console.log(`   🌐 ${this.webScrapingCount} web scraping sources`)
    console.log(`   🤖 ${this.puppeteerCount} Puppeteer sources`)
    console.log('   🎯 Dedicated scrapers: FATF, FCA, SFO, TPR')
    console.log('   🚀 Puppeteer scrapers: FATF, Aquis Exchange, LSE')
  }

  async initialize() {
    this.isInitialized = true
    return true
  }

  async fetchAllFeeds(options = {}) {
    const { fastMode = false, timeout = null } = options

    if (!this.isInitialized) {
      await this.initialize()
    }

    console.log(`📡 Starting ${fastMode ? 'fast-mode ' : ''}regulatory updates fetch...`)
    this.processingStats.startTime = Date.now()

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      newUpdates: 0,
      errors: [],
      bySource: {}
    }

    // Sort feeds by priority and filter for fast mode
    const sortedFeeds = this.feedSources
      .filter(source => {
        if (source.priority === 'disabled') return false
        // In fast mode, skip slow Puppeteer scrapers
        if (fastMode && source.type === 'puppeteer') {
          console.log(`⚡ Fast mode: Skipping slow source ${source.name}`)
          return false
        }
        return true
      })
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

    for (const source of sortedFeeds) {
      try {
        console.log(`📡 Fetching from ${source.name} (${source.authority}) - ${source.type.toUpperCase()}...`)

        const updates = await this.fetchFromSource(source)

        if (updates && updates.length > 0) {
          const savedCount = await this.saveUpdates(updates, source)
          results.newUpdates += savedCount
          results.successful++

          if (source.type === 'rss') {
            this.processingStats.rssSuccess++
          } else if (source.type === 'web_scraping') {
            this.processingStats.webScrapingSuccess++
          } else if (source.type === 'puppeteer') {
            this.processingStats.puppeteerSuccess = (this.processingStats.puppeteerSuccess || 0) + 1
          }

          results.bySource[source.name] = {
            fetched: updates.length,
            saved: savedCount,
            type: source.type,
            authority: source.authority
          }

          console.log(`✅ ${source.name}: ${updates.length} fetched, ${savedCount} new`)
        } else {
          console.log(`⚠️ ${source.name}: No updates found`)
          results.successful++
        }

        results.total++

        // Add delay between requests to be respectful
        await this.delay(1000)
      } catch (error) {
        console.error(`❌ Failed to fetch from ${source.name}:`, error.message)
        results.failed++
        results.total++
        results.errors.push({
          source: source.name,
          error: error.message,
          type: source.type
        })
        this.processingStats.errors++
      }
    }

    const duration = ((Date.now() - this.processingStats.startTime) / 1000).toFixed(2)
    console.log(`\n📊 Fetch completed in ${duration}s:`)
    console.log(`   📰 RSS feeds: ${this.processingStats.rssSuccess}/${this.rssFeedCount} successful`)
    console.log(`   🌐 Web scraping: ${this.processingStats.webScrapingSuccess}/${this.webScrapingCount} successful`)
    console.log(`   🤖 Puppeteer: ${this.processingStats.puppeteerSuccess || 0}/${this.puppeteerCount} successful`)
    console.log(`   ✅ Total: ${results.successful}/${results.total} sources processed`)
    console.log(`   🆕 New updates: ${results.newUpdates}`)

    return results
  }

  async fetchFromSource(source) {
    switch (source.type) {
      case 'rss':
        return await this.fetchRSSFeed(source)
      case 'web_scraping':
        return await this.fetchWebScraping(source)
      case 'puppeteer':
        return await this.fetchPuppeteer(source)
      case 'demo':
        return await this.generateDemoUpdates(source)
      default:
        throw new Error(`Unknown source type: ${source.type}`)
    }
  }

  async fetchRSSFeed(source) {
    try {
      const response = await axios.get(source.url, {
        timeout: this.fetchTimeout || 15000,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
        }
      })

      const $ = cheerio.load(response.data, { xmlMode: true })
      const updates = []

      // Handle both RSS and Atom feeds
      const items = $('item, entry')

      items.each((index, element) => {
        try {
          if (index >= 20) return false // Limit to 20 items per source

          const $item = $(element)

          // RSS vs Atom field mappings
          const title = $item.find('title').text().trim()
          const link = $item.find('link').text().trim() ||
                               $item.find('link').attr('href') ||
                               $item.find('id').text().trim() // Atom uses id for link sometimes

          const description = $item.find('description, summary, content').text().trim()
          const pubDate = $item.find('pubDate, published, updated').text().trim()

          // Extract categories/tags if available
          const categories = []
          $item.find('category').each((i, cat) => {
            const catText = $(cat).text().trim() || $(cat).attr('term')
            if (catText) categories.push(catText)
          })

          if (title && link) {
            const parsedDate = this.parseDate(pubDate)

            // Check if the item is within the recency window
            if (this.isRecent(parsedDate, source.recencyDays || 30)) {
              updates.push({
                headline: this.cleanText(title),
                summary: this.cleanText(description),
                url: this.normalizeUrl(link, source.url),
                authority: source.authority,
                publishedDate: parsedDate,
                source: source.name,
                feedType: 'rss',
                categories,
                sectors: source.sectors || []
              })
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing RSS item from ${source.name}:`, error.message)
        }
      })

      return updates
    } catch (error) {
      console.error(`❌ RSS fetch failed for ${source.name}:`, error.message)
      throw error
    }
  }

  async fetchWebScraping(source) {
    try {
      console.log(`🌐 Web scraping for ${source.name} (${source.authority})...`)

      // Use dedicated scrapers based on authority
      let scraperResults = []

      switch (source.authority) {
        case 'FATF':
          scraperResults = await scrapeFATF()
          break
        case 'FCA':
          scraperResults = await scrapeFCA()
          break
        case 'SFO':
        case 'Serious Fraud Office':
          scraperResults = await scrapeSFO()
          break
        case 'TPR':
        case 'The Pensions Regulator':
          scraperResults = await scrapePensionRegulator()
          break
          // ADD THESE NEW CASES:
        case 'ICO':
        case 'Information Commissioner\'s Office':
          scraperResults = await scrapeICO()
          break
        case 'FRC':
        case 'Financial Reporting Council':
          scraperResults = await scrapeFRC()
          break
        case 'FOS':
        case 'Financial Ombudsman Service':
          scraperResults = await scrapeFOS()
          break
        case 'JMLSG':
        case 'Joint Money Laundering Steering Group':
          scraperResults = await scrapeJMLSG()
          break
        case 'BoE':
        case 'Bank of England':
          scraperResults = await scrapeBoE('BoE')
          break
        case 'PRA':
        case 'Prudential Regulation Authority':
          scraperResults = await scrapePRA()
          break
        case 'EBA':
        case 'European Banking Authority':
          scraperResults = await scrapeEBA()
          break
        default:
          console.log(`⚠️ No dedicated scraper for ${source.authority}, using generic HTML parsing`)
          return await this.genericWebScraping(source)
      }

      // Transform scraper results to match our expected format
      if (scraperResults && scraperResults.length > 0) {
        console.log(`✅ ${source.name}: Found ${scraperResults.length} items via dedicated scraper`)

        return scraperResults.map(item => ({
          headline: item.title || item.headline,
          summary: item.summary || `${source.authority} update: ${item.title}`, // Now uses actual summary from scraper
          url: item.url || item.link,
          authority: normalizeAuthority(item.authority || source.authority), // Added normalization
          publishedDate: item.publishedDate || new Date(item.pubDate),
          source: source.name,
          feedType: 'web_scraping',
          sectors: source.sectors || []
        }))
      }

      console.log(`⚠️ No results from dedicated scraper for ${source.name}`)
      return []
    } catch (error) {
      console.error(`❌ Web scraping failed for ${source.name}:`, error.message)

      // Try generic scraping as last resort
      try {
        return await this.genericWebScraping(source)
      } catch (fallbackError) {
        console.error(`❌ Generic scraping also failed for ${source.name}:`, fallbackError.message)
        return []
      }
    }
  }

  async fetchPuppeteer(source) {
    try {
      console.log(`🤖 Puppeteer scraping for ${source.name} (${source.authority})...`)

      let scraperResults = []

      // Route to correct Puppeteer scraper method
      switch (source.authority) {
        case 'FATF':
          scraperResults = await puppeteerScraper.scrapeFATF()
          break
        case 'AQUIS':
        case 'Aquis Exchange':
          scraperResults = await puppeteerScraper.scrapeAquis()
          break
        case 'LSE':
        case 'London Stock Exchange':
          scraperResults = await puppeteerScraper.scrapeLSE()
          break
        default:
          console.log(`⚠️ No Puppeteer scraper configured for ${source.authority}`)
          return []
      }

      console.log(`✅ ${source.name}: Found ${scraperResults.length} items via Puppeteer`)
      return scraperResults
    } catch (error) {
      console.error(`❌ Puppeteer scraping failed for ${source.name}:`, error.message)
      return []
    }
  }

  async genericWebScraping(source) {
    try {
      const response = await axios.get(source.url, {
        timeout: this.fetchTimeout || 15000,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })

      const $ = cheerio.load(response.data)
      return this.parseWebScrapingContent($, source)
    } catch (error) {
      console.error('❌ Generic web scraping failed:', error.message)
      throw error
    }
  }

  parseWebScrapingContent($, source) {
    const updates = []

    $(source.selector).each((index, element) => {
      try {
        if (index >= 20) return false // Limit to 20 items per source

        const $item = $(element)

        const title = $item.find(source.titleSelector).text().trim() ||
                             $item.find(source.titleSelector).attr('title') || ''

        const link = $item.find(source.linkSelector).attr('href') || ''

        const summary = source.summarySelector
          ? $item.find(source.summarySelector).text().trim()
          : ''

        const date = source.dateSelector
          ? $item.find(source.dateSelector).text().trim()
          : ''

        if (title && link) {
          const parsedDate = this.parseDate(date)

          // Check if the item is within the recency window
          if (this.isRecent(parsedDate, source.recencyDays || 30)) {
            updates.push({
              headline: this.cleanText(title),
              summary: this.cleanText(summary),
              url: this.normalizeUrl(link, source.url),
              authority: source.authority,
              publishedDate: parsedDate,
              source: source.name,
              feedType: 'web_scraping',
              sectors: source.sectors || []
            })
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error parsing web scraping item from ${source.name}:`, error.message)
      }
    })

    return updates
  }

  async saveUpdates(updates, source) {
    let savedCount = 0

    for (const update of updates) {
      try {
        // Check if update already exists
        const exists = await dbService.checkUpdateExists(update.url)
        if (exists) {
          continue
        }

        // Enhance update with AI analysis if available
        if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
          try {
            const analysisResult = await aiAnalyzer.analyzeUpdate(update)
            const aiData = analysisResult?.data || analysisResult

            if (analysisResult?.success && aiData) {
              update.aiAnalysis = aiData
              update.businessImpact = analysisResult.businessImpact || aiData.ai_summary
              update.confidence = analysisResult.confidence || aiData.ai_confidence_score
              update.sectors = analysisResult.sectors || aiData.primarySectors || update.sectors
              update.category = analysisResult.category || aiData.area
              update.urgency = analysisResult.urgency || aiData.urgency

              update.ai_summary = aiData.ai_summary
              update.impactLevel = aiData.impactLevel
              update.impact_level = aiData.impactLevel
              update.businessImpactScore = aiData.businessImpactScore
              update.business_impact_score = aiData.business_impact_score
              update.ai_tags = aiData.ai_tags
              update.aiTags = aiData.aiTags
              update.ai_confidence_score = aiData.ai_confidence_score
              update.sector = aiData.sector || update.sector
              update.primarySectors = aiData.primarySectors
              update.primary_sectors = aiData.primary_sectors
              update.complianceDeadline = aiData.complianceDeadline
              update.compliance_deadline = aiData.compliance_deadline
              update.sectorRelevanceScores = aiData.sectorRelevanceScores
              update.sector_relevance_scores = aiData.sector_relevance_scores
              update.implementationPhases = aiData.implementationPhases
              update.implementation_phases = aiData.implementation_phases
              update.requiredResources = aiData.requiredResources
              update.required_resources = aiData.required_resources
              update.firmTypesAffected = aiData.firmTypesAffected
              update.firm_types_affected = aiData.firm_types_affected
              update.area = aiData.area || update.area
              update.content_type = aiData.content_type || update.content_type
              update.contentType = aiData.contentType || update.contentType
              update.aiModelUsed = aiData.aiModelUsed
              update.enhancedAt = aiData.enhancedAt

              this.processingStats.aiAnalysisSuccess++
            }
          } catch (aiError) {
            console.warn('⚠️ AI analysis failed for update:', aiError.message)
          }
        }

        // Add fetchedDate field for consistency
        update.fetchedDate = update.fetchedDate || new Date()

        // Save update to database
        await dbService.saveUpdate(update)
        savedCount++
        this.processingStats.processed++
      } catch (error) {
        console.error('❌ Failed to save update:', error.message)
        this.processingStats.errors++
      }
    }

    return savedCount
  }

  async generateDemoUpdates(source) {
    // Demo updates for testing
    const demoUpdates = [
      {
        headline: 'Demo: New Banking Regulations Announced',
        summary: 'This is a demo update showing new banking regulations...',
        url: 'https://demo.example.com/update1',
        authority: 'Demo Authority',
        publishedDate: new Date(),
        source: source.name,
        feedType: 'demo'
      }
    ]
    return demoUpdates
  }

  // DEDICATED FATF SCRAPER using JSON API
  async scrapeFATFDirect(source) {
    console.log('🔍 FATF: Using Puppeteer to bypass CloudFlare')

    const puppeteer = require('puppeteer')
    let browser

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setUserAgent(this.userAgent)

      // Try the main news/publications page
      console.log('📄 FATF: Loading FATF publications page via Puppeteer...')
      await page.goto('https://www.fatf-gafi.org/en/publications.html', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      // Wait for CloudFlare and content to load
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Wait for content container
      try {
        await page.waitForSelector('main, .content, [role="main"]', {
          timeout: 5000
        })
      } catch (e) {
        console.log('⚠️ Main content not found immediately')
      }

      // Extract news items - based on the actual HTML structure from the image
      const newsItems = await page.evaluate(() => {
        const items = []
        const monthMap = {
          Jan: '01',
          Feb: '02',
          Mar: '03',
          Apr: '04',
          May: '05',
          Jun: '06',
          Jul: '07',
          Aug: '08',
          Sep: '09',
          Oct: '10',
          Nov: '11',
          Dec: '12'
        }

        // Look for the table/list structure shown in the image
        const rows = document.querySelectorAll('tr, .publication-row, .news-item')

        rows.forEach(row => {
          // Look for date cell (like "5 Sep 2025")
          const dateCell = row.querySelector('td:first-child, .date-column, .publication-date')
          const linkCell = row.querySelector('td:nth-child(2) a, .title-column a, h3 a, h4 a')

          if (dateCell && linkCell) {
            const dateText = dateCell.textContent.trim()
            const title = linkCell.textContent.trim()
            const href = linkCell.href

            // Parse date like "5 Sep 2025" or "28 Aug 2025"
            const dateMatch = dateText.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i)

            if (dateMatch && title && href) {
              items.push({
                title,
                url: href,
                date: dateText,
                sortDate: new Date(`${dateMatch[3]}-${monthMap[dateMatch[2]]}-${dateMatch[1].padStart(2, '0')}`)
              })
            }
          }
        })

        // Alternative: Look for any date + link pattern if table structure not found
        if (items.length === 0) {
          // Find all text nodes that look like dates
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
          )

          let node = walker.nextNode()
          while (node) {
            const text = node.textContent.trim()
            const dateMatch = text.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i)

            if (dateMatch) {
              // Look for the next link after this date
              let nextElement = node.parentElement
              while (nextElement && nextElement.nextElementSibling) {
                nextElement = nextElement.nextElementSibling
                const link = nextElement.querySelector('a') || (nextElement.tagName === 'A' ? nextElement : null)

                if (link) {
                  const title = link.textContent.trim()
                  const href = link.href

                  if (title && href && !items.find(i => i.url === href)) {
                    items.push({
                      title,
                      url: href,
                      date: text,
                      sortDate: new Date(`${dateMatch[3]}-${monthMap[dateMatch[2]]}-${dateMatch[1].padStart(2, '0')}`)
                    })
                  }
                  break
                }
              }
            }

            node = walker.nextNode()
          }
        }

        // Sort by date (newest first) and limit
        return items
          .sort((a, b) => b.sortDate - a.sortDate)
          .slice(0, 20)
          .map(({ title, url, date }) => ({ title, url, date }))
      })

      await browser.close()

      console.log(`📊 FATF: Found ${newsItems.length} news items`)

      if (newsItems.length > 0) {
        const results = []
        for (const item of newsItems) {
          const date = this.parseDate(item.date)

          // Only include recent items
          if (this.isRecent(date, source?.recencyDays || 30)) {
            // Skip old methodologies and procedures
            const skipWords = ['methodology 2013', 'procedure 2013', 'fourth round']
            const shouldSkip = skipWords.some(word =>
              item.title.toLowerCase().includes(word)
            )

            if (!shouldSkip) {
              results.push({
                title: item.title,
                headline: item.title,
                url: item.url,
                link: item.url,
                publishedDate: date,
                authority: 'FATF',
                source: 'FATF News',
                feedType: 'web_scraping',
                summary: `FATF: ${item.title}`,
                sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
              })
            }
          }
        }

        console.log(`✅ FATF: ${results.length} recent news items within ${source?.recencyDays || 30} days`)

        if (results.length > 0) {
          return results
        }
      }

      // Fallback if no news found
      console.log('⚠️ No news items found, returning manual check notice')
      return [{
        title: 'Check FATF Website for Latest Updates',
        headline: 'Check FATF Website for Latest Updates',
        url: 'https://www.fatf-gafi.org/en/publications.html',
        link: 'https://www.fatf-gafi.org/en/publications.html',
        publishedDate: new Date(),
        authority: 'FATF',
        source: 'Manual Check',
        feedType: 'manual',
        summary: 'Visit FATF website for latest AML/CFT news and publications.',
        sectors: ['AML & Financial Crime']
      }]
    } catch (error) {
      console.error('❌ FATF Puppeteer failed:', error.message)

      if (browser) {
        try {
          await browser.close()
        } catch (e) {
          console.log('Failed to close browser:', e.message)
        }
      }

      return [{
        title: 'FATF Updates Available',
        headline: 'FATF Updates Available',
        url: 'https://www.fatf-gafi.org/en/publications.html',
        link: 'https://www.fatf-gafi.org/en/publications.html',
        publishedDate: new Date(),
        authority: 'FATF',
        source: 'Manual Fallback',
        feedType: 'manual',
        summary: 'Check FATF website for latest AML/CFT updates.',
        sectors: ['AML & Financial Crime']
      }]
    }
  }

  // UTILITY METHODS
  cleanText(text) {
    if (!text) return ''

    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .trim()
      .substring(0, 1000) // Limit length
  }

  normalizeUrl(url, baseUrl) {
    if (!url) return ''

    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        const base = new URL(baseUrl)
        return `${base.protocol}//${base.host}${url}`
      }

      // Handle URLs without protocol
      if (!url.startsWith('http')) {
        return `https://${url}`
      }

      return url
    } catch (error) {
      console.warn(`⚠️ Failed to normalize URL: ${url}`)
      return url
    }
  }

  parseDate(dateString) {
    if (!dateString) return new Date()

    try {
      // Clean and normalize date string
      const cleanDate = dateString
        .replace(/\s+/g, ' ')
        .replace(/(\d+)(st|nd|rd|th)/, '$1')
        .trim()

      const parsedDate = new Date(cleanDate)

      // Check if date is valid and not too far in the future
      if (isNaN(parsedDate.getTime()) || parsedDate > new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        return new Date()
      }

      return parsedDate
    } catch (error) {
      console.warn(`⚠️ Failed to parse date: ${dateString}`)
      return new Date()
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // FIX 2: ADDED THIS MISSING METHOD
  // Check if a date is within the recency window
  isRecent(date, maxDays = 7) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return false
    }

    const cutoffDate = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000)
    return date >= cutoffDate
  }

  // PUBLIC METHODS
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

  async testFeedSource(sourceName) {
    const source = this.feedSources.find(s => s.name === sourceName)
    if (!source) {
      throw new Error(`Feed source not found: ${sourceName}`)
    }

    console.log(`🧪 Testing feed source: ${sourceName}`)
    const startTime = Date.now()

    try {
      const updates = await this.fetchFromSource(source)
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      return {
        source: sourceName,
        type: source.type,
        authority: source.authority,
        updatesFound: updates ? updates.length : 0,
        duration: `${duration}s`,
        sampleUpdate: updates && updates.length > 0 ? updates[0] : null,
        status: updates && updates.length > 0 ? 'success' : 'no_updates',
        error: null
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      return {
        source: sourceName,
        type: source.type,
        authority: source.authority,
        updatesFound: 0,
        duration: `${duration}s`,
        sampleUpdate: null,
        status: 'error',
        error: error.message
      }
    }
  }

  async checkUpdateExists(url) {
    if (!dbService.checkUpdateExists) {
      // Fallback if method doesn't exist
      const updates = await dbService.getAllUpdates()
      return updates.some(u => u.url === url)
    }
    return await dbService.checkUpdateExists(url)
  }
}

// Create and export singleton instance
const enhancedRSSFetcher = new EnhancedRSSFetcher()

// Export both the instance and the fetchAll function for backward compatibility
module.exports = enhancedRSSFetcher
module.exports.fetchAll = async () => {
  return await enhancedRSSFetcher.fetchAllFeeds()
}
