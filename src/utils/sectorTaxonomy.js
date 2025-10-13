// src/utils/sectorTaxonomy.js
// Centralised helpers for working with sector metadata & aliases

const CANONICAL_ALIAS_MAP = {
  pensions: 'Pension Funds',
  pension: 'Pension Funds',
  pensionfund: 'Pension Funds',
  pensionfunds: 'Pension Funds',
  pensionsector: 'Pension Funds',
  pensionandretirement: 'Pension Funds',
  assetmanagers: 'Asset Management',
  assetmanager: 'Asset Management',
  wealth: 'Wealth Management',
  wealthmanagers: 'Wealth Management',
  wealthmanager: 'Wealth Management',
  fintechs: 'Fintech',
  cryptocurrencies: 'Cryptocurrency',
  cryptoassets: 'Cryptocurrency',
  paymentsindustry: 'Payments',
  paymentservices: 'Payments',
  paymentserviceproviders: 'Payments',
  investmentmanagers: 'Investment Management',
  investmentmanager: 'Investment Management',
  insurancefirms: 'Insurance',
  insurers: 'Insurance',
  insurance: 'Insurance',
  banking: 'Banking',
  bankingsector: 'Banking',
  banks: 'Banking'
}

const IGNORED_PATTERNS = [
  /^none/i,
  /^not applicable/i,
  /^all sectors/i,
  /^primary sector/i,
  /^n\/a$/i
]

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function normalizeSectorName(value) {
  if (!value) return ''
  const key = normalizeKey(value)
  const alias = CANONICAL_ALIAS_MAP[key]
  if (alias) return alias
  // Preserve existing capitalisation where possible
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : ''
}

function shouldIgnoreSector(value) {
  if (!value) return true
  const trimmed = value.trim()
  if (!trimmed) return true
  return IGNORED_PATTERNS.some(pattern => pattern.test(trimmed))
}

function prepareAvailableSectors(rawItems = [], options = {}) {
  const { max = 40, minCount = 1 } = options
  const seen = new Map()

  rawItems.forEach(item => {
    if (!item) return
    const originalName = item.name || item
    if (shouldIgnoreSector(originalName)) return

    const normalized = normalizeSectorName(originalName)
    if (!normalized) return

    const key = normalized.toLowerCase()
    const count = typeof item.count === 'number' ? item.count : 0
    if (!seen.has(key)) {
      seen.set(key, { name: normalized, count })
    } else {
      const entry = seen.get(key)
      entry.count += count
    }
  })

  const ordered = Array.from(seen.values())
    .filter(entry => entry.count >= minCount)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name)
    })

  return ordered.slice(0, max).map(entry => entry.name)
}

function getSectorAliasMap() {
  return { ...CANONICAL_ALIAS_MAP }
}

module.exports = {
  normalizeSectorName,
  prepareAvailableSectors,
  getSectorAliasMap
}
