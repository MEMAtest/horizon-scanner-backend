function applyOrchestratorMethods(ServiceClass) {
  ServiceClass.prototype.fetchAllFeeds = async function fetchAllFeeds(options = {}) {
    const {
      fastMode = false,
      sourceCategory,
      sourceCategories,
      onSourceComplete,
      onSourceError,
      dryRun = false,
      maxDurationMs = fastMode ? 100000 : 300000, // 100s for fast mode, 5min otherwise
      concurrency = fastMode ? 10 : 5 // Parallel batch size
    } = options
    const categoryFilter = Array.isArray(sourceCategories)
      ? sourceCategories
      : sourceCategory
        ? [sourceCategory]
        : null
    const normalizedCategoryFilter = categoryFilter
      ? new Set(categoryFilter.map(value => String(value || '').trim()).filter(Boolean))
      : null

    if (!this.isInitialized) {
      await this.initialize()
    }

    console.log(`📡 Starting ${fastMode ? 'fast-mode ' : ''}regulatory updates fetch...`)
    console.log(`⏱️ Max duration: ${maxDurationMs / 1000}s, Concurrency: ${concurrency}`)
    this.processingStats.startTime = Date.now()

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      newUpdates: 0,
      errors: [],
      bySource: {},
      timedOut: false
    }

    const sortedFeeds = this.feedSources
      .filter(source => {
        if (source.priority === 'disabled') return false
        if (normalizedCategoryFilter && normalizedCategoryFilter.size > 0) {
          const sourceCategoryValue = source.source_category || source.sourceCategory || ''
          if (!normalizedCategoryFilter.has(String(sourceCategoryValue).trim())) {
            return false
          }
        }
        if (fastMode) {
          // In fast mode, only process critical and high priority RSS feeds
          if (source.type === 'puppeteer') return false
          if (source.type === 'web_scraping') return false
          if (source.priority !== 'critical' && source.priority !== 'high') return false
        }
        return true
      })
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

    console.log(`📊 Processing ${sortedFeeds.length} sources in batches of ${concurrency}`)

    // Process sources in parallel batches
    const processSingleSource = async (source) => {
      const startedAt = Date.now()
      try {
        const updates = await this.fetchFromSource(source, options)
        const fetchedCount = Array.isArray(updates) ? updates.length : 0

        let savedCount = 0
        if (!dryRun && fetchedCount > 0) {
          savedCount = await this.saveUpdates(updates, source)
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
            name: source.name,
            fetched: fetchedCount,
            saved: savedCount,
            type: source.type,
            authority: source.authority,
            priority: source.priority,
            status: 'success',
            durationMs: Date.now() - startedAt
          }

          console.log(`✅ ${source.name}: ${savedCount} new`)
        } else {
          results.successful++
          results.bySource[source.name] = {
            name: source.name,
            fetched: 0,
            saved: 0,
            type: source.type,
            authority: source.authority,
            priority: source.priority,
            status: 'no_updates',
            durationMs: Date.now() - startedAt
          }
        }

        results.total++
        if (typeof onSourceComplete === 'function') {
          onSourceComplete(results.bySource[source.name])
        }
      } catch (error) {
        console.error(`❌ ${source.name}: ${error.message}`)
        results.failed++
        results.total++
        const sourceResult = {
          name: source.name,
          fetched: 0,
          saved: 0,
          type: source.type,
          authority: source.authority,
          priority: source.priority,
          status: 'error',
          error: error.message,
          durationMs: Date.now() - startedAt
        }
        results.bySource[source.name] = sourceResult
        results.errors.push({
          source: source.name,
          error: error.message,
          type: source.type
        })
        this.processingStats.errors++
        if (typeof onSourceError === 'function') {
          onSourceError(sourceResult)
        }
        if (typeof onSourceComplete === 'function') {
          onSourceComplete(sourceResult)
        }
      }
    }

    // Process in batches with timeout check
    for (let i = 0; i < sortedFeeds.length; i += concurrency) {
      // Check if we're approaching timeout
      const elapsed = Date.now() - this.processingStats.startTime
      if (elapsed > maxDurationMs) {
        console.warn(`⚠️ Approaching timeout (${elapsed}ms), stopping early`)
        results.timedOut = true
        break
      }

      const batch = sortedFeeds.slice(i, i + concurrency)
      console.log(`📦 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(sortedFeeds.length / concurrency)} (${batch.length} sources)`)

      // Process batch in parallel
      await Promise.all(batch.map(source => processSingleSource(source)))

      // Small delay between batches (not between individual sources)
      if (i + concurrency < sortedFeeds.length && !fastMode) {
        await this.delay(500)
      }
    }

    const duration = ((Date.now() - this.processingStats.startTime) / 1000).toFixed(2)
    console.log(`\n📊 Fetch completed in ${duration}s:`)
    console.log(`   📰 RSS feeds: ${this.processingStats.rssSuccess}/${this.rssFeedCount} successful`)
    console.log(`   🌐 Web scraping: ${this.processingStats.webScrapingSuccess}/${this.webScrapingCount} successful`)
    console.log(`   🤖 Puppeteer: ${this.processingStats.puppeteerSuccess || 0}/${this.puppeteerCount} successful`)
    console.log(`   ✅ Total: ${results.successful}/${results.total} sources processed`)
    console.log(`   🆕 New updates: ${results.newUpdates}`)
    if (results.timedOut) {
      console.log(`   ⚠️ Stopped early due to timeout`)
    }

    return results
  }

  ServiceClass.prototype.fetchFromSource = async function fetchFromSource(source, options = {}) {
    switch (source.type) {
      case 'rss':
        return await this.fetchRSSFeed(source, options)
      case 'web_scraping':
        return await this.fetchWebScraping(source, options)
      case 'puppeteer':
        return await this.fetchPuppeteer(source, options)
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
