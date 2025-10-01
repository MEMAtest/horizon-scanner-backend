// src/services/manualRefreshService.js
// Manual Refresh Service - Handles on-demand data refresh operations

const rssFetcher = require('./rssFetcher')
const dbService = require('./dbService')
const aiAnalyzer = require('./aiAnalyzer')

class ManualRefreshService {
  constructor() {
    this.isRefreshing = false
    this.lastRefresh = null
    this.refreshHistory = []
    this.currentProgress = {
      status: 'idle',
      percentage: 0,
      message: '',
      startTime: null,
      errors: []
    }
  }

  // Main refresh method
  async performManualRefresh(options = {}) {
    if (this.isRefreshing) {
      return {
        success: false,
        error: 'Refresh already in progress',
        currentProgress: this.currentProgress
      }
    }

    console.log('🔄 Starting manual refresh...')
    this.isRefreshing = true
    this.currentProgress = {
      status: 'in_progress',
      percentage: 0,
      message: 'Initializing refresh...',
      startTime: new Date(),
      errors: []
    }

    const results = {
      success: false,
      startTime: new Date(),
      endTime: null,
      duration: null,
      results: {
        rss: { total: 0, new: 0, errors: 0 },
        webScraping: { total: 0, new: 0, errors: 0 },
        aiAnalysis: { total: 0, successful: 0, errors: 0 },
        newUpdates: 0,
        totalProcessed: 0
      },
      errors: []
    }

    try {
      // Step 1: RSS Feeds (40% of progress)
      if (options.type !== 'web-only' && options.type !== 'ai-only') {
        this.updateProgress(10, 'Fetching RSS feeds...')
        const rssResults = await this.refreshRSSFeeds()
        results.results.rss = rssResults
        this.updateProgress(40, `RSS complete: ${rssResults.new} new items`)
      }

      // Step 2: Web Scraping (40% of progress)
      if (options.type !== 'rss-only' && options.type !== 'ai-only') {
        this.updateProgress(45, 'Starting web scraping...')
        const webResults = await this.refreshWebScraping()
        results.results.webScraping = webResults
        this.updateProgress(80, `Web scraping complete: ${webResults.new} new items`)
      }

      // Step 3: AI Analysis for new items (15% of progress)
      if (options.type === 'ai-only') {
        // AI-only mode: re-analyze existing items
        this.updateProgress(50, 'Re-analyzing existing items...')
        const aiResults = await this.reanalyzeExistingItems(options)
        results.results.aiAnalysis = aiResults
        this.updateProgress(95, 'AI re-analysis complete')
      } else if (options.skipAI !== true) {
        this.updateProgress(85, 'Running AI analysis on new items...')
        const aiResults = await this.runAIAnalysis(options)
        results.results.aiAnalysis = aiResults
        this.updateProgress(95, 'AI analysis complete')
      }

      // Step 4: Finalize
      this.updateProgress(100, 'Refresh complete!')

      results.endTime = new Date()
      results.duration = results.endTime - results.startTime
      results.success = true
      results.results.newUpdates = results.results.rss.new + results.results.webScraping.new
      results.results.totalProcessed = results.results.rss.total + results.results.webScraping.total

      // Update history
      this.lastRefresh = results.endTime
      this.refreshHistory.push({
        timestamp: results.endTime,
        success: true,
        newUpdates: results.results.newUpdates,
        duration: results.duration
      })

      console.log('✅ Manual refresh completed successfully')
      console.log(`📊 Results: ${results.results.newUpdates} new updates, ${results.results.totalProcessed} total processed`)

      return results
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
      results.success = false
      results.error = error.message
      results.errors.push(error.message)
      this.currentProgress.errors.push(error.message)

      this.refreshHistory.push({
        timestamp: new Date(),
        success: false,
        error: error.message
      })

      return results
    } finally {
      this.isRefreshing = false
      this.currentProgress.status = 'idle'
    }
  }

  // Refresh RSS feeds
  async refreshRSSFeeds() {
    console.log('📡 Refreshing RSS feeds...')
    const results = { total: 0, new: 0, errors: 0 }

    try {
      const rssResults = await rssFetcher.fetchAllFeeds()

      results.total = rssResults.total || 0
      results.new = rssResults.newUpdates || 0
      results.errors = rssResults.failed || 0

      return results
    } catch (error) {
      console.error('❌ RSS refresh error:', error)
      results.errors++
      this.currentProgress.errors.push(`RSS: ${error.message}`)
      return results
    }
  }

  // Refresh web scraping sources
  async refreshWebScraping() {
    console.log('🌐 Refreshing web scraping sources...')
    const results = { total: 0, new: 0, errors: 0 }

    try {
      // Try to load webScraperService if it exists
      let webScraperService
      try {
        webScraperService = require('./webScraperService')
      } catch (e) {
        console.warn('⚠️ Web scraper service not available')
        return results
      }

      // Check if webScraperService has the scrapeAllSources method
      if (webScraperService && typeof webScraperService.scrapeAllSources === 'function') {
        const webResults = await webScraperService.scrapeAllSources()

        results.total = webResults.length || 0
        // Since we can't tell which are new from the scraper, assume all are processed
        results.new = 0 // Will be determined by duplicate checking in the scraper

        return results
      } else {
        console.warn('⚠️ Web scraper service does not have scrapeAllSources method')
        return results
      }
    } catch (error) {
      console.error('❌ Web scraping error:', error)
      results.errors++
      this.currentProgress.errors.push(`Web scraping: ${error.message}`)
      return results
    }
  }

  // Run AI analysis on new items
  async runAIAnalysis(options = {}) {
    console.log('🤖 Running AI analysis...')
    const results = { total: 0, successful: 0, errors: 0 }

    try {
      // Get recent unanalyzed updates
      const recentUpdates = await dbService.getEnhancedUpdates({
        limit: options.aiLimit || 500
      })

      // Filter for updates without AI analysis
      const unanalyzedUpdates = recentUpdates.filter(update =>
        !update.ai_summary && !update.businessImpactScore
      )

      results.total = unanalyzedUpdates.length

      for (const update of unanalyzedUpdates) {
        try {
          if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
            const analysisResult = await aiAnalyzer.analyzeUpdate(update)
            const aiData = analysisResult?.data || analysisResult

            if (aiData && update.url) {
              await dbService.updateRegulatoryUpdate(update.url, aiData)
              results.successful++
              console.log(`✅ AI analysis completed for: ${update.headline?.substring(0, 50)}...`)
            } else {
              results.errors++
              console.warn(`⚠️ AI analysis returned no data for update ${update.id}`)
            }
          }
        } catch (error) {
          console.error(`❌ AI analysis failed for update ${update.id}:`, error.message)
          results.errors++
        }
      }

      return results
    } catch (error) {
      console.error('❌ AI analysis error:', error)
      results.errors++
      this.currentProgress.errors.push(`AI: ${error.message}`)
      return results
    }
  }

  // Re-analyze existing items (for AI-only mode)
  async reanalyzeExistingItems(options = {}) {
    console.log('🔄 Re-analyzing existing items...')
    const results = { total: 0, successful: 0, errors: 0 }

    try {
      // Get updates for re-analysis
      const updates = await dbService.getEnhancedUpdates({
        limit: options.aiLimit || 500,
        range: options.range || null
      })

      results.total = updates.length

      for (const update of updates) {
        try {
          if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
            const analysisResult = await aiAnalyzer.analyzeUpdate(update)
            const aiData = analysisResult?.data || analysisResult

            if (aiData && update.url) {
              await dbService.updateRegulatoryUpdate(update.url, aiData)
              results.successful++
              console.log(`✅ Re-analyzed: ${update.headline?.substring(0, 50)}...`)
            } else {
              results.errors++
              console.warn(`⚠️ Re-analysis produced no data for update ${update.id}`)
            }
          }
        } catch (error) {
          console.error(`❌ Re-analysis failed for update ${update.id}:`, error.message)
          results.errors++
        }
      }

      return results
    } catch (error) {
      console.error('❌ Re-analysis error:', error)
      results.errors++
      return results
    }
  }

  // Update progress
  updateProgress(percentage, message) {
    this.currentProgress.percentage = percentage
    this.currentProgress.message = message
    console.log(`📊 Progress: ${percentage}% - ${message}`)
  }

  // Get current refresh status
  getRefreshStatus() {
    return {
      isRefreshing: this.isRefreshing,
      lastRefresh: this.lastRefresh,
      currentProgress: this.currentProgress,
      counts: null // Will be populated by getSystemCounts
    }
  }

  // Get system counts
  async getSystemCounts() {
    try {
      const stats = await dbService.getDashboardStatistics()

      return {
        total: stats.totalUpdates || 0,
        today: stats.newToday || 0,
        highImpact: stats.highImpact || 0,
        aiAnalyzed: stats.aiAnalyzed || 0,
        byAuthority: {} // Can be populated if needed
      }
    } catch (error) {
      console.error('Error getting system counts:', error)
      return {
        total: 0,
        today: 0,
        highImpact: 0,
        aiAnalyzed: 0,
        byAuthority: {}
      }
    }
  }

  // Get refresh history
  getRefreshHistory(limit = 10) {
    return this.refreshHistory.slice(-limit)
  }

  // Health check
  async healthCheck() {
    try {
      const dbHealth = await dbService.healthCheck()
      const aiHealth = await aiAnalyzer.healthCheck()

      return {
        status: 'healthy',
        service: 'ManualRefreshService',
        database: dbHealth.status,
        aiAnalyzer: aiHealth.status,
        isRefreshing: this.isRefreshing,
        lastRefresh: this.lastRefresh
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'ManualRefreshService',
        error: error.message
      }
    }
  }

  // Get health status (alias for compatibility)
  async getHealthStatus() {
    return this.healthCheck()
  }
}

// Export singleton instance
module.exports = new ManualRefreshService()
