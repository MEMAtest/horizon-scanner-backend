const { parseFinesJsonbFields } = require('../../utils/jsonbHelpers')

async function getRecentFines(limit = 20) {
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

async function getFinesTrends(period = 'monthly', limit = 12, options = {}) {
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

async function getHeatmapData(options = {}) {
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

async function getDistribution(options = {}) {
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

async function searchFines(searchParams = {}) {
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

async function getFinesByPeriod(period) {
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

module.exports = {
  getRecentFines,
  getFinesTrends,
  getHeatmapData,
  getDistribution,
  searchFines,
  getFinesByPeriod
}
