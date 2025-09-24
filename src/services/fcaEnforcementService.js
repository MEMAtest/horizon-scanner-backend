// FCA Enforcement Service - Main Integration Module
// Enhanced Horizon Scanner - Unified Enforcement Data Service

const FCAFinesScraper = require('./fcaFinesScraper')
const FCAFinesAI = require('./fcaFinesAI')
const { Pool } = require('pg')

class FCAEnforcementService {
  constructor(dbConfig, aiAnalyzer) {
    this.db = new Pool(dbConfig)
    this.scraper = new FCAFinesScraper(dbConfig)
    this.aiService = new FCAFinesAI(dbConfig, aiAnalyzer)
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) return

    try {
      console.log('🚀 Initializing FCA Enforcement Service...')

      // Initialize database schema
      await this.scraper.initializeDatabase()

      // Check if data exists, if not run initial scraping
      const existingData = await this.db.query('SELECT COUNT(*) FROM fca_fines')
      const fineCount = parseInt(existingData.rows[0].count)

      if (fineCount === 0) {
        console.log('📊 No existing fines data found, running initial scraping...')
        await this.runInitialScraping()
      } else {
        console.log(`📊 Found ${fineCount} existing fines in database`)
      }

      this.isInitialized = true
      console.log('✅ FCA Enforcement Service initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing FCA Enforcement Service:', error)
      throw error
    }
  }

  async runInitialScraping(options = {}) {
    const {
      startYear = 2013, // Start from 2013 to get full historical data
      endYear = new Date().getFullYear(),
      processWithAI = true
    } = options

    console.log(`🕷️ Running initial FCA fines scraping (${startYear}-${endYear})...`)

    try {
      // Run scraping
      const scrapingResults = await this.scraper.startScraping({
        startYear,
        endYear,
        useHeadless: true,
        forceScrape: false
      })

      console.log(`📊 Scraping completed: ${scrapingResults.totalFines} fines, ${scrapingResults.newFines} new`)

      // Process with AI if requested and we have new data
      if (processWithAI && scrapingResults.newFines > 0) {
        console.log('🤖 Processing new fines with AI...')
        const aiResults = await this.aiService.processUnanalyzedFines(scrapingResults.newFines)
        console.log(`🤖 AI processing completed: ${aiResults.processed} analyzed`)
      }

      return scrapingResults
    } catch (error) {
      console.error('❌ Error in initial scraping:', error)
      throw error
    }
  }

  async updateEnforcementData() {
    console.log('🔄 Updating FCA enforcement data...')

    try {
      // Run incremental scraping for current year
      const currentYear = new Date().getFullYear()
      const results = await this.scraper.startScraping({
        startYear: currentYear,
        endYear: currentYear,
        useHeadless: true,
        forceScrape: false
      })

      // Process any new fines with AI
      if (results.newFines > 0) {
        console.log(`🤖 Processing ${results.newFines} new fines with AI...`)
        await this.aiService.processUnanalyzedFines(results.newFines)
      }

      // Update trends and insights
      await this.updateTrends()

      return {
        success: true,
        totalFines: results.totalFines,
        newFines: results.newFines,
        processed: true
      }
    } catch (error) {
      console.error('❌ Error updating enforcement data:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getEnforcementStats() {
    try {
      const stats = await this.db.query(`
                SELECT
                    COUNT(*) as total_fines,
                    SUM(CASE WHEN EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 ELSE 0 END) as fines_this_year,
                    SUM(CASE WHEN date_issued >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as fines_last_30_days,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
                    AVG(amount) FILTER (WHERE amount IS NOT NULL) as average_amount,
                    MAX(amount) FILTER (WHERE amount IS NOT NULL) as largest_fine,
                    AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk_score,
                    COUNT(CASE WHEN systemic_risk = true THEN 1 END) as systemic_risk_cases,
                    COUNT(CASE WHEN precedent_setting = true THEN 1 END) as precedent_cases,
                    MAX(date_issued) as latest_fine_date
                FROM fca_fines
            `)

      const breachStats = await this.db.query(`
                SELECT
                    bc.category,
                    COUNT(*) as count,
                    SUM(f.amount) FILTER (WHERE f.amount IS NOT NULL) as total_amount
                FROM fca_fines f,
                jsonb_array_elements_text(f.breach_categories) as bc(category)
                WHERE f.processed_by_ai = true
                GROUP BY bc.category
                ORDER BY count DESC
                LIMIT 10
            `)

      const sectorStats = await this.db.query(`
                SELECT
                    s.sector,
                    COUNT(*) as count,
                    SUM(f.amount) FILTER (WHERE f.amount IS NOT NULL) as total_amount
                FROM fca_fines f,
                jsonb_array_elements_text(f.affected_sectors) as s(sector)
                WHERE f.processed_by_ai = true
                GROUP BY s.sector
                ORDER BY count DESC
                LIMIT 10
            `)

      return {
        overview: stats.rows[0],
        topBreachTypes: breachStats.rows,
        topSectors: sectorStats.rows
      }
    } catch (error) {
      console.error('Error getting enforcement stats:', error)
      throw error
    }
  }

  async getRecentFines(limit = 20) {
    try {
      const result = await this.db.query(`
                SELECT
                    fine_reference,
                    date_issued,
                    firm_individual,
                    amount,
                    ai_summary,
                    breach_categories,
                    affected_sectors,
                    customer_impact_level,
                    risk_score,
                    systemic_risk,
                    precedent_setting,
                    final_notice_url
                FROM fca_fines
                WHERE processing_status = 'completed'
                ORDER BY date_issued DESC
                LIMIT $1
            `, [limit])

      return result.rows
    } catch (error) {
      console.error('Error getting recent fines:', error)
      throw error
    }
  }

  async getFinesTrends(period = 'monthly', limit = 12) {
    try {
      let periodSelect, groupBy, intervalUnit

      switch (period) {
        case 'yearly':
          periodSelect = 'year_issued as period'
          groupBy = 'year_issued'
          intervalUnit = 'years'
          break
        case 'quarterly':
          periodSelect = "year_issued || '-Q' || quarter_issued as period"
          groupBy = 'year_issued, quarter_issued'
          intervalUnit = 'months'
          limit = limit * 3 // Convert quarters to months
          break
        default: // monthly
          periodSelect = "year_issued || '-' || LPAD(month_issued::text, 2, '0') as period"
          groupBy = 'year_issued, month_issued'
          intervalUnit = 'months'
      }

      const result = await this.db.query(`
                SELECT
                    ${periodSelect},
                    COUNT(*) as fine_count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
                    AVG(amount) FILTER (WHERE amount IS NOT NULL) as average_amount,
                    AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk_score
                FROM fca_fines
                WHERE date_issued >= CURRENT_DATE - INTERVAL '${limit} ${intervalUnit}'
                GROUP BY ${groupBy}
                ORDER BY ${groupBy}
            `)

      return result.rows
    } catch (error) {
      console.error('Error getting fines trends:', error)
      throw error
    }
  }

  async searchFines(searchParams = {}) {
    try {
      const {
        query,
        breachType,
        sector,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        years,
        riskLevel,
        systemicRisk,
        limit = 50,
        offset = 0
      } = searchParams

      const whereConditions = ['processing_status = \'completed\'']
      const queryParams = []
      let paramCount = 0

      if (query) {
        paramCount++
        whereConditions.push(`(
                    firm_individual ILIKE $${paramCount}
                    OR ai_summary ILIKE $${paramCount}
                    OR summary ILIKE $${paramCount}
                )`)
        queryParams.push(`%${query}%`)
      }

      if (breachType) {
        paramCount++
        whereConditions.push(`breach_categories ? $${paramCount}`)
        queryParams.push(breachType)
      }

      if (sector) {
        paramCount++
        whereConditions.push(`affected_sectors ? $${paramCount}`)
        queryParams.push(sector)
      }

      if (minAmount) {
        paramCount++
        whereConditions.push(`amount >= $${paramCount}`)
        queryParams.push(minAmount)
      }

      if (maxAmount) {
        paramCount++
        whereConditions.push(`amount <= $${paramCount}`)
        queryParams.push(maxAmount)
      }

      // Handle years parameter (multi-select) or individual start/end dates
      if (years && years.length > 0) {
        // Use years for filtering (takes precedence over start/end dates)
        paramCount++
        const yearPlaceholders = years.map((_, index) => `$${paramCount + index}`).join(',')
        whereConditions.push(`year_issued IN (${yearPlaceholders})`)
        queryParams.push(...years.map(year => parseInt(year)))
        paramCount += years.length - 1
      } else {
        // Fallback to start/end date filtering
        if (startDate) {
          paramCount++
          whereConditions.push(`date_issued >= $${paramCount}`)
          queryParams.push(startDate)
        }

        if (endDate) {
          paramCount++
          whereConditions.push(`date_issued <= $${paramCount}`)
          queryParams.push(endDate)
        }
      }

      if (riskLevel) {
        paramCount++
        if (riskLevel === 'high') {
          whereConditions.push(`risk_score >= $${paramCount}`)
          queryParams.push(70)
        } else if (riskLevel === 'medium') {
          whereConditions.push(`risk_score >= $${paramCount} AND risk_score < 70`)
          queryParams.push(40)
        } else if (riskLevel === 'low') {
          whereConditions.push(`risk_score < $${paramCount}`)
          queryParams.push(40)
        }
      }

      if (systemicRisk !== undefined) {
        paramCount++
        whereConditions.push(`systemic_risk = $${paramCount}`)
        queryParams.push(systemicRisk)
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

      const countQuery = `
                SELECT COUNT(*) as total
                FROM fca_fines
                ${whereClause}
            `

      const dataQuery = `
                SELECT
                    fine_reference,
                    date_issued,
                    firm_individual,
                    amount,
                    ai_summary,
                    breach_categories,
                    affected_sectors,
                    customer_impact_level,
                    risk_score,
                    systemic_risk,
                    precedent_setting,
                    final_notice_url
                FROM fca_fines
                ${whereClause}
                ORDER BY date_issued DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `

      queryParams.push(limit, offset)

      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, queryParams.slice(0, paramCount)),
        this.db.query(dataQuery, queryParams)
      ])

      return {
        total: parseInt(countResult.rows[0].total),
        fines: dataResult.rows,
        limit,
        offset
      }
    } catch (error) {
      console.error('Error searching fines:', error)
      throw error
    }
  }

  async updateTrends() {
    try {
      console.log('📊 Updating enforcement trends...')

      // The triggers in the database should handle most of this automatically,
      // but we can run additional calculations here if needed

      // Update firm history for repeat offender analysis
      await this.db.query(`
                INSERT INTO fca_firm_history (
                    firm_name,
                    normalized_name,
                    total_fines,
                    fine_count,
                    first_fine_date,
                    latest_fine_date,
                    is_repeat_offender
                )
                SELECT
                    firm_individual,
                    normalize_firm_name(firm_individual),
                    SUM(amount) FILTER (WHERE amount IS NOT NULL),
                    COUNT(*),
                    MIN(date_issued),
                    MAX(date_issued),
                    COUNT(*) > 1
                FROM fca_fines
                WHERE processing_status = 'completed'
                GROUP BY firm_individual
                ON CONFLICT (normalized_name)
                DO UPDATE SET
                    total_fines = EXCLUDED.total_fines,
                    fine_count = EXCLUDED.fine_count,
                    latest_fine_date = EXCLUDED.latest_fine_date,
                    is_repeat_offender = EXCLUDED.is_repeat_offender,
                    updated_at = CURRENT_TIMESTAMP
            `)

      console.log('✅ Trends updated successfully')
    } catch (error) {
      console.error('❌ Error updating trends:', error)
      throw error
    }
  }

  async getTopFirms(limit = 10) {
    try {
      const result = await this.db.query(`
                SELECT
                    firm_name,
                    total_fines,
                    fine_count,
                    first_fine_date,
                    latest_fine_date,
                    is_repeat_offender
                FROM fca_firm_history
                ORDER BY total_fines DESC
                LIMIT $1
            `, [limit])

      return result.rows
    } catch (error) {
      console.error('Error getting top firms:', error)
      throw error
    }
  }

  async getEnforcementInsights() {
    try {
      return await this.aiService.generateInsights()
    } catch (error) {
      console.error('Error getting enforcement insights:', error)
      throw error
    }
  }

  // Method to be called by the main Horizon Scanner scheduler
  async runScheduledUpdate() {
    console.log('⏰ Running scheduled FCA enforcement update...')

    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      const results = await this.updateEnforcementData()

      console.log('✅ Scheduled enforcement update completed')
      return results
    } catch (error) {
      console.error('❌ Scheduled enforcement update failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async close() {
    await this.db.end()
    await this.scraper.close()
    await this.aiService.close()
  }
}

module.exports = FCAEnforcementService
