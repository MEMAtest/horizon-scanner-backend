/**
 * Sector Mapping Configuration
 * Maps persona sectors to related INDUSTRY_SECTORS for flexible matching
 */

const SECTOR_GROUPS = {
  // Investment Firm - should match updates tagged with any of these
  investment: [
    'Investment Management',
    'Asset Management',
    'Capital Markets',
    'Wealth Management',
    'Alternative Investments',
    'Hedge Funds',
    'Private Equity'
  ],

  // Retail Bank - should match updates tagged with any of these
  retail_banking: [
    'Banking',
    'Retail Banking',
    'Consumer Credit',
    'Payment Services',
    'Mortgages'
  ],

  // Payments/Fintech
  payments_fintech: [
    'Payment Services',
    'Fintech',
    'Banking',
    'E-Money',
    'RegTech'
  ],

  // Insurance
  insurance: [
    'Insurance',
    'Life Insurance',
    'General Insurance',
    'Reinsurance'
  ],

  // Wealth Management
  wealth: [
    'Wealth Management',
    'Investment Management',
    'Private Banking',
    'Financial Planning'
  ],

  // Crypto/Digital Assets
  crypto: [
    'Cryptocurrency',
    'Digital Assets',
    'Fintech',
    'Payment Services'
  ],

  // Corporate Bank
  corporate_banking: [
    'Banking',
    'Commercial Banking',
    'Capital Markets',
    'Corporate Finance',
    'Trade Finance'
  ],

  // Consumer Credit
  consumer_credit: [
    'Consumer Credit',
    'Fintech',
    'Lending',
    'Retail Banking'
  ],

  // Pension Funds
  pensions: [
    'Pension Funds',
    'Investment Management',
    'Asset Management'
  ]
}

/**
 * Get all matching sectors for a persona ID
 * @param {string} personaId - The persona identifier
 * @returns {string[]} Array of matching sectors
 */
function getMatchingSectors(personaId) {
  const mapping = {
    investment_firm: SECTOR_GROUPS.investment,
    retail_bank: SECTOR_GROUPS.retail_banking,
    payments_fintech: SECTOR_GROUPS.payments_fintech,
    insurance: SECTOR_GROUPS.insurance,
    wealth_management: SECTOR_GROUPS.wealth,
    crypto_digital_assets: SECTOR_GROUPS.crypto,
    corporate_bank: SECTOR_GROUPS.corporate_banking,
    consumer_credit: SECTOR_GROUPS.consumer_credit,
    pension_provider: SECTOR_GROUPS.pensions
  }

  return mapping[personaId] || []
}

/**
 * Expand profile sectors to include related sectors from the same group
 * @param {string[]} sectors - Original sectors from profile
 * @returns {string[]} Expanded array including related sectors
 */
function expandProfileSectors(sectors) {
  if (!sectors || sectors.length === 0) {
    return []
  }

  const expanded = new Set(sectors)

  sectors.forEach(sector => {
    // Find which group(s) this sector belongs to
    Object.values(SECTOR_GROUPS).forEach(group => {
      if (group.includes(sector)) {
        // Add all related sectors from the same group
        group.forEach(relatedSector => expanded.add(relatedSector))
      }
    })
  })

  return Array.from(expanded)
}

/**
 * Get the primary sector group for a given sector
 * @param {string} sector - A sector name
 * @returns {string|null} Group name or null if not found
 */
function getSectorGroup(sector) {
  for (const [groupName, groupSectors] of Object.entries(SECTOR_GROUPS)) {
    if (groupSectors.includes(sector)) {
      return groupName
    }
  }
  return null
}

/**
 * Check if two sectors are related (in the same group)
 * @param {string} sector1
 * @param {string} sector2
 * @returns {boolean}
 */
function areSectorsRelated(sector1, sector2) {
  if (sector1 === sector2) return true

  for (const group of Object.values(SECTOR_GROUPS)) {
    if (group.includes(sector1) && group.includes(sector2)) {
      return true
    }
  }
  return false
}

module.exports = {
  SECTOR_GROUPS,
  getMatchingSectors,
  expandProfileSectors,
  getSectorGroup,
  areSectorsRelated
}
