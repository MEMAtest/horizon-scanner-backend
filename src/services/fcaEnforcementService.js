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

    this.controlPlaybook = {
      'Anti-Money Laundering': {
        headline: 'Strengthen AML governance and monitoring to avoid repeat FCA criticism.',
        controls: [
          'Run an annual enterprise-wide AML risk assessment covering customer types, products, and geographies.',
          'Deploy automated transaction monitoring with documented scenario tuning and QA sign-off.',
          'Evidence independent quality assurance of SAR determinations and timely reporting to the NCA.'
        ],
        monitoring: [
          'Quarterly MI on alert backlog, SAR volumes, and typologies presented to the MLRO and board risk committee.',
          'Documented model validation of transaction monitoring rules at least every 12 months.'
        ],
        riskIfIgnored: 'FCA expects firms to prove they understand and actively mitigate financial crime risk. Weak controls attract multi-million pound penalties and skilled-person reviews.'
      },
      'Systems and Controls': {
        headline: 'Operational controls gaps keep driving fines – tighten oversight and evidencing.',
        controls: [
          'Implement RCSA coverage for key operational processes with action tracking for high residual risks.',
          'Introduce change-management checkpoints that validate regulatory obligations before go-live.',
          'Maintain auditable control testing with escalation when repeated deficiencies are detected.'
        ],
        monitoring: [
          'Monthly control effectiveness dashboards shared with COO and Internal Audit.',
          'Formal closure evidence for remediation tasks, signed off by control owners.'
        ],
        riskIfIgnored: 'Control environment failures often highlight weak governance and supervision. FCA sanctions typically reference missing audit trails and senior manager accountability lapses.'
      },
      'Customer Treatment': {
        headline: 'Reinforce customer outcome testing to anticipate Consumer Duty scrutiny.',
        controls: [
          'Design outcome testing across the customer journey with thresholds linked to fair value indicators.',
          'Create escalation routes for vulnerable-customer cases and track remediation through root-cause forums.',
          'Maintain product governance minutes evidencing challenge and approvals.'
        ],
        monitoring: [
          'Monthly MI on complaints, root causes, redress amounts, and vulnerable customer handling.',
          'Bi-annual board attestations confirming Consumer Duty monitoring effectiveness.'
        ],
        riskIfIgnored: 'Failures in treating customers fairly quickly escalate into high-profile enforcement, particularly under the Consumer Duty regime.'
      },
      'Market Abuse': {
        headline: 'Market abuse surveillance must be demonstrably calibrated and independently reviewed.',
        controls: [
          'Document rationale for each surveillance scenario with periodic parameter reviews.',
          'Ensure trade data completeness checks with reconciliations to front-office systems.',
          'Provide targeted training to front-office and control staff on suspicious pattern escalation.'
        ],
        monitoring: [
          'Monthly surveillance effectiveness reports including alert volumes, tuning decisions, and QA sampling.',
          'Independent model validation of surveillance tools at least every 18 months.'
        ],
        riskIfIgnored: 'Gaps in surveillance tooling and governance underpin many of the FCA’s largest market abuse fines.'
      },
      'Financial Crime': {
        headline: 'Broaden financial crime controls beyond AML to cover sanctions, fraud, and emerging risks.',
        controls: [
          'Centralise adverse media, sanctions, and PEP screening with auditable overrides.',
          'Deploy fraud analytics with thresholds tuned to product-specific risk and geared to rapid customer communication.',
          'Maintain scenario-based playbooks covering sanctions breaches and law-enforcement requests.'
        ],
        monitoring: [
          'Dashboard tracking sanctions hits, override justifications, and breach escalations each month.',
          'Annual combined assurance review spanning AML, CTF, sanctions, and fraud controls.'
        ],
        riskIfIgnored: 'Regulators expect holistic financial crime defences. Fragmented controls create exposure to enforcement and senior manager accountability challenges.'
      }
    }
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
                    SUM(amount) FILTER (WHERE EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE)) as amount_this_year,
                    SUM(amount) FILTER (WHERE date_issued >= CURRENT_DATE - INTERVAL '30 days') as amount_last_30_days,
                    COUNT(DISTINCT COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')) as distinct_firms,
                    COUNT(DISTINCT CASE WHEN EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE)
                        THEN COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') END) as distinct_firms_this_year,
                    AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk_score,
                    COUNT(CASE WHEN systemic_risk = true THEN 1 END) as systemic_risk_cases,
                    COUNT(CASE WHEN precedent_setting = true THEN 1 END) as precedent_cases,
                    MAX(date_issued) as latest_fine_date,
                    (
                        SELECT COUNT(*)
                        FROM (
                            SELECT COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') AS entity
                            FROM fca_fines
                            GROUP BY entity
                            HAVING COUNT(*) > 1
                        ) repeat_entities
                    ) as repeat_offenders
                FROM fca_fines
            `)

      const breachStats = await this.db.query(`
                WITH category_source AS (
                    SELECT
                        COALESCE(
                            NULLIF(TRIM(bc.category), ''),
                            NULLIF(TRIM(f.breach_type), ''),
                            'Uncategorised'
                        ) AS category,
                        f.amount
                    FROM fca_fines f
                    LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(f.breach_categories, '[]'::jsonb)) AS bc(category) ON true
                )
                SELECT
                    category,
                    COUNT(*) AS count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount
                FROM category_source
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            `)

      const sectorStats = await this.db.query(`
                WITH sector_source AS (
                    SELECT
                        COALESCE(
                            NULLIF(TRIM(s.sector), ''),
                            NULLIF(TRIM(f.firm_category), ''),
                            'Unspecified'
                        ) AS sector,
                        f.amount
                    FROM fca_fines f
                    LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(f.affected_sectors, '[]'::jsonb)) AS s(sector) ON true
                )
                SELECT
                    sector,
                    COUNT(*) AS count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount
                FROM sector_source
                GROUP BY sector
                ORDER BY count DESC
                LIMIT 10
            `)

      const yearsResult = await this.db.query(`
                SELECT DISTINCT EXTRACT(YEAR FROM date_issued)::INT as year
                FROM fca_fines
                ORDER BY year DESC
                LIMIT 20
            `)

      const categoriesResult = await this.db.query(`
                SELECT DISTINCT TRIM(value) as category
                FROM fca_fines f
                CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(f.breach_categories, '[]'::jsonb)) as value
                WHERE value IS NOT NULL AND TRIM(value) <> ''
                ORDER BY category ASC
            `)

      const yearlyStatsResult = await this.db.query(`
                WITH yearly_base AS (
                    SELECT
                        year_issued AS year,
                        COUNT(*) AS fine_count,
                        SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount,
                        AVG(amount) FILTER (WHERE amount IS NOT NULL) AS average_amount,
                        AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) AS average_risk_score,
                        COUNT(*) FILTER (WHERE systemic_risk = true) AS systemic_risk_cases,
                        COUNT(*) FILTER (WHERE precedent_setting = true) AS precedent_cases
                    FROM fca_fines
                    GROUP BY year_issued
                ),
                category_rank AS (
                    SELECT
                        data.year_issued AS year,
                        data.category,
                        COUNT(*) AS count,
                        SUM(data.amount) FILTER (WHERE data.amount IS NOT NULL) AS total_amount,
                        ROW_NUMBER() OVER (
                            PARTITION BY data.year_issued
                            ORDER BY COUNT(*) DESC, SUM(data.amount) DESC
                        ) AS category_rank
                    FROM (
                        SELECT
                            f.year_issued,
                            COALESCE(
                                NULLIF(TRIM(bc.category), ''),
                                NULLIF(TRIM(f.breach_type), ''),
                                'Uncategorised'
                            ) AS category,
                            f.amount
                        FROM fca_fines f
                        LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(f.breach_categories, '[]'::jsonb)) AS bc(category) ON true
                    ) data
                    GROUP BY data.year_issued, data.category
                ),
                sector_rank AS (
                    SELECT
                        data.year_issued AS year,
                        data.sector,
                        COUNT(*) AS count,
                        SUM(data.amount) FILTER (WHERE data.amount IS NOT NULL) AS total_amount,
                        ROW_NUMBER() OVER (
                            PARTITION BY data.year_issued
                            ORDER BY COUNT(*) DESC, SUM(data.amount) DESC
                        ) AS sector_rank
                    FROM (
                        SELECT
                            f.year_issued,
                            COALESCE(
                                NULLIF(TRIM(s.sector), ''),
                                NULLIF(TRIM(f.firm_category), ''),
                                'Unspecified'
                            ) AS sector,
                            f.amount
                        FROM fca_fines f
                        LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(f.affected_sectors, '[]'::jsonb)) AS s(sector) ON true
                    ) data
                    GROUP BY data.year_issued, data.sector
                )
                SELECT
                    y.year,
                    y.fine_count,
                    y.total_amount,
                    y.average_amount,
                    y.average_risk_score,
                    y.systemic_risk_cases,
                    y.precedent_cases,
                    to_jsonb(c) AS dominant_category,
                    to_jsonb(s) AS dominant_sector
                FROM yearly_base y
                LEFT JOIN category_rank c ON c.year = y.year AND c.category_rank = 1
                LEFT JOIN sector_rank s ON s.year = y.year AND s.sector_rank = 1
                ORDER BY y.year DESC
            `)

      const categoryTrendResult = await this.db.query(`
                WITH category_assignments AS (
                    SELECT
                        f.year_issued,
                        COALESCE(
                            NULLIF(TRIM(bc.category), ''),
                            NULLIF(TRIM(f.breach_type), ''),
                            'Uncategorised'
                        ) AS category,
                        f.amount
                    FROM fca_fines f
                    LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(f.breach_categories, '[]'::jsonb)) AS bc(category) ON true
                ),
                top_categories AS (
                    SELECT category
                    FROM category_assignments
                    GROUP BY category
                    ORDER BY COUNT(*) DESC
                    LIMIT 6
                )
                SELECT
                    year_issued AS year,
                    category,
                    COUNT(*) AS fine_count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount
                FROM category_assignments
                WHERE category IN (SELECT category FROM top_categories)
                GROUP BY year_issued, category
                ORDER BY year DESC, category ASC
            `)

      const overview = stats.rows[0] || {}
      const normalisedOverview = {
        ...overview,
        average_amount: overview.average_amount || overview.avg_amount || 0,
        largest_fine: overview.largest_fine || overview.max_amount || 0,
        amount_this_year: overview.amount_this_year || 0,
        amount_last_30_days: overview.amount_last_30_days || 0,
        distinct_firms: overview.distinct_firms || 0,
        distinct_firms_this_year: overview.distinct_firms_this_year || 0,
        repeat_offenders: overview.repeat_offenders || 0
      }

      return {
        overview: normalisedOverview,
        topBreachTypes: breachStats.rows,
        topSectors: sectorStats.rows,
        availableYears: yearsResult.rows.map(row => row.year),
        availableCategories: categoriesResult.rows.map(row => row.category),
        yearlyOverview: yearlyStatsResult.rows,
        topCategoryTrends: categoryTrendResult.rows,
        controlRecommendations: this.buildControlRecommendations(breachStats.rows, categoryTrendResult.rows, yearlyStatsResult.rows)
      }
    } catch (error) {
      console.error('Error getting enforcement stats:', error)
      throw error
    }
  }

  buildControlRecommendations(topCategories = [], categoryTrends = [], yearlyOverview = []) {
    if (!Array.isArray(topCategories) || topCategories.length === 0) return []

    const categoryTrendMap = categoryTrends.reduce((acc, entry) => {
      if (!entry || !entry.category) return acc
      const category = entry.category
      const year = entry.year
      const count = Number(entry.fine_count || 0)
      const totalAmount = Number(entry.total_amount || 0)

      if (!acc[category]) acc[category] = []
      acc[category].push({ year, count, totalAmount })
      return acc
    }, {})

    Object.values(categoryTrendMap).forEach(entries => {
      entries.sort((a, b) => b.year - a.year)
    })

    const yearlyLookup = yearlyOverview.reduce((map, item) => {
      if (!item || typeof item.year !== 'number') return map
      map[item.year] = item
      return map
    }, {})

    const recommendations = []
    let categoriesToHighlight = topCategories
      .filter(cat => cat && cat.category && cat.category !== 'Uncategorised')
      .slice(0, 4)

    if (categoriesToHighlight.length === 0 && topCategories.length > 0) {
      categoriesToHighlight = topCategories.slice(0, 2)
    }

    categoriesToHighlight.forEach(categoryEntry => {
      const categoryName = categoryEntry.category
      const playbook = this.controlPlaybook[categoryName] || {
        headline: `${categoryName} remains on the FCA radar — ensure governance, control ownership, and evidence of remediation are watertight.`,
        controls: [
          'Identify the accountable SMF owner and document governance for this risk theme.',
          'Refresh the control inventory and confirm effectiveness testing cadence.',
          'Evidence remediation progress with clear milestones and sign-off.'
        ],
        monitoring: [
          'Provide quarterly MI covering incidents, audit findings, and remediation status.',
          'Record board or risk committee challenge and follow-up actions.'
        ],
        riskIfIgnored: 'FCA enforcement typically highlights weak oversight, missing MI, and slow remediation. Strengthen the control environment before supervisors ask.'
      }

      const trendHistory = categoryTrendMap[categoryName] || []
      const multiYearSnapshot = trendHistory.slice(0, 5)
      const cumulativeCount = multiYearSnapshot.reduce((sum, item) => sum + Number(item.count || 0), 0)
      const cumulativeAmount = multiYearSnapshot.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)

      const recentYearsText = multiYearSnapshot
        .map(item => `${item.year}: ${item.count} fines`)
        .join(' · ')

      const latestYear = multiYearSnapshot.length ? multiYearSnapshot[0].year : null
      const latestYearOverview = latestYear ? yearlyLookup[latestYear] : null

      recommendations.push({
        category: categoryName,
        headline: playbook.headline,
        recentActivity: {
          totalFines: cumulativeCount,
          totalAmount: cumulativeAmount,
          narrative: recentYearsText || `No detailed year-by-year data captured for ${categoryName}.`
        },
        dominantYears: multiYearSnapshot.map(item => item.year),
        riskSignal: latestYearOverview ? Number(latestYearOverview.average_risk_score || 0) : null,
        recommendedControls: playbook.controls,
        monitoringChecks: playbook.monitoring,
        riskIfIgnored: playbook.riskIfIgnored
      })
    })

    return recommendations
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

  async getFinesTrends(period = 'monthly', limit = 12, options = {}) {
    try {
      let periodSelect, groupBy, intervalUnit
      const { years } = options
      const filters = []
      const params = []

      filters.push("processing_status = 'completed'")
      filters.push('date_issued IS NOT NULL')

      if (Array.isArray(years) && years.length > 0) {
        params.push(years.map(year => parseInt(year, 10)).filter(Number.isFinite))
        filters.push(`year_issued = ANY($${params.length})`)
      }

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

      const timeframeClause = (!years || years.length === 0)
        ? `AND date_issued >= CURRENT_DATE - INTERVAL '${limit} ${intervalUnit}'`
        : ''

      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

      const query = `
                SELECT
                    ${periodSelect},
                    COUNT(*) as fine_count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
                    AVG(amount) FILTER (WHERE amount IS NOT NULL) as average_amount,
                    AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk_score
                FROM fca_fines
                ${whereClause}
                ${timeframeClause}
                GROUP BY ${groupBy}
                ORDER BY ${groupBy}
            `

      const result = await this.db.query(query, params)

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
