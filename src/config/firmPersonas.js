/**
 * Firm Persona Configuration
 *
 * Defines preset firm types with their regulatory focus areas.
 * Each persona includes sectors, regulators, keywords, and relevance weights.
 */

const FIRM_PERSONAS = {
  investment_firm: {
    id: 'investment_firm',
    name: 'Investment Firm',
    description: 'Asset managers, fund managers, and investment advisers',
    icon: 'trending-up',
    color: '#3B82F6',
    sectors: [
      'Investment Management',
      'Asset Management',
      'Capital Markets',
      'Wealth Management',
      'Alternative Investments'
    ],
    regulators: ['FCA', 'ESMA', 'SEC', 'EBA'],
    keywords: [
      'MiFID',
      'AIFMD',
      'UCITS',
      'investment',
      'fund',
      'portfolio',
      'asset management',
      'discretionary',
      'suitability',
      'best execution'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Investment Management': 1.5,
      'Capital Markets': 1.3,
      'FCA': 1.4,
      'ESMA': 1.3
    }
  },

  retail_bank: {
    id: 'retail_bank',
    name: 'Retail Bank',
    description: 'Consumer banking, deposits, mortgages, and personal loans',
    icon: 'building-2',
    color: '#10B981',
    sectors: [
      'Banking',
      'Retail Banking',
      'Consumer Credit',
      'Payment Services',
      'Mortgages'
    ],
    regulators: ['FCA', 'PRA', 'Bank of England', 'PSR'],
    keywords: [
      'consumer duty',
      'mortgage',
      'deposit',
      'savings',
      'lending',
      'PSD2',
      'consumer credit',
      'current account',
      'overdraft',
      'vulnerable customers'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Banking': 1.5,
      'Retail Banking': 1.5,
      'Consumer Credit': 1.4,
      'FCA': 1.4,
      'PRA': 1.3
    }
  },

  payments_fintech: {
    id: 'payments_fintech',
    name: 'Payments / Fintech',
    description: 'Payment services, e-money institutions, and digital banking',
    icon: 'credit-card',
    color: '#F59E0B',
    sectors: [
      'Payment Services',
      'Fintech',
      'Banking',
      'E-Money'
    ],
    regulators: ['FCA', 'PSR', 'Bank of England', 'EBA'],
    keywords: [
      'PSD2',
      'open banking',
      'e-money',
      'payment',
      'APP fraud',
      'PSR',
      'faster payments',
      'authorised push payment',
      'confirmation of payee',
      'payment initiation'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Payment Services': 1.6,
      'Fintech': 1.5,
      'PSR': 1.5,
      'FCA': 1.3
    }
  },

  insurance: {
    id: 'insurance',
    name: 'Insurance',
    description: 'Life, general, and health insurance providers',
    icon: 'shield',
    color: '#8B5CF6',
    sectors: [
      'Insurance',
      'Life Insurance',
      'General Insurance',
      'Reinsurance'
    ],
    regulators: ['FCA', 'PRA', 'EIOPA'],
    keywords: [
      'Solvency II',
      'insurance',
      'underwriting',
      'claims',
      'EIOPA',
      'IDD',
      'policyholder',
      'premium',
      'actuarial',
      'reserving'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Insurance': 1.6,
      'PRA': 1.4,
      'EIOPA': 1.4
    }
  },

  wealth_management: {
    id: 'wealth_management',
    name: 'Wealth Management',
    description: 'Private banking, wealth advisers, and family offices',
    icon: 'gem',
    color: '#EC4899',
    sectors: [
      'Wealth Management',
      'Investment Management',
      'Private Banking',
      'Financial Planning'
    ],
    regulators: ['FCA', 'ESMA', 'HMRC'],
    keywords: [
      'wealth',
      'private banking',
      'high net worth',
      'HNWI',
      'discretionary',
      'advisory',
      'suitability',
      'family office',
      'inheritance',
      'trust'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Wealth Management': 1.6,
      'Investment Management': 1.3,
      'FCA': 1.4
    }
  },

  crypto_digital_assets: {
    id: 'crypto_digital_assets',
    name: 'Crypto / Digital Assets',
    description: 'Cryptocurrency exchanges, custodians, and digital asset firms',
    icon: 'bitcoin',
    color: '#F97316',
    sectors: [
      'Cryptocurrency',
      'Digital Assets',
      'Fintech',
      'Payment Services'
    ],
    regulators: ['FCA', 'ESMA', 'EBA', 'FATF', 'HMT'],
    keywords: [
      'crypto',
      'digital asset',
      'DeFi',
      'stablecoin',
      'MiCA',
      'virtual asset',
      'blockchain',
      'cryptoasset',
      'token',
      'custody',
      'VASP'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Cryptocurrency': 1.7,
      'Digital Assets': 1.6,
      'Fintech': 1.3,
      'FATF': 1.4
    }
  },

  corporate_bank: {
    id: 'corporate_bank',
    name: 'Corporate / Investment Bank',
    description: 'Corporate lending, trade finance, and wholesale banking',
    icon: 'landmark',
    color: '#6366F1',
    sectors: [
      'Banking',
      'Commercial Banking',
      'Capital Markets',
      'Corporate Finance',
      'Trade Finance'
    ],
    regulators: ['FCA', 'PRA', 'Bank of England', 'EBA', 'FATF'],
    keywords: [
      'Basel',
      'capital requirements',
      'trade finance',
      'wholesale',
      'corporate lending',
      'syndicated',
      'derivatives',
      'treasury',
      'liquidity',
      'stress testing'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Banking': 1.4,
      'Capital Markets': 1.4,
      'PRA': 1.5,
      'Bank of England': 1.4
    }
  },

  consumer_credit: {
    id: 'consumer_credit',
    name: 'Consumer Credit',
    description: 'Consumer lenders, credit brokers, and BNPL providers',
    icon: 'wallet',
    color: '#14B8A6',
    sectors: [
      'Consumer Credit',
      'Fintech',
      'Lending'
    ],
    regulators: ['FCA'],
    keywords: [
      'consumer credit',
      'BNPL',
      'buy now pay later',
      'lending',
      'affordability',
      'consumer duty',
      'debt collection',
      'credit reference',
      'APR',
      'high cost credit'
    ],
    excludeKeywords: [],
    relevanceBoost: {
      'Consumer Credit': 1.7,
      'FCA': 1.5
    }
  }
}

/**
 * Get a persona by ID
 */
function getPersonaById(personaId) {
  return FIRM_PERSONAS[personaId] || null
}

/**
 * Get all personas
 */
function getAllPersonas() {
  return Object.values(FIRM_PERSONAS)
}

/**
 * Get persona summary (for dropdowns/selectors)
 */
function getPersonaSummaries() {
  return Object.values(FIRM_PERSONAS).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    icon: p.icon,
    color: p.color
  }))
}

/**
 * Merge a base persona with custom configuration
 */
function getMergedPersona(basePersona, customConfig = {}) {
  if (!basePersona) return null

  return {
    ...basePersona,
    sectors: customConfig.sectors || basePersona.sectors,
    regulators: customConfig.regulators || basePersona.regulators,
    keywords: customConfig.keywords || basePersona.keywords,
    excludeKeywords: customConfig.excludeKeywords || basePersona.excludeKeywords,
    relevanceBoost: {
      ...basePersona.relevanceBoost,
      ...(customConfig.relevanceBoost || {})
    }
  }
}

module.exports = {
  FIRM_PERSONAS,
  getPersonaById,
  getAllPersonas,
  getPersonaSummaries,
  getMergedPersona
}
