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

const bankNewsPage = async (req, res) => {
  try {
    const bank = req.query.bank || null
    const region = req.query.region || null
    const search = req.query.search || null
    const range = req.query.range || null

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

    // Get bank news updates
    let updates = []
    try {
      updates = await dbService.getEnhancedUpdates(filters)
    } catch (dbError) {
      console.warn('[bank-news] Failed to fetch updates:', dbError.message)
    }

    // Get stats for all bank news
    const allBankNews = await dbService.getEnhancedUpdates({
      sourceCategory: 'bank_news',
      limit: 500
    }).catch(() => [])

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const bankCounts = {}
    let thisWeek = 0

    for (const update of allBankNews) {
      const updateBank = update.authority || 'Unknown'
      bankCounts[updateBank] = (bankCounts[updateBank] || 0) + 1

      const updateDate = new Date(update.published_date || update.publishedDate || update.fetchedDate)
      if (updateDate >= weekAgo) {
        thisWeek++
      }
    }

    const stats = {
      total: allBankNews.length,
      thisWeek,
      banks: Object.keys(bankCounts).length || BANKS.length
    }

    const currentFilters = {
      bank: bank || '',
      region: region || '',
      search: search || '',
      range: range || ''
    }

    const html = renderBankNewsPage({
      sidebar,
      stats,
      updates,
      banks: BANKS,
      currentFilters
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
