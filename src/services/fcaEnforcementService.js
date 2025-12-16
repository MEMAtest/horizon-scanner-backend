// FCA Enforcement Service - Main Integration Module
// Enhanced Horizon Scanner - Unified Enforcement Data Service

const FCAFinesScraper = require('./fcaFinesScraper')
const FCAFinesAI = require('./fcaFinesAI')
const { Pool } = require('pg')
const { parseFinesJsonbFields } = require('../utils/jsonbHelpers')

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

  /**
   * Build WHERE clause conditions for filtering fines
   * @param {Object} filterParams - Filter parameters
   * @returns {string} WHERE clause SQL fragment
   */
  buildFilterWhereClause(filterParams = {}) {
    const conditions = []

    // Year filter
    if (filterParams.years && filterParams.years.length > 0) {
      const yearsList = filterParams.years.join(', ')
      conditions.push(`year_issued IN (${yearsList})`)
    }

    // Breach type filter (searches in breach_categories JSONB)
    if (filterParams.breach_type) {
      const breachType = filterParams.breach_type.replace(/'/g, "''") // Escape single quotes
      conditions.push(`(
        breach_categories::text ILIKE '%${breachType}%' OR
        breach_type ILIKE '%${breachType}%'
      )`)
    }

    // Amount range filters
    if (filterParams.minAmount !== undefined) {
      conditions.push(`amount >= ${filterParams.minAmount}`)
    }

    if (filterParams.maxAmount !== undefined) {
      conditions.push(`amount <= ${filterParams.maxAmount}`)
    }

    return conditions.length > 0 ? conditions.join(' AND ') : ''
  }

  async getEnforcementStats(filterParams = {}) {
    try {
      console.log('[getEnforcementStats] Filter params:', filterParams)

      // Build WHERE clause
      const whereConditions = this.buildFilterWhereClause(filterParams)
      const whereClause = whereConditions ? `WHERE ${whereConditions}` : ''

      console.log('[getEnforcementStats] WHERE clause:', whereClause)

      const stats = await this.db.query(`
                SELECT
                    COUNT(*) as total_fines,
                    SUM(CASE WHEN EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 ELSE 0 END) as fines_this_year,
                    SUM(CASE WHEN date_issued >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as fines_last_30_days,
                    SUM(CASE WHEN date_issued >= CURRENT_DATE - INTERVAL '60 days' THEN 1 ELSE 0 END) as fines_last_60_days,
                    SUM(CASE WHEN date_issued >= CURRENT_DATE - INTERVAL '90 days' THEN 1 ELSE 0 END) as fines_last_90_days,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
                    AVG(amount) FILTER (WHERE amount IS NOT NULL) as average_amount,
                    MAX(amount) FILTER (WHERE amount IS NOT NULL) as largest_fine,
                    SUM(amount) FILTER (WHERE EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE)) as amount_this_year,
                    SUM(amount) FILTER (WHERE date_issued >= CURRENT_DATE - INTERVAL '30 days') as amount_last_30_days,
                    SUM(amount) FILTER (WHERE date_issued >= CURRENT_DATE - INTERVAL '60 days') as amount_last_60_days,
                    SUM(amount) FILTER (WHERE date_issued >= CURRENT_DATE - INTERVAL '90 days') as amount_last_90_days,
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
                            ${whereClause}
                            GROUP BY entity
                            HAVING COUNT(*) > 1
                        ) repeat_entities
                    ) as repeat_offenders
                FROM fca_fines
                ${whereClause}
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
                    LEFT JOIN LATERAL (
                        SELECT value::text as category
                        FROM jsonb_array_elements_text(
                            CASE
                                WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                                WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                    CASE
                                        WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                            (f.breach_categories #>> '{}')::jsonb
                                        ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                    END
                                ELSE '[]'::jsonb
                            END
                        ) as value
                    ) AS bc(category) ON true
                    ${whereClause}
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
                            'Empty'
                        ) AS sector,
                        NULLIF(TRIM(f.firm_category), '') AS firm_category,
                        f.amount
                    FROM fca_fines f
                    LEFT JOIN LATERAL (
                        SELECT value::text as sector
                        FROM jsonb_array_elements_text(
                            CASE
                                WHEN jsonb_typeof(f.affected_sectors) = 'array' THEN f.affected_sectors
                                WHEN jsonb_typeof(f.affected_sectors) = 'string' THEN
                                    CASE
                                        WHEN f.affected_sectors::text ~ '^"\\[.*\\]"$' THEN
                                            (f.affected_sectors #>> '{}')::jsonb
                                        ELSE to_jsonb(ARRAY[f.affected_sectors::text])
                                    END
                                ELSE '[]'::jsonb
                            END
                        ) as value
                    ) AS s(sector) ON true
                    ${whereClause}
                )
                SELECT
                    sector,
                    MAX(firm_category) AS sample_firm_category,
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
                ${whereClause}
                ORDER BY year DESC
                LIMIT 20
            `)

      const categoriesResult = await this.db.query(`
                SELECT DISTINCT TRIM(value::text) as category
                FROM fca_fines f
                CROSS JOIN LATERAL (
                    SELECT value
                    FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                            WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                CASE
                                    WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                        (f.breach_categories #>> '{}')::jsonb
                                    ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                END
                            ELSE '[]'::jsonb
                        END
                    ) as value
                ) as val
                WHERE val.value IS NOT NULL AND TRIM(val.value::text) <> ''
                ${whereConditions ? `AND (${whereConditions})` : ''}
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
                    ${whereClause}
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
                        LEFT JOIN LATERAL (
                            SELECT value::text as category
                            FROM jsonb_array_elements_text(
                                CASE
                                    WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                                    WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                        CASE
                                            WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                                (f.breach_categories #>> '{}')::jsonb
                                            ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                        END
                                    ELSE '[]'::jsonb
                                END
                            ) as value
                        ) AS bc(category) ON true
                        ${whereClause}
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
                        LEFT JOIN LATERAL (
                            SELECT value::text as sector
                            FROM jsonb_array_elements_text(
                                CASE
                                    WHEN jsonb_typeof(f.affected_sectors) = 'array' THEN f.affected_sectors
                                    WHEN jsonb_typeof(f.affected_sectors) = 'string' THEN
                                        CASE
                                            WHEN f.affected_sectors::text ~ '^"\\[.*\\]"$' THEN
                                                (f.affected_sectors #>> '{}')::jsonb
                                            ELSE to_jsonb(ARRAY[f.affected_sectors::text])
                                        END
                                    ELSE '[]'::jsonb
                                END
                            ) as value
                        ) AS s(sector) ON true
                        ${whereClause}
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
                    LEFT JOIN LATERAL (
                        SELECT value::text as category
                        FROM jsonb_array_elements_text(
                            CASE
                                WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                                WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                    CASE
                                        WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                            (f.breach_categories #>> '{}')::jsonb
                                        ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                    END
                                ELSE '[]'::jsonb
                            END
                        ) as value
                    ) AS bc(category) ON true
                    ${whereClause}
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

      // PHASE 2 FIX: Apply sector inference to yearly overview
      const enhancedYearlyOverview = yearlyStatsResult.rows.map(row => {
        if (!row.dominant_sector) {
          return row
        }

        // Parse the JSONB dominant_sector object
        let dominantSector = row.dominant_sector
        if (typeof dominantSector === 'string') {
          try {
            dominantSector = JSON.parse(dominantSector)
          } catch (e) {
            console.warn('Failed to parse dominant_sector:', e)
            return row
          }
        }

        // Check if sector is 'Unspecified' or empty and try to infer
        if (dominantSector && (dominantSector.sector === 'Unspecified' || !dominantSector.sector || dominantSector.sector.trim() === '')) {
          // Try to infer sector from firm_category (we'd need to query this separately, but for now we'll mark it)
          dominantSector.sector = 'Not captured'
        }

        return {
          ...row,
          dominant_sector: dominantSector
        }
      })

      // PHASE 2 FIX: Apply sector inference to topSectors
      const enhancedTopSectors = sectorStats.rows.map(row => {
        let sector = row.sector

        // If sector is 'Empty' or missing, try to infer from firm_category
        if (!sector || sector === 'Empty' || sector === 'Unspecified' || sector.trim() === '') {
          // Try to infer sector from firm_category
          const inferredSector = this.inferSectorFromFirmCategory(row.sample_firm_category)
          sector = inferredSector || 'Not captured'
        }

        return {
          ...row,
          sector: sector
        }
      })

      return {
        overview: normalisedOverview,
        topBreachTypes: breachStats.rows,
        topSectors: enhancedTopSectors,
        availableYears: yearsResult.rows.map(row => row.year),
        availableCategories: categoriesResult.rows.map(row => row.category),
        yearlyOverview: enhancedYearlyOverview,
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
                ORDER BY date_issued DESC
                LIMIT $1
            `, [limit])

      return parseFinesJsonbFields(result.rows)
    } catch (error) {
      console.error('Error getting recent fines:', error)
      throw error
    }
  }

  async getFinesTrends(period = 'monthly', limit = 12, options = {}) {
    try {
      let periodSelect, groupBy, intervalUnit
      const { years, firm, breachType, sector, riskLevel } = options
      const filters = []
      const params = []

      // FIXED: Removed processing_status filter
      filters.push('date_issued IS NOT NULL')

      if (Array.isArray(years) && years.length > 0) {
        params.push(years.map(year => parseInt(year, 10)).filter(Number.isFinite))
        filters.push(`year_issued = ANY($${params.length})`)
      }

      // Firm name filter (case-insensitive partial match)
      if (firm && typeof firm === 'string' && firm.trim()) {
        params.push(`%${firm.trim().toLowerCase()}%`)
        filters.push(`LOWER(firm_individual) LIKE $${params.length}`)
      }

      // Breach type filter
      if (breachType && typeof breachType === 'string' && breachType.trim()) {
        params.push(`%${breachType.trim()}%`)
        filters.push(`breach_categories::text ILIKE $${params.length}`)
      }

      // Sector filter
      if (sector && typeof sector === 'string' && sector.trim()) {
        params.push(`%${sector.trim()}%`)
        filters.push(`affected_sectors::text ILIKE $${params.length}`)
      }

      // Risk level filter
      if (riskLevel && typeof riskLevel === 'string') {
        const riskLevelLower = riskLevel.toLowerCase()
        if (riskLevelLower === 'high') {
          filters.push('risk_score >= 70')
        } else if (riskLevelLower === 'medium') {
          filters.push('risk_score >= 40 AND risk_score < 70')
        } else if (riskLevelLower === 'low') {
          filters.push('risk_score < 40')
        }
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

  async getHeatmapData(options = {}) {
    try {
      const { years } = options

      // Fetch all fines and process in JavaScript due to complex JSONB encoding
      const params = []
      const filters = ['amount IS NOT NULL', 'year_issued IS NOT NULL', 'breach_categories IS NOT NULL']

      if (Array.isArray(years) && years.length > 0) {
        params.push(years.map(year => parseInt(year, 10)).filter(Number.isFinite))
        filters.push(`year_issued = ANY($${params.length})`)
      }

      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

      const query = `
        SELECT year_issued, breach_categories, amount
        FROM fca_fines
        ${whereClause}
      `

      const result = await this.db.query(query, params)

      // Process in JavaScript to handle complex JSON encoding
      const heatmapMap = new Map()

      result.rows.forEach(row => {
        const year = parseInt(row.year_issued)
        const amount = parseFloat(row.amount) || 0

        // Parse breach categories (handling double/triple encoding)
        let categories = []
        try {
          let parsed = row.breach_categories
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed)
          }
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed)
          }
          if (Array.isArray(parsed)) {
            categories = parsed
          }
        } catch (e) {
          // Skip rows with unparseable categories
          return
        }

        categories.forEach(category => {
          if (!category) return
          const key = `${year}::${category}`
          const existing = heatmapMap.get(key) || { year, category, count: 0, total_amount: 0 }
          existing.count += 1
          existing.total_amount += amount
          heatmapMap.set(key, existing)
        })
      })

      // Convert to array and sort
      const heatmapData = Array.from(heatmapMap.values())
        .sort((a, b) => {
          if (a.year === b.year) {
            return a.category.localeCompare(b.category)
          }
          return a.year - b.year
        })

      return heatmapData
    } catch (error) {
      console.error('Error getting heatmap data:', error)
      throw error
    }
  }

  async getDistribution(options = {}) {
    try {
      const { years } = options
      const filters = ['amount IS NOT NULL']
      const params = []

      // Year filter
      if (Array.isArray(years) && years.length > 0) {
        params.push(years.map(year => parseInt(year, 10)).filter(Number.isFinite))
        filters.push(`year_issued = ANY($${params.length})`)
      }

      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

      const query = `
        SELECT
          CASE
            WHEN amount < 100000 THEN '£0-100k'
            WHEN amount >= 100000 AND amount < 500000 THEN '£100k-500k'
            WHEN amount >= 500000 AND amount < 1000000 THEN '£500k-1M'
            WHEN amount >= 1000000 AND amount < 5000000 THEN '£1M-5M'
            WHEN amount >= 5000000 THEN '£5M+'
          END as bucket,
          CASE
            WHEN amount < 100000 THEN 1
            WHEN amount >= 100000 AND amount < 500000 THEN 2
            WHEN amount >= 500000 AND amount < 1000000 THEN 3
            WHEN amount >= 1000000 AND amount < 5000000 THEN 4
            WHEN amount >= 5000000 THEN 5
          END as bucket_order,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount
        FROM fca_fines
        ${whereClause}
        GROUP BY bucket, bucket_order
        ORDER BY bucket_order
      `

      const result = await this.db.query(query, params)
      return result.rows
    } catch (error) {
      console.error('Error getting fine amount distribution:', error)
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

      const whereConditions = []  // FIXED: Removed processing_status filter
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
        fines: parseFinesJsonbFields(dataResult.rows),
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

  async getRepeatOffenders() {
    try {
      // Get firms with more than one fine
      const result = await this.db.query(`
        WITH repeat_firms AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            COUNT(*) as fine_count,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
            AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk
          FROM fca_fines
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
          HAVING COUNT(*) > 1
        )
        SELECT * FROM repeat_firms
        ORDER BY fine_count DESC, total_amount DESC
      `)

      // Get detailed fines for each repeat offender
      const offenders = await Promise.all(
        result.rows.map(async (firm) => {
          const finesResult = await this.db.query(`
            SELECT
              fine_reference,
              date_issued,
              amount,
              breach_categories,
              breach_type,
              risk_score,
              final_notice_url
            FROM fca_fines
            WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
            ORDER BY date_issued DESC
          `, [firm.firm_name])

          return {
            ...firm,
            fines: parseFinesJsonbFields(finesResult.rows)
          }
        })
      )

      return offenders
    } catch (error) {
      console.error('Error getting repeat offenders:', error)
      throw error
    }
  }

  async getFinesByPeriod(period) {
    try {
      let dateCondition
      if (period === 'ytd') {
        dateCondition = "EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE)"
      } else {
        const days = parseInt(period, 10)
        dateCondition = `date_issued >= CURRENT_DATE - INTERVAL '${days} days'`
      }

      const result = await this.db.query(`
        SELECT
          fine_reference,
          date_issued,
          firm_individual,
          amount,
          breach_categories,
          risk_score,
          final_notice_url
        FROM fca_fines
        WHERE ${dateCondition}
        ORDER BY date_issued DESC
      `)

      const parsedFines = parseFinesJsonbFields(result.rows)
      const totalAmount = parsedFines.reduce((sum, fine) => sum + (Number(fine.amount) || 0), 0)

      return {
        fines: parsedFines,
        totalAmount
      }
    } catch (error) {
      console.error('Error getting fines by period:', error)
      throw error
    }
  }

  async getDistinctFirms(searchQuery = '', limit = 20) {
    try {
      const params = []
      let whereClause = ''

      // Add search filter if provided
      if (searchQuery && searchQuery.trim().length > 0) {
        whereClause = 'WHERE firm_individual ILIKE $1'
        params.push(`%${searchQuery.trim()}%`)
      }

      const result = await this.db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
          COUNT(*) as fine_count,
          SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
          MIN(date_issued) as first_fine_date,
          MAX(date_issued) as latest_fine_date
        FROM fca_fines
        ${whereClause}
        GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ORDER BY total_amount DESC NULLS LAST
        LIMIT $${params.length + 1}
      `, [...params, limit])

      return result.rows
    } catch (error) {
      console.error('Error getting distinct firms:', error)
      throw error
    }
  }

  async getFirmDetails(firmName) {
    try {
      // Get firm summary
      const summaryResult = await this.db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
          COUNT(*) as fine_count,
          SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
          AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk,
          MIN(date_issued) as first_fine_date,
          MAX(date_issued) as latest_fine_date
        FROM fca_fines
        WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
        GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
      `, [firmName])

      if (summaryResult.rows.length === 0) {
        return null
      }

      // Get all fines for the firm
      const finesResult = await this.db.query(`
        SELECT
          fine_reference,
          date_issued,
          amount,
          breach_categories,
          breach_type,
          affected_sectors,
          risk_score,
          ai_summary,
          final_notice_url
        FROM fca_fines
        WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
        ORDER BY date_issued DESC
      `, [firmName])

      return {
        ...summaryResult.rows[0],
        fines: parseFinesJsonbFields(finesResult.rows)
      }
    } catch (error) {
      console.error('Error getting firm details:', error)
      throw error
    }
  }

  /**
   * Compare multiple firms side-by-side (max 3)
   * @param {Array<string>} firmNames - Array of firm names to compare
   * @returns {Array<Object>} Comparison data for each firm including yearly breakdown
   */
  async compareFirms(firmNames) {
    try {
      const comparisonData = []

      for (const firmName of firmNames) {
        // Get firm summary
        const summaryResult = await this.db.query(`
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            COUNT(*) as fine_count,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
            AVG(amount) FILTER (WHERE amount IS NOT NULL) as avg_amount,
            AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk,
            MIN(date_issued) as first_fine_date,
            MAX(date_issued) as latest_fine_date
          FROM fca_fines
          WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        `, [firmName])

        if (summaryResult.rows.length === 0) {
          // If firm not found, add placeholder
          comparisonData.push({
            firm_name: firmName,
            fine_count: 0,
            total_amount: 0,
            avg_amount: 0,
            average_risk: 0,
            first_fine_date: null,
            latest_fine_date: null,
            yearly_breakdown: [],
            not_found: true
          })
          continue
        }

        // Get yearly breakdown for the firm
        const yearlyResult = await this.db.query(`
          SELECT
            EXTRACT(YEAR FROM date_issued)::integer as year,
            COUNT(*) as fine_count,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount
          FROM fca_fines
          WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
          GROUP BY EXTRACT(YEAR FROM date_issued)
          ORDER BY year DESC
        `, [firmName])

        comparisonData.push({
          ...summaryResult.rows[0],
          yearly_breakdown: yearlyResult.rows
        })
      }

      return comparisonData
    } catch (error) {
      console.error('Error comparing firms:', error)
      throw error
    }
  }

  // ============================================================================
  // PEER BENCHMARKING METHODS (Phase 6)
  // ============================================================================

  /**
   * Get sector benchmarking data (avg, median, percentiles)
   * @param {string|null} sector - Specific sector or null for all sectors
   * @returns {Object} Benchmarking statistics
   */
  async getSectorBenchmarks(sector = null) {
    try {
      let whereClause = 'WHERE amount IS NOT NULL'
      const params = []

      if (sector) {
        whereClause += ` AND (
          affected_sectors::text ILIKE $1
          OR affected_sectors::text ILIKE $2
        )`
        params.push(`%"${sector}"%`, `%${sector}%`)
      }

      // Get overall statistics and percentiles for the sector
      const statsQuery = `
        WITH firm_totals AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            SUM(amount) as total_amount,
            COUNT(*) as fine_count,
            AVG(amount) as avg_fine
          FROM fca_fines
          ${whereClause}
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ),
        ranked AS (
          SELECT
            firm_name,
            total_amount,
            fine_count,
            avg_fine,
            PERCENT_RANK() OVER (ORDER BY total_amount) as percentile_rank
          FROM firm_totals
        )
        SELECT
          COUNT(*) as firm_count,
          AVG(total_amount) as avg_total,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_amount) as median_total,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total_amount) as p25_total,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_amount) as p75_total,
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY total_amount) as p90_total,
          MIN(total_amount) as min_total,
          MAX(total_amount) as max_total,
          AVG(fine_count) as avg_fine_count,
          AVG(avg_fine) as avg_fine_size
        FROM ranked
      `

      const statsResult = await this.db.query(statsQuery, params)

      // Get top firms in this sector
      const topFirmsQuery = `
        SELECT
          COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
          SUM(amount) as total_amount,
          COUNT(*) as fine_count
        FROM fca_fines
        ${whereClause}
        GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ORDER BY total_amount DESC
        LIMIT 5
      `

      const topFirmsResult = await this.db.query(topFirmsQuery, params)

      return {
        sector: sector || 'All Sectors',
        statistics: statsResult.rows[0] || {},
        top_firms: topFirmsResult.rows
      }
    } catch (error) {
      console.error('Error getting sector benchmarks:', error)
      throw error
    }
  }

  /**
   * Get a firm's percentile ranking within a sector or overall
   * @param {string} firmName - Firm name to analyze
   * @param {string|null} sector - Specific sector or null for overall
   * @returns {Object} Percentile data for the firm
   */
  async getFirmPercentile(firmName, sector = null) {
    try {
      let whereClause = 'WHERE amount IS NOT NULL'
      const params = [firmName]

      if (sector) {
        whereClause += ` AND (
          affected_sectors::text ILIKE $2
          OR affected_sectors::text ILIKE $3
        )`
        params.push(`%"${sector}"%`, `%${sector}%`)
      }

      // Get the firm's total and its percentile rank
      const query = `
        WITH firm_totals AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            SUM(amount) as total_amount,
            COUNT(*) as fine_count,
            AVG(amount) as avg_fine
          FROM fca_fines
          ${whereClause}
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ),
        ranked AS (
          SELECT
            firm_name,
            total_amount,
            fine_count,
            avg_fine,
            PERCENT_RANK() OVER (ORDER BY total_amount) * 100 as percentile,
            RANK() OVER (ORDER BY total_amount DESC) as rank_desc,
            COUNT(*) OVER () as total_firms
          FROM firm_totals
        )
        SELECT *
        FROM ranked
        WHERE firm_name = $1
      `

      const firmResult = await this.db.query(query, params)

      if (firmResult.rows.length === 0) {
        return {
          found: false,
          message: 'Firm not found in this sector'
        }
      }

      const firmData = firmResult.rows[0]

      // Get sector benchmarks for comparison
      const benchmarks = await this.getSectorBenchmarks(sector)

      // Determine tier based on percentile
      let tier = 'Average'
      const percentile = parseFloat(firmData.percentile) || 0
      if (percentile >= 99) tier = 'Top 1%'
      else if (percentile >= 95) tier = 'Top 5%'
      else if (percentile >= 90) tier = 'Top 10%'
      else if (percentile >= 75) tier = 'Top 25%'
      else if (percentile >= 50) tier = 'Above Average'
      else if (percentile >= 25) tier = 'Below Average'
      else tier = 'Bottom 25%'

      return {
        found: true,
        firm_name: firmData.firm_name,
        total_amount: parseFloat(firmData.total_amount) || 0,
        fine_count: parseInt(firmData.fine_count) || 0,
        avg_fine: parseFloat(firmData.avg_fine) || 0,
        percentile: percentile,
        rank: parseInt(firmData.rank_desc) || 0,
        total_firms: parseInt(firmData.total_firms) || 0,
        tier: tier,
        sector_benchmarks: {
          avg: parseFloat(benchmarks.statistics.avg_total) || 0,
          median: parseFloat(benchmarks.statistics.median_total) || 0,
          p75: parseFloat(benchmarks.statistics.p75_total) || 0,
          p90: parseFloat(benchmarks.statistics.p90_total) || 0
        },
        vs_average: firmData.total_amount && benchmarks.statistics.avg_total
          ? ((firmData.total_amount - benchmarks.statistics.avg_total) / benchmarks.statistics.avg_total * 100).toFixed(1)
          : 0,
        vs_median: firmData.total_amount && benchmarks.statistics.median_total
          ? ((firmData.total_amount - benchmarks.statistics.median_total) / benchmarks.statistics.median_total * 100).toFixed(1)
          : 0
      }
    } catch (error) {
      console.error('Error getting firm percentile:', error)
      throw error
    }
  }

  /**
   * Get all firms with percentile rankings and tier classifications
   * @param {number} limit - Maximum number of firms to return
   * @returns {Array<Object>} Ranked firms with percentile data
   */
  async getPercentileRankings(limit = 50) {
    try {
      const query = `
        WITH firm_totals AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
            COUNT(*) as fine_count,
            AVG(amount) FILTER (WHERE amount IS NOT NULL) as avg_fine,
            MIN(date_issued) as first_fine_date,
            MAX(date_issued) as latest_fine_date
          FROM fca_fines
          WHERE amount IS NOT NULL
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ),
        ranked AS (
          SELECT
            firm_name,
            total_amount,
            fine_count,
            avg_fine,
            first_fine_date,
            latest_fine_date,
            PERCENT_RANK() OVER (ORDER BY total_amount) * 100 as percentile,
            RANK() OVER (ORDER BY total_amount DESC) as rank_position,
            COUNT(*) OVER () as total_firms
          FROM firm_totals
        )
        SELECT *
        FROM ranked
        ORDER BY total_amount DESC
        LIMIT $1
      `

      const result = await this.db.query(query, [limit])

      // Add tier classification to each firm
      return result.rows.map(firm => {
        const percentile = parseFloat(firm.percentile) || 0

        let tier = 'Average'
        let tierColor = '#64748b'
        if (percentile >= 99) { tier = 'Top 1%'; tierColor = '#dc2626' }
        else if (percentile >= 95) { tier = 'Top 5%'; tierColor = '#ea580c' }
        else if (percentile >= 90) { tier = 'Top 10%'; tierColor = '#d97706' }
        else if (percentile >= 75) { tier = 'Top 25%'; tierColor = '#ca8a04' }
        else if (percentile >= 50) { tier = 'Above Average'; tierColor = '#65a30d' }
        else if (percentile >= 25) { tier = 'Below Average'; tierColor = '#0d9488' }
        else { tier = 'Bottom 25%'; tierColor = '#0891b2' }

        // Add medal emoji for top 3
        let medal = ''
        if (firm.rank_position === '1' || firm.rank_position === 1) medal = '🥇'
        else if (firm.rank_position === '2' || firm.rank_position === 2) medal = '🥈'
        else if (firm.rank_position === '3' || firm.rank_position === 3) medal = '🥉'

        return {
          ...firm,
          total_amount: parseFloat(firm.total_amount) || 0,
          fine_count: parseInt(firm.fine_count) || 0,
          avg_fine: parseFloat(firm.avg_fine) || 0,
          percentile: percentile,
          rank: parseInt(firm.rank_position) || 0,
          total_firms: parseInt(firm.total_firms) || 0,
          tier: tier,
          tier_color: tierColor,
          medal: medal
        }
      })
    } catch (error) {
      console.error('Error getting percentile rankings:', error)
      throw error
    }
  }

  /**
   * Get sector-level analysis for bubble chart visualization
   * @returns {Array<Object>} Sector data with fine count, totals, avg, and dominant breach category
   */
  async getSectorAnalysis() {
    try {
      // Query to get sector statistics with dominant breach category
      const query = `
        WITH sector_data AS (
          SELECT
            s.sector,
            COUNT(*) as fine_count,
            SUM(f.amount) FILTER (WHERE f.amount IS NOT NULL) as total_amount,
            AVG(f.amount) FILTER (WHERE f.amount IS NOT NULL) as avg_amount,
            MAX(f.amount) FILTER (WHERE f.amount IS NOT NULL) as max_amount
          FROM fca_fines f
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.affected_sectors IS NULL THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '[]' THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '' THEN '["Not captured"]'::jsonb
                ELSE f.affected_sectors
              END
            ) as sector
          ) s
          WHERE f.amount IS NOT NULL
          GROUP BY s.sector
          HAVING COUNT(*) >= 2
        ),
        breach_data AS (
          SELECT
            s.sector,
            b.breach as breach_category,
            COUNT(*) as breach_count,
            ROW_NUMBER() OVER (PARTITION BY s.sector ORDER BY COUNT(*) DESC) as rn
          FROM fca_fines f
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.affected_sectors IS NULL THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '[]' THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '' THEN '["Not captured"]'::jsonb
                ELSE f.affected_sectors
              END
            ) as sector
          ) s
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.breach_categories IS NULL THEN '["Other"]'::jsonb
                WHEN f.breach_categories::text = '[]' THEN '["Other"]'::jsonb
                WHEN f.breach_categories::text = '' THEN '["Other"]'::jsonb
                ELSE f.breach_categories
              END
            ) as breach
          ) b
          WHERE f.amount IS NOT NULL
          GROUP BY s.sector, b.breach
        )
        SELECT
          sd.sector,
          sd.fine_count,
          sd.total_amount,
          sd.avg_amount,
          sd.max_amount,
          COALESCE(bd.breach_category, 'Other') as dominant_breach
        FROM sector_data sd
        LEFT JOIN breach_data bd ON sd.sector = bd.sector AND bd.rn = 1
        ORDER BY sd.total_amount DESC
      `

      const result = await this.db.query(query)

      // Assign colors based on dominant breach category
      const breachColors = {
        'Anti-Money Laundering': '#dc2626',
        'Systems and Controls': '#ea580c',
        'Customer Treatment': '#d97706',
        'Market Abuse': '#ca8a04',
        'Financial Crime': '#65a30d',
        'Disclosure': '#0d9488',
        'Conflicts of Interest': '#0891b2',
        'Conduct': '#6366f1',
        'Prudential': '#8b5cf6',
        'Other': '#64748b'
      }

      return result.rows.map(sector => ({
        sector: sector.sector,
        fine_count: parseInt(sector.fine_count) || 0,
        total_amount: parseFloat(sector.total_amount) || 0,
        avg_amount: parseFloat(sector.avg_amount) || 0,
        max_amount: parseFloat(sector.max_amount) || 0,
        dominant_breach: sector.dominant_breach,
        color: breachColors[sector.dominant_breach] || breachColors['Other']
      }))
    } catch (error) {
      console.error('Error getting sector analysis:', error)
      throw error
    }
  }

  /**
   * Get sector enforcement trends over time
   * Returns yearly totals for each sector for line chart visualization
   * @returns {Object} {years: [], sectors: [{name, data: []}], matrix: {}}
   */
  async getSectorTrends() {
    try {
      const query = `
        WITH sector_year_data AS (
          SELECT
            s.sector,
            EXTRACT(YEAR FROM f.date_issued)::integer as year,
            COUNT(*) as fine_count,
            SUM(f.amount) FILTER (WHERE f.amount IS NOT NULL) as total_amount
          FROM fca_fines f
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.affected_sectors IS NULL THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '[]' THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '' THEN '["Not captured"]'::jsonb
                ELSE f.affected_sectors
              END
            ) as sector
          ) s
          WHERE f.date_issued IS NOT NULL
            AND f.amount IS NOT NULL
          GROUP BY s.sector, EXTRACT(YEAR FROM f.date_issued)
        ),
        all_years AS (
          SELECT DISTINCT year FROM sector_year_data ORDER BY year
        ),
        sector_totals AS (
          SELECT sector, SUM(total_amount) as grand_total
          FROM sector_year_data
          GROUP BY sector
          ORDER BY grand_total DESC
          LIMIT 10
        )
        SELECT
          syd.sector,
          syd.year,
          syd.fine_count,
          syd.total_amount
        FROM sector_year_data syd
        INNER JOIN sector_totals st ON syd.sector = st.sector
        ORDER BY st.grand_total DESC, syd.year ASC
      `

      const result = await this.db.query(query)

      // Get unique years and sectors
      const yearsSet = new Set()
      const sectorsMap = new Map()

      result.rows.forEach(row => {
        yearsSet.add(row.year)
        if (!sectorsMap.has(row.sector)) {
          sectorsMap.set(row.sector, new Map())
        }
        sectorsMap.get(row.sector).set(row.year, {
          fine_count: parseInt(row.fine_count) || 0,
          total_amount: parseFloat(row.total_amount) || 0
        })
      })

      const years = Array.from(yearsSet).sort((a, b) => a - b)

      // Define sector colors
      const sectorColors = {
        'Banking': '#3b82f6',
        'Individual': '#8b5cf6',
        'Insurance': '#10b981',
        'Brokerage & Trading': '#f59e0b',
        'Investment Banking': '#ef4444',
        'Asset Management': '#06b6d4',
        'Wealth Management': '#ec4899',
        'Consumer Finance': '#f97316',
        'Payments & E-Money': '#14b8a6',
        'Investment Services': '#6366f1',
        'Pensions': '#84cc16',
        'Commodities': '#78716c',
        'Not captured': '#9ca3af'
      }

      // Build sector data for charts
      const sectors = []
      sectorsMap.forEach((yearData, sectorName) => {
        const data = years.map(year => ({
          year,
          fine_count: yearData.get(year)?.fine_count || 0,
          total_amount: yearData.get(year)?.total_amount || 0
        }))

        const totalAmount = data.reduce((sum, d) => sum + d.total_amount, 0)
        const totalCount = data.reduce((sum, d) => sum + d.fine_count, 0)

        sectors.push({
          name: sectorName,
          color: sectorColors[sectorName] || '#64748b',
          data,
          totalAmount,
          totalCount
        })
      })

      // Sort by total amount
      sectors.sort((a, b) => b.totalAmount - a.totalAmount)

      return {
        years,
        sectors,
        summary: {
          totalSectors: sectors.length,
          yearRange: `${years[0]} - ${years[years.length - 1]}`,
          topSector: sectors[0]?.name || 'N/A'
        }
      }
    } catch (error) {
      console.error('Error getting sector trends:', error)
      throw error
    }
  }

  // ============================================================================
  // YEAR SUMMARY METHODS (Phase 4)
  // ============================================================================

  /**
   * Get comprehensive year summary with all sections
   * @param {number} year - Year to analyze
   * @returns {Object} Complete year summary data
   */
  async getYearSummary(year) {
    try {
      const [
        yearStats,
        topFirms,
        categoryBreakdown,
        monthlyTimeline,
        priorYearStats,
        datasetAverages
      ] = await Promise.all([
        this.getYearStats(year),
        this.getTopFirmsForYear(year),
        this.getCategoryBreakdownForYear(year),
        this.getMonthlyTimelineForYear(year),
        this.getYearStats(year - 1),
        this.getDatasetAverages()
      ])

      const aiSummary = this.generateYearSummary(
        year, yearStats, categoryBreakdown, topFirms, priorYearStats
      )

      return {
        aiSummary,
        yearStats,
        priorYearStats,
        datasetAverages,
        topFirms,
        categoryBreakdown,
        monthlyTimeline
      }
    } catch (error) {
      console.error(`Error getting year summary for ${year}:`, error)
      throw error
    }
  }

  /**
   * Get statistics for a specific year
   * @param {number} year - Year to analyze
   * @returns {Object} Year statistics
   */
  async getYearStats(year) {
    try {
      const result = await this.db.query(`
        SELECT
          COUNT(*) as fine_count,
          SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
          AVG(amount) FILTER (WHERE amount IS NOT NULL) as average_fine,
          MAX(amount) FILTER (WHERE amount IS NOT NULL) as largest_fine,
          MIN(amount) FILTER (WHERE amount IS NOT NULL) as smallest_fine,
          COUNT(DISTINCT COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')) as distinct_firms,
          AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as avg_risk_score,
          COUNT(*) FILTER (WHERE systemic_risk = true) as systemic_risk_count
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
      `, [year])

      return result.rows[0] || {
        fine_count: 0,
        total_amount: 0,
        average_fine: 0,
        largest_fine: 0,
        smallest_fine: 0,
        distinct_firms: 0,
        avg_risk_score: 0,
        systemic_risk_count: 0
      }
    } catch (error) {
      console.error(`Error getting year stats for ${year}:`, error)
      throw error
    }
  }

  /**
   * Get dataset-wide averages for comparison
   * @returns {Object} Dataset average statistics
   */
  async getDatasetAverages() {
    try {
      const result = await this.db.query(`
        WITH yearly_aggregates AS (
          SELECT
            year_issued as year,
            COUNT(*) as fine_count,
            SUM(amount) as total_amount
          FROM fca_fines
          WHERE amount IS NOT NULL
            AND year_issued IS NOT NULL
          GROUP BY year_issued
        )
        SELECT
          AVG(fine_count) as avg_fines_per_year,
          AVG(total_amount) as avg_amount_per_year
        FROM yearly_aggregates
      `)

      return result.rows[0] || {
        avg_fines_per_year: 0,
        avg_amount_per_year: 0
      }
    } catch (error) {
      console.error('Error getting dataset averages:', error)
      throw error
    }
  }

  /**
   * Get top 10 firms fined in a specific year
   * @param {number} year - Year to analyze
   * @returns {Array} Top firms with their fines
   */
  async getTopFirmsForYear(year) {
    try {
      // First get the aggregated data
      const result = await this.db.query(`
        SELECT
          firm_individual as firm_name,
          COUNT(*) as fine_count,
          SUM(amount) as total_amount,
          AVG(risk_score) as avg_risk_score,
          array_agg(
            json_build_object(
              'date_issued', date_issued,
              'amount', amount,
              'breach_categories', breach_categories,
              'final_notice_url', final_notice_url
            ) ORDER BY date_issued DESC
          ) as fines
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
          AND COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') != 'Unknown'
        GROUP BY firm_individual
        ORDER BY SUM(amount) DESC
        LIMIT 10
      `, [year])

      // Parse breach_categories for each fine in each firm
      return result.rows.map(firm => ({
        ...firm,
        fine_count: parseInt(firm.fine_count),
        total_amount: parseFloat(firm.total_amount),
        avg_risk_score: firm.avg_risk_score ? parseFloat(firm.avg_risk_score) : null,
        fines: firm.fines.map(fine => ({
          ...fine,
          breach_categories: this.parseJsonbField(fine.breach_categories)
        }))
      }))
    } catch (error) {
      console.error(`Error getting top firms for ${year}:`, error)
      throw error
    }
  }

  /**
   * Get category breakdown for a specific year
   * @param {number} year - Year to analyze
   * @returns {Array} Category statistics with percentages
   */
  async getCategoryBreakdownForYear(year) {
    try {
      // Get all fines for the year
      const result = await this.db.query(`
        SELECT amount, breach_categories
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
      `, [year])

      // Process in JavaScript to handle JSONB
      const categoryMap = new Map()
      let totalFines = 0

      result.rows.forEach(row => {
        const amount = parseFloat(row.amount) || 0
        let categories = this.parseJsonbField(row.breach_categories)

        if (!Array.isArray(categories) || categories.length === 0) {
          categories = ['Not Categorised']
        }

        categories.forEach(category => {
          if (!category) return
          const existing = categoryMap.get(category) || { category, fine_count: 0, total_amount: 0 }
          existing.fine_count += 1
          existing.total_amount += amount
          categoryMap.set(category, existing)
          totalFines += 1
        })
      })

      // Convert to array and calculate percentages
      const breakdown = Array.from(categoryMap.values()).map(item => ({
        category: item.category,
        fine_count: item.fine_count,
        total_amount: item.total_amount,
        avg_amount: Math.round(item.total_amount / item.fine_count),
        percentage: totalFines > 0 ? Math.round((item.fine_count / totalFines) * 1000) / 10 : 0
      }))

      return breakdown.sort((a, b) => b.fine_count - a.fine_count)
    } catch (error) {
      console.error(`Error getting category breakdown for ${year}:`, error)
      throw error
    }
  }

  /**
   * Get monthly timeline for a specific year
   * @param {number} year - Year to analyze
   * @returns {Array} Monthly statistics (all 12 months)
   */
  async getMonthlyTimelineForYear(year) {
    try {
      const result = await this.db.query(`
        SELECT
          EXTRACT(MONTH FROM date_issued) as month,
          TO_CHAR(date_issued, 'Mon') as month_name,
          COUNT(*) as fine_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
          AND date_issued IS NOT NULL
        GROUP BY EXTRACT(MONTH FROM date_issued), TO_CHAR(date_issued, 'Mon')
        ORDER BY month
      `, [year])

      // Fill in missing months with zero values
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = monthNames.map((monthName, index) => {
        const existing = result.rows.find(row => parseInt(row.month) === index + 1)
        return existing ? {
          month: index + 1,
          month_name: monthName,
          fine_count: parseInt(existing.fine_count),
          total_amount: parseFloat(existing.total_amount),
          avg_amount: existing.avg_amount ? parseFloat(existing.avg_amount) : 0
        } : {
          month: index + 1,
          month_name: monthName,
          fine_count: 0,
          total_amount: 0,
          avg_amount: 0
        }
      })

      return monthlyData
    } catch (error) {
      console.error(`Error getting monthly timeline for ${year}:`, error)
      throw error
    }
  }

  /**
   * Generate AI summary text for a year (template-based)
   * @param {number} year - Year to summarize
   * @param {Object} yearStats - Year statistics
   * @param {Array} categoryBreakdown - Category breakdown
   * @param {Array} topFirms - Top firms
   * @param {Object} priorYearStats - Prior year statistics (for comparison)
   * @returns {Object} Two-paragraph summary
   */
  generateYearSummary(year, yearStats, categoryBreakdown, topFirms, priorYearStats) {
    const fineCount = parseInt(yearStats.fine_count || 0)
    const totalAmount = parseFloat(yearStats.total_amount || 0)
    const avgFine = parseFloat(yearStats.average_fine || 0)
    const largestFine = parseFloat(yearStats.largest_fine || 0)

    // Calculate YoY changes
    const priorFineCount = parseInt(priorYearStats?.fine_count || 0)
    const priorTotalAmount = parseFloat(priorYearStats?.total_amount || 0)

    const countChange = priorFineCount > 0
      ? ((fineCount - priorFineCount) / priorFineCount * 100).toFixed(1)
      : null
    const amountChange = priorTotalAmount > 0
      ? ((totalAmount - priorTotalAmount) / priorTotalAmount * 100).toFixed(1)
      : null

    const dominantCategory = categoryBreakdown[0] || {
      category: 'Not Categorised', fine_count: 0, percentage: 0
    }
    const notableFirm = topFirms[0] || { firm_name: 'Unknown', total_amount: 0 }

    // Paragraph 1: Overview and YoY comparison
    let paragraph1 = `In ${year}, the FCA issued ${fineCount} enforcement ${fineCount === 1 ? 'action' : 'actions'} totalling £${(totalAmount / 1000000).toFixed(1)}m, with an average fine of £${(avgFine / 1000).toFixed(0)}k. `

    if (countChange !== null && amountChange !== null) {
      const countDirection = parseFloat(countChange) >= 0 ? 'increased' : 'decreased'
      const amountDirection = parseFloat(amountChange) >= 0 ? 'increased' : 'decreased'
      paragraph1 += `Compared to ${year - 1}, the number of fines ${countDirection} by ${Math.abs(countChange)}% while the total amount ${amountDirection} by ${Math.abs(amountChange)}%. `
    } else {
      paragraph1 += `This represented a baseline year in the FCA's enforcement trajectory. `
    }

    paragraph1 += `The largest single fine was £${(largestFine / 1000000).toFixed(1)}m, issued to ${notableFirm.firm_name}.`

    // Paragraph 2: Thematic focus
    const paragraph2 = `${dominantCategory.category} emerged as the dominant enforcement theme, accounting for ${dominantCategory.percentage}% of all actions (${dominantCategory.fine_count} cases). ` +
      `The FCA's focus on ${dominantCategory.category.toLowerCase()} reflects ongoing regulatory priorities around ${this.getCategoryContext(dominantCategory.category)}. ` +
      `${yearStats.systemic_risk_count > 0 ? `Notably, ${yearStats.systemic_risk_count} ${yearStats.systemic_risk_count === 1 ? 'case was' : 'cases were'} flagged for systemic risk implications, highlighting the FCA's attention to market-wide conduct issues. ` : ''}` +
      `Firms should review their ${dominantCategory.category.toLowerCase()} controls in light of this enforcement activity and ensure robust governance frameworks are in place.`

    return { paragraph1, paragraph2 }
  }

  /**
   * Parse JSONB field (handles double/triple JSON encoding)
   * @param {any} value - JSONB field value from database
   * @returns {Array} Parsed array or empty array
   */
  parseJsonbField(value) {
    if (!value) return []

    try {
      let parsed = value
      // Handle string encoding (may be doubly or triply encoded)
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed)
      }
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed)
      }

      // Return array or wrap single value in array
      if (Array.isArray(parsed)) {
        return parsed
      } else if (parsed !== null && parsed !== undefined) {
        return [parsed]
      }

      return []
    } catch (e) {
      console.warn('Failed to parse JSONB field:', value, e.message)
      return []
    }
  }

  /**
   * Infer sector from firm category when affected_sectors is empty
   * Maps common firm_category values to standard sector names
   * @param {string} firmCategory - The firm_category field value
   * @returns {string|null} Inferred sector name or null if no match
   */
  inferSectorFromFirmCategory(firmCategory) {
    if (!firmCategory || typeof firmCategory !== 'string') {
      return null
    }

    const category = firmCategory.toLowerCase().trim()

    // Banking sector keywords
    if (category.includes('bank') || category.includes('building society')) {
      return 'Banking'
    }

    // Insurance sector keywords
    if (category.includes('insurance') || category.includes('insurer') ||
        category.includes('underwriter') || category.includes('lloyd')) {
      return 'Insurance'
    }

    // Asset Management keywords
    if (category.includes('asset management') || category.includes('investment manager') ||
        category.includes('fund manager') || category.includes('portfolio')) {
      return 'Asset Management'
    }

    // Wealth Management keywords
    if (category.includes('wealth') || category.includes('private bank') ||
        category.includes('financial advisor') || category.includes('financial planner')) {
      return 'Wealth Management'
    }

    // Payments/E-Money keywords
    if (category.includes('payment') || category.includes('e-money') ||
        category.includes('emoney') || category.includes('fintech')) {
      return 'Payments & E-Money'
    }

    // Investment/Securities keywords
    if (category.includes('broker') || category.includes('dealer') ||
        category.includes('securities') || category.includes('trading')) {
      return 'Investment Services'
    }

    // Mortgage keywords
    if (category.includes('mortgage') || category.includes('home finance')) {
      return 'Mortgages'
    }

    // Consumer Credit keywords
    if (category.includes('credit') || category.includes('lending') ||
        category.includes('loan')) {
      return 'Consumer Credit'
    }

    // Pension/Retirement keywords
    if (category.includes('pension') || category.includes('retirement')) {
      return 'Pensions'
    }

    // If no match, return null (will fall back to 'Not captured')
    return null
  }

  /**
   * Get contextual description for a breach category
   * @param {string} category - Breach category name
   * @returns {string} Contextual description
   */
  getCategoryContext(category) {
    const contexts = {
      'Anti-Money Laundering': 'financial crime prevention, customer due diligence, and transaction monitoring effectiveness',
      'Systems and Controls': 'operational resilience, governance frameworks, and control environment maturity',
      'Customer Treatment': 'fair customer outcomes, vulnerable customer protections, and Consumer Duty compliance',
      'Market Abuse': 'market integrity, surveillance systems, and trading conduct standards',
      'Financial Crime': 'sanctions compliance, fraud prevention, and holistic financial crime defences',
      'Client Money': 'client asset protection, segregation requirements, and custody arrangements',
      'Disclosure': 'transparency obligations, client communications, and regulatory reporting accuracy',
      'Regulatory Breach': 'general regulatory compliance, supervisory expectations, and rule adherence',
      'Reporting and Disclosure': 'accuracy of regulatory submissions, transparency standards, and timely reporting',
      'Governance': 'board effectiveness, risk oversight, and senior manager accountability',
      'Prudential Requirements': 'capital adequacy, liquidity management, and solvency standards',
      'Not Categorised': 'general regulatory compliance and supervisory standards'
    }
    return contexts[category] || 'regulatory compliance and supervisory standards'
  }

  // ============================================================================
  // END YEAR SUMMARY METHODS
  // ============================================================================

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
