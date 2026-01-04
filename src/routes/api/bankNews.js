/**
 * Bank News API Routes
 *
 * Provides API endpoints for fetching bank news updates
 * filtered by source_category = 'bank_news'
 */

const dbService = require('../../services/dbService')
const { getAuthorityDisplayName } = require('../../utils/authorityRegistry')

function registerBankNewsRoutes(router) {
  // Get bank news updates
  router.get('/bank-news', async (req, res) => {
    try {
      const filters = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        sourceCategory: 'bank_news'
      }

      // Bank/Authority filter
      if (req.query.bank) {
        filters.authority = req.query.bank.split(',').map(b => b.trim()).filter(Boolean)
      }

      // Region filter
      if (req.query.region) {
        filters.region = req.query.region.split(',').map(r => r.trim()).filter(Boolean)
      }

      // Date range
      if (req.query.range) {
        const now = new Date()
        let startDate
        switch (req.query.range) {
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

      // Search query
      if (req.query.search) {
        filters.search = req.query.search
      }

      const updates = await dbService.getEnhancedUpdates(filters)

      res.json({
        success: true,
        total: updates.length,
        filters: {
          bank: filters.authority || null,
          region: filters.region || null
        },
        updates
      })
    } catch (error) {
      console.error('[bank-news] Failed to get updates:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // Get bank news stats
  router.get('/bank-news/stats', async (req, res) => {
    try {
      const updates = await dbService.getEnhancedUpdates({
        sourceCategory: 'bank_news',
        limit: 500
      })

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const bankCounts = {}
      const regionCounts = {}
      let thisWeek = 0

      for (const update of updates) {
        const bank = update.authority || 'Unknown'
        const region = update.region || 'Unknown'

        bankCounts[bank] = (bankCounts[bank] || 0) + 1
        regionCounts[region] = (regionCounts[region] || 0) + 1

        const updateDate = new Date(update.published_date || update.publishedDate || update.fetchedDate)
        if (updateDate >= weekAgo) {
          thisWeek++
        }
      }

      res.json({
        success: true,
        stats: {
          total: updates.length,
          thisWeek,
          banks: Object.keys(bankCounts).length
        },
        bankCounts: Object.entries(bankCounts)
          .map(([name, count]) => ({
            name,
            count,
            label: getAuthorityDisplayName(name) || name
          }))
          .sort((a, b) => b.count - a.count),
        regionCounts: Object.entries(regionCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      })
    } catch (error) {
      console.error('[bank-news] Failed to get stats:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // Get list of banks being tracked
  router.get('/bank-news/banks', async (req, res) => {
    try {
      const banks = [
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

      res.json({
        success: true,
        banks
      })
    } catch (error) {
      console.error('[bank-news] Failed to get banks:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })
}

module.exports = registerBankNewsRoutes
