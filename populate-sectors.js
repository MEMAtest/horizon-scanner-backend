#!/usr/bin/env node

/**
 * Populate affected_sectors using comprehensive pattern matching
 * and direct firm-to-sector mappings
 */

require('dotenv').config()
const { Pool } = require('pg')

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
}

// Direct firm name to sector mapping for known companies
const FIRM_SECTOR_MAP = {
  // Investment Banks
  'goldman sachs': 'Investment Banking',
  'merrill lynch': 'Investment Banking',
  'ubs ag': 'Investment Banking',
  'citigroup': 'Investment Banking',
  'jp morgan': 'Investment Banking',
  'morgan stanley': 'Investment Banking',
  'deutsche bank': 'Investment Banking',
  'credit suisse': 'Investment Banking',
  'nomura': 'Investment Banking',

  // Brokers & Trading
  'icap': 'Brokerage & Trading',
  'tullet prebon': 'Brokerage & Trading',
  'tfs-icap': 'Brokerage & Trading',
  'execution noble': 'Brokerage & Trading',
  'linear investments': 'Brokerage & Trading',
  'sigma broking': 'Brokerage & Trading',
  'sapien capital': 'Brokerage & Trading',
  'forex tb': 'Brokerage & Trading',
  'infinox capital': 'Brokerage & Trading',
  'mako financial': 'Brokerage & Trading',
  'ct capital': 'Brokerage & Trading',
  'da vinci invest': 'Brokerage & Trading',
  'london metal exchange': 'Brokerage & Trading',
  'w h ireland': 'Brokerage & Trading',

  // Insurance
  'besso': 'Insurance',
  'jlt specialty': 'Insurance',
  'towergate': 'Insurance',
  'swinton': 'Insurance',
  'standard life': 'Insurance',
  'homeserve': 'Insurance',
  'coverall worldwide': 'Insurance',

  // Asset Management
  'aberdeen asset': 'Asset Management',
  'aberdeen fund': 'Asset Management',
  'henderson investment': 'Asset Management',
  'hargreave hale': 'Asset Management',
  'sei investments': 'Asset Management',
  'asia research and capital': 'Asset Management',

  // Consumer Finance
  'tesco personal finance': 'Consumer Finance',
  'moneybarn': 'Consumer Finance',
  'volkswagen financial': 'Consumer Finance',
  'dollar east': 'Consumer Finance',
  'lcc trans-sending': 'Consumer Finance',
  'hafiz bros': 'Consumer Finance',
  'carphone warehouse': 'Consumer Finance',
  'equifax': 'Consumer Finance',
  'r.raphael': 'Consumer Finance',

  // Wealth Management / Financial Planning
  'charles schwab': 'Wealth Management',
  'chase de vere': 'Wealth Management',
  'sesame limited': 'Wealth Management',
  'john joseph financial': 'Wealth Management',
  'inspirational financial': 'Wealth Management',
  'lj financial': 'Wealth Management',
  'porta verde': 'Wealth Management',
  'arian financial': 'Wealth Management',
  'moorhouse group': 'Wealth Management',

  // Insurance Brokers
  'policy administration': 'Insurance',
  'hall and hanley': 'Insurance',
  'crosfill and archer': 'Insurance',
  'professional personal claims': 'Insurance',
  'bastion capital': 'Insurance',

  // Commodities / Mining
  'asia resource minerals': 'Commodities',
  'bumi': 'Commodities',
  'rio tinto': 'Commodities',

  // Audit/Accounting
  'pricewaterhousecoopers': 'Audit & Accounting',
  'pwc': 'Audit & Accounting',
  'deloitte': 'Audit & Accounting',
  'kpmg': 'Audit & Accounting',
  'ernst & young': 'Audit & Accounting',

  // Retail/Consumer
  'reckitt benckiser': 'Consumer Goods',
  'cathay international': 'Consumer Goods',
  'mineworld': 'Consumer Goods',
  'tejoori': 'Retail Investment',
  'quick purchase': 'Retail Investment',
}

// Individual to sector mapping (senior executives at known firms)
const INDIVIDUAL_SECTOR_MAP = {
  'james edward staley': 'Investment Banking', // Former Barclays CEO
  'achilles othon macris': 'Investment Banking', // JPMorgan - London Whale
  'jes staley': 'Investment Banking',
  'ian charles hannam': 'Investment Banking', // JPMorgan Cazenove
  'neil danziger': 'Investment Banking',
  'guillaume adolph': 'Investment Banking',
  'neil dwane': 'Asset Management',
  'kristo käärmann': 'Payments & E-Money', // Wise founder
  'michael coscia': 'Brokerage & Trading', // Spoofing
  'markos theodosi markou': 'Brokerage & Trading',
}

// Keyword patterns for sector inference
const SECTOR_KEYWORDS = {
  'Banking': [
    'bank', 'building society', 'hsbc', 'barclays', 'lloyds', 'natwest',
    'santander', 'nationwide', 'tsb', 'metro bank', 'virgin money'
  ],
  'Insurance': [
    'insurance', 'insurer', 'underwriter', 'underwriting', 'aviva', 'axa',
    'prudential', 'legal & general', 'zurich', 'allianz', 'claims'
  ],
  'Asset Management': [
    'asset management', 'investment manager', 'fund manager', 'portfolio',
    'blackrock', 'vanguard', 'fidelity', 'schroders', 'fund limited',
    'asset managers'
  ],
  'Wealth Management': [
    'wealth', 'private bank', 'financial advisor', 'financial planner',
    'wealth management', 'financial services limited', 'independent financial'
  ],
  'Payments & E-Money': [
    'payment', 'e-money', 'emoney', 'fintech', 'paypal', 'stripe',
    'revolut', 'monzo', 'starling', 'wise', 'transfer', 'remittance'
  ],
  'Investment Services': [
    'securities', 'capital markets', 'stockbroker', 'investment services'
  ],
  'Brokerage & Trading': [
    'broker', 'dealing', 'trading', 'execution', 'forex', 'cfd',
    'spread betting', 'interdealer'
  ],
  'Mortgages': [
    'mortgage', 'home finance', 'home loan'
  ],
  'Consumer Finance': [
    'credit', 'loan', 'lending', 'consumer finance', 'car finance',
    'personal finance', 'hire purchase'
  ],
  'Pensions': [
    'pension', 'retirement', 'annuit'
  ]
}

/**
 * Comprehensive sector inference
 */
function inferSector(firmName) {
  if (!firmName || typeof firmName !== 'string') {
    return null
  }

  const name = firmName.toLowerCase().trim()

  // Check direct firm mapping first
  for (const [firmKey, sector] of Object.entries(FIRM_SECTOR_MAP)) {
    if (name.includes(firmKey)) {
      return sector
    }
  }

  // Check individual mapping
  for (const [individual, sector] of Object.entries(INDIVIDUAL_SECTOR_MAP)) {
    if (name.includes(individual)) {
      return sector
    }
  }

  // Check keyword patterns
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        return sector
      }
    }
  }

  // Special patterns
  // "Limited" at end often indicates regulated financial firm
  if (name.endsWith(' limited') || name.endsWith(' ltd')) {
    // Check for common financial terms
    if (name.includes('capital') || name.includes('invest')) {
      return 'Investment Services'
    }
    if (name.includes('financial')) {
      return 'Financial Services'
    }
  }

  // "plc" at end indicates public company
  if (name.includes(' plc')) {
    if (name.includes('finance') || name.includes('financial')) {
      return 'Financial Services'
    }
  }

  return null
}

/**
 * Check if name is likely an individual (not a company)
 */
function isLikelyIndividual(name) {
  if (!name) return false

  const lowerName = name.toLowerCase()

  // Company indicators
  const companyIndicators = [
    'limited', 'ltd', 'plc', 'llp', 'inc', 'corporation', 'corp',
    'group', 'bank', 'insurance', 'holdings', 'services', 'capital',
    'exchange', 'financial', 'management', 'partners', 'investments'
  ]

  for (const indicator of companyIndicators) {
    if (lowerName.includes(indicator)) {
      return false
    }
  }

  // Check if it looks like a person's name (2-4 words, no punctuation)
  const words = name.trim().split(/\s+/)
  if (words.length >= 2 && words.length <= 4) {
    // Check each word starts with uppercase (typical for names)
    const allCapitalized = words.every(word =>
      word.length > 0 && word[0] === word[0].toUpperCase()
    )
    if (allCapitalized) {
      return true
    }
  }

  return false
}

async function main() {
  console.log('🚀 Populating sectors with comprehensive matching...')
  console.log('=' .repeat(60))

  const db = new Pool(dbConfig)

  try {
    // Get all fines with their data
    const fines = await db.query(`
      SELECT id, firm_individual, firm_category, affected_sectors, summary
      FROM fca_fines
      ORDER BY date_issued DESC
    `)

    console.log(`📊 Found ${fines.rows.length} fines`)
    console.log()

    let updated = 0
    let skipped = 0
    let individuals = 0
    const sectorCounts = {}
    const unmatchedFirms = []

    for (const fine of fines.rows) {
      // Check if already has sectors
      const currentSectors = fine.affected_sectors
      const hasData = currentSectors && currentSectors !== '[]' && currentSectors.length > 2

      if (hasData) {
        skipped++
        continue
      }

      // Infer sector from firm name
      let inferredSector = inferSector(fine.firm_individual)

      // If no match and looks like individual, mark as individual
      if (!inferredSector && isLikelyIndividual(fine.firm_individual)) {
        individuals++
        // Try to infer from summary if available
        if (fine.summary) {
          inferredSector = inferSector(fine.summary)
        }
        if (!inferredSector) {
          inferredSector = 'Individual' // Mark as individual for now
        }
      }

      if (inferredSector) {
        // Update with inferred sector
        await db.query(`
          UPDATE fca_fines
          SET affected_sectors = $1
          WHERE id = $2
        `, [JSON.stringify([inferredSector]), fine.id])

        updated++
        sectorCounts[inferredSector] = (sectorCounts[inferredSector] || 0) + 1

        if (updated % 20 === 0) {
          console.log(`   ✅ Updated ${updated} fines...`)
        }
      } else {
        unmatchedFirms.push(fine.firm_individual)
      }
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('🎉 Sector population complete!')
    console.log()
    console.log('📈 Results:')
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ⏭️  Skipped (already had data): ${skipped}`)
    console.log(`   👤 Individuals identified: ${individuals}`)
    console.log(`   📊 Total processed: ${fines.rows.length}`)
    console.log(`   📈 Coverage: ${Math.round((updated + skipped)/fines.rows.length*100)}%`)
    console.log()
    console.log('📊 Sector Distribution:')
    const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])
    for (const [sector, count] of sortedSectors) {
      console.log(`   ${sector}: ${count}`)
    }

    if (unmatchedFirms.length > 0) {
      console.log()
      console.log(`⚠️  ${unmatchedFirms.length} firms could not be matched:`)
      unmatchedFirms.slice(0, 20).forEach(f => console.log(`   - ${f}`))
      if (unmatchedFirms.length > 20) {
        console.log(`   ... and ${unmatchedFirms.length - 20} more`)
      }
    }

    await db.end()
    process.exit(0)

  } catch (error) {
    console.error('❌ Fatal error:', error)
    await db.end()
    process.exit(1)
  }
}

main()
