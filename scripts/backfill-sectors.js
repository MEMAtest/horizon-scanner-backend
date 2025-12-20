#!/usr/bin/env node
/**
 * Backfill Script: Re-process existing records with improved sector detection
 *
 * This script:
 * 1. Updates sector classifications using keyword-based inference
 * 2. Normalizes authority names to canonical form
 * 3. Reports statistics on changes made
 *
 * Usage:
 *   node scripts/backfill-sectors.js [--dry-run] [--limit N] [--authority-only] [--sector-only]
 *
 * Options:
 *   --dry-run       Preview changes without writing to database
 *   --limit N       Process only N records
 *   --authority-only  Only normalize authorities
 *   --sector-only   Only update sectors
 */

require('dotenv').config()
const { Pool } = require('pg')
const { normalizeAuthority, AUTHORITY_ALIASES } = require('../src/services/aiAnalyzer/normalization')

// Sector keyword patterns (same as in fallback.js)
const SECTOR_KEYWORD_PATTERNS = {
  'Investment Management': [
    'mifid', 'aifmd', 'ucits', 'fund manager', 'portfolio manager', 'investment firm',
    'asset manager', 'collective investment', 'fund distribution', 'esg investing',
    'sustainable investment', 'investment adviser', 'discretionary management'
  ],
  'Consumer Credit': [
    'consumer credit', 'bnpl', 'buy now pay later', 'consumer lending', 'personal loan',
    'credit card', 'hire purchase', 'consumer duty', 'affordability', 'creditworthiness',
    'consumer protection', 'vulnerable customer', 'overdraft', 'high-cost credit'
  ],
  'Banking': [
    'bank', 'banking', 'deposit', 'crd', 'crr', 'capital requirements', 'liquidity',
    'prudential', 'basel', 'leverage ratio', 'credit institution', 'deposit guarantee'
  ],
  'Payment Services': [
    'psd2', 'payment service', 'psp', 'open banking', 'sca', 'strong customer authentication',
    'payment initiation', 'account information', 'faster payments', 'real-time payments',
    'card payment', 'direct debit', 'bacs', 'chaps'
  ],
  'Insurance': [
    'solvency', 'insurance', 'insurer', 'underwriting', 'policyholder', 'idd',
    'insurance distribution', 'reinsurance', 'claims', 'premium', 'annuity'
  ],
  'Cryptocurrency': [
    'crypto', 'bitcoin', 'blockchain', 'digital asset', 'virtual currency', 'defi',
    'stablecoin', 'nft', 'token', 'distributed ledger', 'mica'
  ],
  'Capital Markets': [
    'mar', 'market abuse', 'insider dealing', 'securities', 'prospectus', 'listing',
    'trading venue', 'systematic internaliser', 'best execution', 'transaction reporting',
    'benchmark', 'libor', 'sonia', 'derivatives', 'emir', 'clearing'
  ],
  'Fintech': [
    'fintech', 'regtech', 'suptech', 'sandbox', 'innovation hub', 'digital transformation',
    'api', 'cloud', 'artificial intelligence', 'machine learning', 'automation'
  ],
  'Pension Funds': [
    'pension', 'iorp', 'workplace pension', 'auto-enrolment', 'defined benefit',
    'defined contribution', 'pension scheme', 'retirement', 'annuity'
  ],
  'Wealth Management': [
    'wealth', 'private bank', 'high net worth', 'family office', 'estate planning',
    'trust', 'fiduciary', 'investment advice'
  ],
  'AML/Financial Crime': [
    'aml', 'money laundering', 'financial crime', 'sanctions', 'kyc', 'cdd', 'pep',
    'terrorist financing', 'suspicious activity', 'transaction monitoring', 'fatf'
  ]
}

/**
 * Infer sectors from content using keyword matching
 */
function inferSectorsFromContent(content) {
  if (!content) return { sectors: ['General Regulation'], scores: {} }

  const lowerContent = content.toLowerCase()
  const scores = {}

  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORD_PATTERNS)) {
    let score = 0
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        score++
      }
    }
    if (score > 0) {
      scores[sector] = score
    }
  }

  // Sort by score and take top 3
  const sortedSectors = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector]) => sector)

  return {
    sectors: sortedSectors.length > 0 ? sortedSectors : ['General Regulation'],
    scores
  }
}

/**
 * Check if sector needs update
 */
function needsSectorUpdate(record) {
  // Update if sector is generic or missing
  const genericSectors = ['Banking', 'General', 'General Regulation', 'Other', null, undefined, '']
  return genericSectors.includes(record.sector)
}

/**
 * Check if authority needs normalization
 */
function needsAuthorityNormalization(authority) {
  if (!authority) return false
  const normalized = normalizeAuthority(authority)
  return normalized !== authority
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const authorityOnly = args.includes('--authority-only')
  const sectorOnly = args.includes('--sector-only')
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null

  console.log('\n=== Sector & Authority Backfill Script ===\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Limit: ${limit || 'None'}`)
  console.log(`Update sectors: ${!authorityOnly}`)
  console.log(`Update authorities: ${!sectorOnly}`)
  console.log('')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  const stats = {
    total: 0,
    sectorsUpdated: 0,
    authoritiesUpdated: 0,
    skipped: 0,
    errors: 0
  }

  try {
    // Fetch all records (using actual database columns)
    let query = `
      SELECT id, headline, summary, ai_summary, sector,
             firm_types_affected, authority, sector_relevance_scores
      FROM regulatory_updates
      ORDER BY created_at DESC
    `
    if (limit) {
      query += ` LIMIT ${limit}`
    }

    const result = await pool.query(query)
    const records = result.rows
    stats.total = records.length

    console.log(`Found ${records.length} records to process\n`)

    for (const record of records) {
      try {
        const updates = {}
        const changes = []

        // Check sector update
        if (!authorityOnly && needsSectorUpdate(record)) {
          const content = `${record.headline || ''} ${record.summary || ''} ${record.ai_summary || ''}`
          const { sectors, scores } = inferSectorsFromContent(content)

          if (sectors[0] !== record.sector) {
            updates.sector = sectors[0]
            updates.sector_relevance_scores = JSON.stringify(scores)

            // Also update firm_types_affected if it was generic
            const firmTypes = record.firm_types_affected
            const isGenericFirmType = !firmTypes || firmTypes.length === 0 ||
                (firmTypes.length === 1 && firmTypes[0] === 'Banking')
            if (isGenericFirmType) {
              updates.firm_types_affected = JSON.stringify(sectors)
              changes.push(`firm_types: updated to ${sectors.join(', ')}`)
            }

            changes.push(`sector: ${record.sector || 'null'} -> ${sectors[0]}`)
          }
        }

        // Check authority normalization
        if (!sectorOnly && record.authority && needsAuthorityNormalization(record.authority)) {
          const normalized = normalizeAuthority(record.authority)
          updates.authority = normalized
          changes.push(`authority: ${record.authority} -> ${normalized}`)
        }

        if (Object.keys(updates).length === 0) {
          stats.skipped++
          continue
        }

        // Apply updates
        if (!dryRun) {
          const setClauses = []
          const values = []
          let paramCount = 0

          for (const [key, value] of Object.entries(updates)) {
            setClauses.push(`${key} = $${++paramCount}`)
            values.push(value)
          }
          values.push(record.id)

          await pool.query(
            `UPDATE regulatory_updates SET ${setClauses.join(', ')} WHERE id = $${++paramCount}`,
            values
          )
        }

        // Update stats
        if (updates.sector) stats.sectorsUpdated++
        if (updates.authority) stats.authoritiesUpdated++

        // Log changes
        console.log(`[ID: ${record.id}] ${(record.headline || 'No headline').slice(0, 50)}...`)
        changes.forEach(change => console.log(`  -> ${change}`))

      } catch (err) {
        stats.errors++
        console.error(`[ID: ${record.id}] Error: ${err.message}`)
      }
    }

    // Print summary
    console.log('\n=== Summary ===')
    console.log(`Total records: ${stats.total}`)
    console.log(`Sectors updated: ${stats.sectorsUpdated}`)
    console.log(`Authorities normalized: ${stats.authoritiesUpdated}`)
    console.log(`Skipped (no changes needed): ${stats.skipped}`)
    console.log(`Errors: ${stats.errors}`)

    if (dryRun) {
      console.log('\n[DRY RUN] No changes were made. Run without --dry-run to apply.')
    }

  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
