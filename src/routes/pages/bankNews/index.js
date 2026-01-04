/**
 * Bank News Page Handler
 *
 * Fetches bank news updates and renders the page
 */

const { getSidebar } = require('../../templates/sidebar')
const dbService = require('../../../services/dbService')
const { renderBankNewsPage } = require('./template')

const BANKS = [
  { id: 'JPMorgan', name: 'JPMorgan Chase', region: 'Americas', country: 'US' },
  { id: 'BofA', name: 'Bank of America', region: 'Americas', country: 'US' },
  { id: 'Citigroup', name: 'Citigroup', region: 'Americas', country: 'US' },
  { id: 'WellsFargo', name: 'Wells Fargo', region: 'Americas', country: 'US' },
  { id: 'Goldman', name: 'Goldman Sachs', region: 'Americas', country: 'US' },
  { id: 'MorganStanley', name: 'Morgan Stanley', region: 'Americas', country: 'US' },
  { id: 'HSBC', name: 'HSBC', region: 'Europe', country: 'UK' },
  { id: 'Barclays', name: 'Barclays', region: 'Europe', country: 'UK' },
  { id: 'DeutscheBank', name: 'Deutsche Bank', region: 'Europe', country: 'Germany' },
  { id: 'UBS', name: 'UBS', region: 'Europe', country: 'Switzerland' }
]

const CATEGORY_DEFINITIONS = [
  {
    id: 'earnings',
    label: 'Earnings & Results',
    keywords: ['earnings', 'results', 'quarter', 'q1', 'q2', 'q3', 'q4', 'half-year', 'full-year', 'annual', 'profit', 'revenue', 'net income', 'dividend']
  },
  {
    id: 'deals',
    label: 'M&A / Deals',
    keywords: ['acquire', 'acquisition', 'acquired', 'merge', 'merger', 'deal', 'purchase', 'sale', 'divest', 'stake', 'joint venture', 'partnership']
  },
  {
    id: 'leadership',
    label: 'Leadership',
    keywords: ['appoint', 'appointed', 'ceo', 'cfo', 'coo', 'chief', 'chair', 'chairman', 'board', 'director', 'executive', 'president']
  },
  {
    id: 'technology',
    label: 'Technology',
    keywords: ['digital', 'technology', 'ai', 'artificial intelligence', 'cloud', 'cyber', 'platform', 'app', 'mobile', 'data', 'automation']
  },
  {
    id: 'esg',
    label: 'ESG',
    keywords: ['esg', 'sustainability', 'sustainable', 'climate', 'green', 'net zero', 'carbon', 'social', 'governance', 'responsible']
  },
  {
    id: 'regulatory',
    label: 'Legal & Regulatory',
    keywords: ['regulatory', 'compliance', 'fine', 'penalty', 'settlement', 'lawsuit', 'litigation', 'investigation', 'consent order', 'regulator']
  },
  {
    id: 'strategy',
    label: 'Strategy & Growth',
    keywords: ['strategy', 'strategic', 'growth', 'expansion', 'restructuring', 'restructure', 'reorganization', 'initiative', 'launch', 'plan', 'transformation', 'cost', 'efficiency']
  }
]

const CATEGORY_FALLBACK = { id: 'other', label: 'Other' }
const CATEGORY_IDS = new Set([
  'all',
  ...CATEGORY_DEFINITIONS.map(category => category.id),
  CATEGORY_FALLBACK.id
])

function matchesKeyword(text, keyword) {
  if (!text || !keyword) return false
  const normalized = String(keyword).toLowerCase()
  if (normalized.length <= 3 || normalized.includes(' ')) {
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = normalized.includes(' ')
      ? escaped.replace(/\s+/g, '\\s+')
      : `\\b${escaped}\\b`
    return new RegExp(pattern, 'i').test(text)
  }
  return text.includes(normalized)
}

function getBankNewsCategory(update) {
  const text = [
    update.content_type,
    update.contentType,
    update.category,
    update.headline,
    update.summary,
    update.ai_summary
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  for (const category of CATEGORY_DEFINITIONS) {
    if (category.keywords.some(keyword => matchesKeyword(text, keyword))) {
      return category.id
    }
  }

  return CATEGORY_FALLBACK.id
}

function attachCategories(updates) {
  return updates.map(update => ({
    ...update,
    bankCategory: getBankNewsCategory(update)
  }))
}

function buildCategoryStats(updates) {
  const counts = {}
  for (const update of updates) {
    const category = update.bankCategory || getBankNewsCategory(update)
    counts[category] = (counts[category] || 0) + 1
  }

  return [
    { id: 'all', label: 'All Topics', count: updates.length },
    ...CATEGORY_DEFINITIONS.map(category => ({
      id: category.id,
      label: category.label,
      count: counts[category.id] || 0
    })),
    { id: CATEGORY_FALLBACK.id, label: CATEGORY_FALLBACK.label, count: counts[CATEGORY_FALLBACK.id] || 0 }
  ]
}

function normalizeCategoryInput(value) {
  const normalized = String(value || '').toLowerCase().trim()
  if (!normalized || !CATEGORY_IDS.has(normalized)) return ''
  return normalized
}

// Calculate trend data for the last 30 days
function calculateTrendData(updates) {
  const days = []
  const now = new Date()

  // Generate last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    days.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count: 0
    })
  }

  // Count updates per day
  for (const update of updates) {
    const updateDate = new Date(update.published_date || update.publishedDate || update.fetchedDate)
    const dateStr = updateDate.toISOString().split('T')[0]
    const dayData = days.find(d => d.date === dateStr)
    if (dayData) {
      dayData.count++
    }
  }

  return days
}

// Calculate category distribution
function calculateCategoryDistribution(updates) {
  const distribution = {}

  // Initialize counts for all defined categories
  for (const category of CATEGORY_DEFINITIONS) {
    distribution[category.id] = { id: category.id, name: category.label, count: 0 }
  }
  distribution[CATEGORY_FALLBACK.id] = { id: CATEGORY_FALLBACK.id, name: CATEGORY_FALLBACK.label, count: 0 }

  for (const update of updates) {
    const categoryId = update.bankCategory || getBankNewsCategory(update)
    if (distribution[categoryId]) {
      distribution[categoryId].count++
    }
  }

  // Convert to sorted array
  return Object.values(distribution)
    .filter(cat => cat.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

// Calculate region distribution
function calculateRegionDistribution(updates, banks) {
  const regionMap = {}
  for (const bank of banks) {
    regionMap[bank.id] = bank.region
  }

  const distribution = { Americas: 0, Europe: 0, 'Asia-Pacific': 0 }

  for (const update of updates) {
    const bankId = update.authority || 'Unknown'
    const region = regionMap[bankId] || 'Unknown'
    if (distribution[region] !== undefined) {
      distribution[region]++
    }
  }

  return distribution
}

const bankNewsPage = async (req, res) => {
  try {
    const bank = req.query.bank || null
    const region = req.query.region || null
    const search = req.query.search || null
    const range = req.query.range || null
    const category = normalizeCategoryInput(req.query.category)

    // Get sidebar
    const sidebar = await getSidebar('bank-news')

    // Build filters for bank news
    const filters = {
      limit: 100,
      sourceCategory: 'bank_news'
    }

    // Bank filter
    if (bank) {
      filters.authority = bank
    }

    // Region filter
    if (region) {
      filters.region = region
    }

    // Search filter
    if (search) {
      filters.search = search
    }

    // Date range filter
    if (range) {
      const now = new Date()
      let startDate
      switch (range) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case '3d':
          startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          break
      }
      if (startDate) {
        filters.startDate = startDate
      }
    }

    // Bank authority IDs for filtering
    const bankAuthorityIds = BANKS.map(b => b.id)

    // Get bank news updates
    let updates = []
    try {
      // First try with sourceCategory filter
      updates = await dbService.getEnhancedUpdates(filters)

      // If no results with sourceCategory, try filtering by bank authorities
      if (updates.length === 0) {
        const fallbackFilters = { ...filters }
        delete fallbackFilters.sourceCategory
        if (!fallbackFilters.authority) {
          fallbackFilters.authority = bankAuthorityIds
        }
        updates = await dbService.getEnhancedUpdates(fallbackFilters)
      }
    } catch (dbError) {
      console.warn('[bank-news] Failed to fetch updates:', dbError.message)
    }

    // Get stats for all bank news
    let allBankNews = await dbService.getEnhancedUpdates({
      sourceCategory: 'bank_news',
      limit: 500
    }).catch(() => [])

    // Fallback: if no source_category data, get by bank authorities
    if (allBankNews.length === 0) {
      allBankNews = await dbService.getEnhancedUpdates({
        authority: bankAuthorityIds,
        limit: 500
      }).catch(() => [])
    }

    const allBankNewsWithCategories = attachCategories(allBankNews)
    const categoryStats = buildCategoryStats(allBankNewsWithCategories)
    updates = attachCategories(updates)
    if (category && category !== 'all') {
      updates = updates.filter(update => update.bankCategory === category)
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const bankCounts = {}
    let thisWeek = 0
    let aiAnalyzed = 0

    for (const update of allBankNews) {
      const updateBank = update.authority || 'Unknown'
      bankCounts[updateBank] = (bankCounts[updateBank] || 0) + 1

      const updateDate = new Date(update.published_date || update.publishedDate || update.fetchedDate)
      if (updateDate >= weekAgo) {
        thisWeek++
      }

      // Count AI analyzed updates
      if (update.ai_summary || update.business_impact_score) {
        aiAnalyzed++
      }
    }

    const stats = {
      total: allBankNews.length,
      thisWeek,
      banks: Object.keys(bankCounts).length || BANKS.length,
      aiAnalyzed
    }

    // Calculate chart data
    const chartData = {
      trend: calculateTrendData(allBankNews),
      bankDistribution: calculateCategoryDistribution(allBankNewsWithCategories),
      regionDistribution: calculateRegionDistribution(allBankNews, BANKS)
    }

    const currentFilters = {
      bank: bank || '',
      region: region || '',
      search: search || '',
      range: range || '',
      category: category || ''
    }

    const html = renderBankNewsPage({
      sidebar,
      stats,
      updates,
      banks: BANKS,
      currentFilters,
      chartData,
      categories: categoryStats
    })

    res.send(html)
  } catch (error) {
    console.error('Error rendering bank news page:', error)
    res.status(500).send(`
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1>Bank News Error</h1>
        <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
        <a href="/" style="color: #f59e0b; text-decoration: none;">&larr; Back to Home</a>
      </div>
    `)
  }
}

module.exports = bankNewsPage
