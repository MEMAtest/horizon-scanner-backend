/**
 * FCA Handbook Service
 * Provides rule lookups with intelligent matching and optional FCA API integration
 */

const axios = require('axios');

// Import static rules
const { FCA_HANDBOOK_RULES } = require('../../public/js/publications/fca-handbook-rules.js');

// Cache for API lookups
const ruleCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse a handbook reference into components
 * @param {string} ref - e.g., "SUP 16.3.13R", "PRIN 11", "COBS 9.2.1G"
 * @returns {Object} Parsed reference components
 */
function parseReference(ref) {
  if (!ref) return null;

  const cleaned = ref.trim().toUpperCase();

  // Pattern: SOURCEBOOK CHAPTER[.SECTION[.PARAGRAPH]][RULE_TYPE]
  // Examples: "PRIN 11", "SUP 16.3", "SUP 16.3.13R", "COBS 9.2.1G"
  const match = cleaned.match(/^([A-Z]+)\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?([RGD])?$/);

  if (!match) {
    // Try simpler pattern for non-standard references
    const simpleMatch = cleaned.match(/^([A-Z]+)\s*(.+)$/);
    if (simpleMatch) {
      return {
        sourcebook: simpleMatch[1],
        fullRef: cleaned,
        raw: ref
      };
    }
    return null;
  }

  const [, sourcebook, chapter, section, paragraph, ruleType] = match;

  return {
    sourcebook,
    chapter: parseInt(chapter),
    section: section ? parseInt(section) : null,
    paragraph: paragraph ? parseInt(paragraph) : null,
    ruleType: ruleType || null,
    fullRef: cleaned,
    raw: ref,
    // Generate possible lookup keys from most specific to least
    lookupKeys: generateLookupKeys(sourcebook, chapter, section, paragraph)
  };
}

/**
 * Generate possible lookup keys from most specific to least
 */
function generateLookupKeys(sourcebook, chapter, section, paragraph) {
  const keys = [];

  // Most specific first
  if (paragraph !== null && section !== null) {
    keys.push(`${sourcebook} ${chapter}.${section}.${paragraph}`);
  }
  if (section !== null) {
    keys.push(`${sourcebook} ${chapter}.${section}`);
  }
  keys.push(`${sourcebook} ${chapter}`);
  keys.push(sourcebook);

  return keys;
}

/**
 * Find the best matching rule from static data
 * @param {string} ref - The handbook reference
 * @returns {Object|null} The matched rule or null
 */
function findStaticRule(ref) {
  const parsed = parseReference(ref);
  if (!parsed) return null;

  // Direct lookup first
  if (FCA_HANDBOOK_RULES[parsed.fullRef]) {
    return FCA_HANDBOOK_RULES[parsed.fullRef];
  }

  // Try lookup keys in order of specificity
  if (parsed.lookupKeys) {
    for (const key of parsed.lookupKeys) {
      if (FCA_HANDBOOK_RULES[key]) {
        return FCA_HANDBOOK_RULES[key];
      }
    }
  }

  // Fuzzy match on sourcebook + chapter
  const prefix = parsed.sourcebook + ' ' + (parsed.chapter || '');
  for (const [key, rule] of Object.entries(FCA_HANDBOOK_RULES)) {
    if (key.startsWith(prefix)) {
      return rule;
    }
  }

  return null;
}

/**
 * Get rule details with enhanced matching
 * @param {string} ref - The handbook reference
 * @returns {Object} Rule details or default fallback
 */
function getRuleDetails(ref) {
  const parsed = parseReference(ref);
  const staticRule = findStaticRule(ref);

  if (staticRule) {
    return {
      reference: ref,
      title: staticRule.title,
      category: staticRule.category,
      summary: staticRule.summary,
      fullDescription: staticRule.fullDescription,
      implications: staticRule.implications,
      typicalBreaches: staticRule.typicalBreaches || [],
      relatedRules: staticRule.relatedRules || [],
      matched: true,
      matchedKey: parsed ? parsed.lookupKeys?.find(k => FCA_HANDBOOK_RULES[k]) : ref
    };
  }

  // Return a formatted fallback
  const sourcebook = parsed?.sourcebook || ref.split(/[\s\d]/)[0] || 'REG';

  // Generate category from sourcebook
  const categoryMap = {
    'PRIN': 'Principles',
    'SYSC': 'Systems & Controls',
    'SUP': 'Supervision',
    'COBS': 'Conduct of Business',
    'CASS': 'Client Assets',
    'MAR': 'Market Conduct',
    'COCON': 'Conduct Rules',
    'ICOBS': 'Insurance Conduct',
    'MCOB': 'Mortgage Conduct',
    'CONC': 'Consumer Credit',
    'APER': 'Approved Persons',
    'FIT': 'Fit & Proper',
    'TC': 'Training & Competence',
    'DISP': 'Dispute Resolution',
    'MLR': 'Money Laundering',
    'GENPRU': 'Prudential Standards',
    'BIPRU': 'Prudential (Banks)',
    'IFPRU': 'Investment Firm Prudential',
    'MIFIDPRU': 'MiFID Prudential'
  };

  return {
    reference: ref,
    title: ref,
    category: categoryMap[sourcebook] || sourcebook,
    summary: `FCA ${sourcebook} regulatory requirement`,
    fullDescription: null,
    implications: null,
    typicalBreaches: [],
    relatedRules: [],
    matched: false,
    matchedKey: null
  };
}

/**
 * Batch get rule details for multiple references
 * @param {string[]} refs - Array of handbook references
 * @returns {Object} Map of reference to details
 */
function getBatchRuleDetails(refs) {
  const results = {};
  for (const ref of refs) {
    results[ref] = getRuleDetails(ref);
  }
  return results;
}

/**
 * Get category color for display
 * @param {string} category - The rule category
 * @returns {string} Hex color code
 */
function getCategoryColor(category) {
  const colors = {
    'Principles': '#3b82f6',
    'Systems & Controls': '#8b5cf6',
    'Supervision': '#f59e0b',
    'Conduct of Business': '#10b981',
    'Client Assets': '#ef4444',
    'Market Conduct': '#ec4899',
    'Senior Managers': '#6366f1',
    'Conduct Rules': '#14b8a6',
    'Insurance Conduct': '#06b6d4',
    'Mortgage Conduct': '#0ea5e9',
    'Consumer Credit': '#f97316',
    'PRIN': '#3b82f6',
    'SYSC': '#8b5cf6',
    'SUP': '#f59e0b',
    'COBS': '#10b981',
    'CASS': '#ef4444',
    'MAR': '#ec4899',
    'COCON': '#14b8a6',
    'ICOBS': '#06b6d4',
    'MCOB': '#0ea5e9',
    'CONC': '#f97316'
  };

  return colors[category] || '#64748b';
}

/**
 * Fetch from FCA Handbook API (optional enhancement)
 * Note: FCA Handbook API may require registration or have rate limits
 * This is a placeholder for future API integration
 */
async function fetchFromFCAApi(ref) {
  const parsed = parseReference(ref);
  if (!parsed) return null;

  const cacheKey = parsed.fullRef;
  const cached = ruleCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
    return cached.data;
  }

  // FCA Handbook doesn't have a public REST API
  // This would need to be implemented with web scraping or official API access
  // For now, return null to fall back to static rules
  return null;
}

module.exports = {
  parseReference,
  findStaticRule,
  getRuleDetails,
  getBatchRuleDetails,
  getCategoryColor,
  fetchFromFCAApi,
  FCA_HANDBOOK_RULES
};
