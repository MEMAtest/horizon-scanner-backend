const cheerio = require('cheerio')
const Parser = require('rss-parser')
const dbService = require('../dbService')
const aiAnalyzer = require('../aiAnalyzer')

function applyProcessingMethods(ServiceClass) {
  ServiceClass.prototype.validateContent = function(title, content, url) {
    const validation = { valid: true, issues: [] }

    if (!title || title.length < 10) {
      validation.issues.push('Title too short')
      validation.valid = false
    }

    if (!url) {
      validation.issues.push('Missing URL')
      validation.valid = false
    }

    return validation
  }

  ServiceClass.prototype.processRSSFeeds = async function(sourceConfig) {
    const results = []

    if (!sourceConfig.rssFeeds || sourceConfig.rssFeeds.length === 0) {
      return results
    }

    for (const feedConfig of sourceConfig.rssFeeds) {
      try {
        const response = await this.makeRequest(feedConfig.url, sourceConfig.scrapingConfig)
        const parser = new Parser()
        const feed = await parser.parseString(response.data)

        for (const item of feed.items) {
          try {
            const itemData = {
              headline: item.title?.trim(),
              url: item.link,
              authority: sourceConfig.authority,
              area: feedConfig.type,
              source_category: 'rss',
              source_description: feedConfig.description,
              fetched_date: new Date().toISOString(),
              published_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              raw_data: {
                rssType: feedConfig.type,
                originalDate: item.pubDate,
                summary: item.contentSnippet?.trim(),
                content: item.content?.trim(),
                fullTitle: item.title?.trim(),
                sourceConfig: {
                  authority: sourceConfig.authority,
                  country: sourceConfig.country,
                  priority: sourceConfig.priority
                }
              }
            }

            const validation = this.validateContent(item.title || '', item.contentSnippet || '', item.link)

            if (validation.valid) {
              results.push(itemData)
              this.processingStats.byType.rss++
            }
          } catch (error) {
            console.error(`❌ Failed to process RSS item: ${error.message}`)
          }
        }
      } catch (error) {
        console.error(`❌ Failed to process RSS feed ${feedConfig.url}: ${error.message}`)
        this.processingStats.errors++
      }
    }

    return results
  }

  ServiceClass.prototype.performDeepScraping = async function(sourceConfig) {
    const results = []

    if (!sourceConfig.deepScraping) {
      return results
    }

    for (const [scrapingType, config] of Object.entries(sourceConfig.deepScraping)) {
      try {
        const scrapingResults = await this.scrapeSection(config, sourceConfig, scrapingType)
        results.push(...scrapingResults)

        await this.wait(sourceConfig.scrapingConfig?.rateLimit || 2000)
      } catch (error) {
        console.error(`❌ Failed to scrape ${scrapingType}: ${error.message}`)
        this.processingStats.errors++
      }
    }

    return results
  }

  ServiceClass.prototype.scrapeSection = async function(config, sourceConfig, scrapingType) {
    const results = []
    let currentPage = 1
    const maxPages = config.pagination?.maxPages || 1

    while (currentPage <= maxPages) {
      try {
        let pageUrl = config.url

        if (currentPage > 1 && config.pagination) {
          pageUrl = this.buildPaginationUrl(config.url, currentPage, config.pagination)
        }

        const response = await this.makeRequest(pageUrl, sourceConfig.scrapingConfig)
        const $ = cheerio.load(response.data)

        const items = $(config.selectors.items)

        if (items.length === 0) break

        for (let i = 0; i < items.length; i++) {
          try {
            const item = items.eq(i)
            const extractedData = await this.extractItemData(
              item,
              config.selectors,
              sourceConfig,
              scrapingType,
              $
            )

            if (extractedData) {
              results.push(extractedData)
            }
          } catch (error) {
            console.error(`❌ Failed to extract item: ${error.message}`)
          }
        }

        if (config.pagination && currentPage < maxPages) {
          const nextPageExists = $(config.pagination.nextPage).length > 0
          if (!nextPageExists) break
        }

        currentPage++

        if (currentPage <= maxPages) {
          await this.wait(1000)
        }
      } catch (error) {
        console.error(`❌ Failed to scrape page ${currentPage}: ${error.message}`)
        break
      }
    }

    return results
  }

  ServiceClass.prototype.extractItemData = async function(item, selectors, sourceConfig, scrapingType, $) {
    try {
      const title = this.extractText(item, selectors.title, $)
      const url = this.extractUrl(item, selectors.url, sourceConfig.baseUrl, $)
      const date = this.extractDate(item, selectors.date, $)
      const summary = this.extractText(item, selectors.summary, $)

      const deadline = selectors.deadline ? this.extractDate(item, selectors.deadline, $) : null
      const speaker = selectors.speaker ? this.extractText(item, selectors.speaker, $) : null
      const status = selectors.status ? this.extractText(item, selectors.status, $) : null
      const documentType = selectors.type ? this.extractText(item, selectors.type, $) : null

      if (!title || !url) return null

      const itemData = {
        headline: title.trim(),
        url,
        authority: sourceConfig.authority,
        area: scrapingType,
        source_category: 'deep_scraping',
        source_description: `${sourceConfig.name} - ${scrapingType}`,
        fetched_date: new Date().toISOString(),
        published_date: date ? new Date(date).toISOString() : null,
        raw_data: {
          scrapingType,
          originalDate: date,
          summary: summary?.trim(),
          deadline,
          speaker: speaker?.trim(),
          status: status?.trim(),
          documentType: documentType?.trim(),
          fullTitle: title.trim(),
          sourceConfig: {
            authority: sourceConfig.authority,
            country: sourceConfig.country,
            priority: sourceConfig.priority
          }
        }
      }

      return itemData
    } catch (error) {
      console.error(`❌ Failed to extract item data: ${error.message}`)
      return null
    }
  }

  ServiceClass.prototype.processCollectedData = async function(rawResults) {
    const processedResults = []

    console.log(`🔄 Post-processing ${rawResults.length} items...`)

    for (const item of rawResults) {
      try {
        const isDuplicate = await this.checkForDuplicate(item)
        if (isDuplicate) {
          console.log(`⏭️ Skipping duplicate: ${item.headline?.substring(0, 50)}...`)
          this.processingStats.skipped++
          continue
        }

        if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
          try {
            const analysisResult = await aiAnalyzer.analyzeUpdate(item)
            if (analysisResult && analysisResult.success && analysisResult.data) {
              const analysis = analysisResult.data
              item.impact = analysis.impact
              item.impactLevel = analysis.impactLevel
              item.impact_level = analysis.impactLevel
              item.businessImpactScore = analysis.businessImpactScore
              item.business_impact_score = analysis.businessImpactScore
              item.urgency = analysis.urgency
              item.sector = analysis.sector
              item.primarySectors = analysis.primarySectors
              item.ai_summary = analysis.ai_summary
              item.content_type = analysis.content_type || analysis.contentType
              item.area = analysis.area
              item.ai_tags = analysis.ai_tags
              item.aiTags = analysis.aiTags || analysis.ai_tags
              item.ai_confidence_score = analysis.ai_confidence_score
              item.complianceActions = analysis.complianceActions
              item.riskLevel = analysis.riskLevel
              item.affectedFirmSizes = analysis.affectedFirmSizes
              item.category = analysis.category
              item.key_dates = analysis.key_dates
              item.keyDates = analysis.key_dates
              item.sectorRelevanceScores = analysis.sectorRelevanceScores
              item.businessOpportunities = analysis.businessOpportunities
              item.implementationComplexity = analysis.implementationComplexity
              item.enhancedAt = analysis.enhancedAt
              item.aiModelUsed = analysis.aiModelUsed
              item.fallbackAnalysis = analysis.fallbackAnalysis
              item.compliance_deadline = analysis.compliance_deadline
              item.complianceDeadline = analysis.compliance_deadline
              item.firm_types_affected = analysis.firm_types_affected || []
              item.firmTypesAffected = analysis.firm_types_affected || []
              item.primary_sectors = analysis.primary_sectors || analysis.primarySectors || []
              item.implementation_phases = analysis.implementation_phases || []
              item.implementationPhases = analysis.implementation_phases || []
              item.required_resources = analysis.required_resources || {}
              item.requiredResources = analysis.required_resources || {}

              if (item.raw_data) {
                item.raw_data.aiAnalysis = analysis
              }

              console.log(`✅ AI analysis applied to item: ${item.url}`)
            }
          } catch (aiError) {
            console.log(`⚠️ AI analysis failed: ${aiError.message}`)
          }
        }

        await dbService.saveUpdate(item)
        processedResults.push(item)
      } catch (error) {
        console.error(`❌ Failed to process item: ${error.message}`)
        this.processingStats.errors++
      }
    }

    return processedResults
  }

  ServiceClass.prototype.checkForDuplicate = async function(item) {
    try {
      const existing = await dbService.getUpdateByUrl(item.url)
      return !!existing
    } catch (error) {
      console.error('Error checking for duplicate:', error.message)
      return false
    }
  }
}

module.exports = applyProcessingMethods
