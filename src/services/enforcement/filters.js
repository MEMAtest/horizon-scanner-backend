/**
 * Filtering and parsing helpers for enforcement data.
 */

/**
 * Build WHERE clause conditions for filtering fines
 * @param {Object} filterParams - Filter parameters
 * @returns {string} WHERE clause SQL fragment
 */
function buildFilterWhereClause(filterParams = {}) {
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

/**
 * Parse JSONB field (handles double/triple JSON encoding)
 * @param {any} value - JSONB field value from database
 * @returns {Array} Parsed array or empty array
 */
function parseJsonbField(value) {
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
function inferSectorFromFirmCategory(firmCategory) {
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
function getCategoryContext(category) {
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

module.exports = {
  buildFilterWhereClause,
  parseJsonbField,
  inferSectorFromFirmCategory,
  getCategoryContext
}
