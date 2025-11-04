function applyOrchestratorMethods(ServiceClass) {
  ServiceClass.prototype.fetchAllFeeds = async function fetchAllFeeds(options = {}) {
    const { fastMode = false } = options

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

    const sortedFeeds = this.feedSources
      .filter(source => {
        if (source.priority === 'disabled') return false
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

  ServiceClass.prototype.fetchFromSource = async function fetchFromSource(source) {
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

  ServiceClass.prototype.testFeedSource = async function testFeedSource(sourceName) {
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
}

module.exports = applyOrchestratorMethods
