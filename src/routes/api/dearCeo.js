/**
 * Dear CEO Letters & Supervisory Statements API Routes
 *
 * Premium analysis endpoints for FCA Dear CEO letters and PRA Supervisory Statements
 */

const dearCeoAnalyzer = require('../../services/dearCeoAnalyzer')
const dearCeoTrendService = require('../../services/dearCeoTrendService')

function registerDearCeoRoutes(router) {
  /**
   * GET /api/dear-ceo/letters
   * Get all Dear CEO letters with optional filters
   */
  router.get('/dear-ceo/letters', async (req, res) => {
    try {
      const filters = {
        authority: req.query.authority,
        theme: req.query.theme,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        limit: parseInt(req.query.limit) || 100
      }

      const letters = await dearCeoAnalyzer.getLetters(filters)

      // Add basic theme extraction for list view
      const enrichedLetters = letters.map(letter => {
        const themes = dearCeoAnalyzer.extractThemes(
          letter.headline,
          letter.ai_summary || letter.headline
        )
        return {
          ...letter,
          themes: themes.slice(0, 3).map(t => t.name),
          contentType: letter.content_type || 'Dear CEO Letter'
        }
      })

      res.json({
        success: true,
        count: enrichedLetters.length,
        letters: enrichedLetters
      })
    } catch (error) {
      console.error('Error fetching Dear CEO letters:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/dear-ceo/letters/:id
   * Get a specific letter with basic info
   */
  router.get('/dear-ceo/letters/:id', async (req, res) => {
    try {
      const { id } = req.params

      const letters = await dearCeoAnalyzer.getLetters({ limit: 1000 })
      const letter = letters.find(l => l.id === id)

      if (!letter) {
        return res.status(404).json({
          success: false,
          error: 'Letter not found'
        })
      }

      const themes = dearCeoAnalyzer.extractThemes(
        letter.headline,
        letter.ai_summary || letter.headline
      )

      res.json({
        success: true,
        letter: {
          ...letter,
          themes: themes.map(t => ({ name: t.name, relevance: t.score }))
        }
      })
    } catch (error) {
      console.error('Error fetching letter:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/dear-ceo/analysis/:id
   * Get full one-pager analysis for a letter
   */
  router.get('/dear-ceo/analysis/:id', async (req, res) => {
    try {
      const { id } = req.params

      const onePager = await dearCeoAnalyzer.generateOnePager(id)

      res.json({
        success: true,
        analysis: onePager
      })
    } catch (error) {
      console.error('Error generating one-pager:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/dear-ceo/themes
   * Get theme trends over time (5 years)
   */
  router.get('/dear-ceo/themes', async (req, res) => {
    try {
      const options = {
        years: parseInt(req.query.years) || 5,
        groupBy: req.query.groupBy || 'quarter',
        authority: req.query.authority || null
      }

      const trends = await dearCeoTrendService.getThemeTrends(options)

      res.json({
        success: true,
        trends
      })
    } catch (error) {
      console.error('Error fetching theme trends:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/dear-ceo/themes/:themeKey
   * Get evolution of a specific theme
   */
  router.get('/dear-ceo/themes/:themeKey', async (req, res) => {
    try {
      const { themeKey } = req.params
      const years = parseInt(req.query.years) || 5

      const evolution = await dearCeoTrendService.getThemeEvolution(themeKey.toUpperCase(), years)

      if (!evolution) {
        return res.status(404).json({
          success: false,
          error: 'Theme not found'
        })
      }

      res.json({
        success: true,
        evolution
      })
    } catch (error) {
      console.error('Error fetching theme evolution:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/dear-ceo/summary
   * Get summary statistics for Dear CEO letters
   */
  router.get('/dear-ceo/summary', async (req, res) => {
    try {
      const letters = await dearCeoAnalyzer.getLetters({})

      // Count by authority
      const byAuthority = {}
      const byYear = {}
      const allThemes = {}

      for (const letter of letters) {
        // Count by authority
        const auth = letter.authority || 'Unknown'
        byAuthority[auth] = (byAuthority[auth] || 0) + 1

        // Count by year
        if (letter.published_date) {
          const year = new Date(letter.published_date).getFullYear()
          byYear[year] = (byYear[year] || 0) + 1
        }

        // Count themes
        const themes = dearCeoAnalyzer.extractThemes(
          letter.headline,
          letter.ai_summary || letter.headline
        )
        for (const theme of themes) {
          allThemes[theme.name] = (allThemes[theme.name] || 0) + 1
        }
      }

      // Sort themes by frequency
      const topThemes = Object.entries(allThemes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count, percentage: Math.round((count / letters.length) * 100) }))

      res.json({
        success: true,
        summary: {
          totalLetters: letters.length,
          byAuthority,
          byYear,
          topThemes,
          latestLetter: letters[0] ? {
            headline: letters[0].headline,
            publishedDate: letters[0].published_date,
            authority: letters[0].authority
          } : null
        }
      })
    } catch (error) {
      console.error('Error generating summary:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/dear-ceo/actions
   * Get all actions from all Dear CEO letters (efficient single query)
   */
  router.get('/dear-ceo/actions', async (req, res) => {
    try {
      const letters = await dearCeoAnalyzer.getLetters({ limit: 500 })
      const allActions = []

      for (const letter of letters) {
        // Parse cached analysis from ai_summary
        let analysis = null
        if (letter.ai_summary && letter.ai_summary.trim().startsWith('{')) {
          try {
            analysis = JSON.parse(letter.ai_summary)
          } catch (e) {
            // Not valid JSON
          }
        }

        if (analysis) {
          // Use complianceChecklist if available, else actionItems
          const checklist = analysis.complianceChecklist || []
          const actionItems = analysis.actionItems || []

          const items = checklist.length > 0 ? checklist : actionItems.map((a, idx) => ({
            id: `${letter.id}-action-${idx}`,
            action: a.action,
            owner: a.owner || 'Compliance',
            deadline: a.deadline || null,
            priority: a.priority === 1 ? 'Critical' : a.priority === 2 ? 'High' : 'Medium'
          }))

          items.forEach(item => {
            allActions.push({
              ...item,
              letterId: letter.id,
              letterHeadline: (letter.headline || '').replace(/\s*\[pdf\]\s*/gi, '').trim(),
              letterDate: letter.published_date,
              authority: letter.authority
            })
          })
        }
      }

      res.json({
        success: true,
        count: allActions.length,
        actions: allActions
      })
    } catch (error) {
      console.error('Error fetching actions:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * POST /api/dear-ceo/analyze-all
   * Batch analyze all Dear CEO letters (generates one-pager for each)
   */
  router.post('/dear-ceo/analyze-all', async (req, res) => {
    try {
      const options = {
        limit: parseInt(req.body.limit) || 1000,
        skipExisting: req.body.skipExisting !== false // Default true
      }

      console.log('[Dear CEO] Starting batch analysis...')
      const results = await dearCeoAnalyzer.batchAnalyzeAll(options)

      res.json({
        success: true,
        message: `Analyzed ${results.processed} letters`,
        results
      })
    } catch (error) {
      console.error('Error during batch analysis:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * POST /api/dear-ceo/ai-analyze-all
   * Batch AI analyze all Dear CEO letters using Claude Sonnet
   */
  router.post('/dear-ceo/ai-analyze-all', async (req, res) => {
    try {
      const options = {
        limit: parseInt(req.body.limit) || 100,
        skipExisting: req.body.skipExisting !== false
      }

      console.log('[Dear CEO] Starting AI batch analysis with Claude Sonnet...')
      const results = await dearCeoAnalyzer.batchAIAnalyzeAll(options)

      res.json({
        success: true,
        message: `AI analyzed ${results.processed} letters`,
        results
      })
    } catch (error) {
      console.error('Error during AI batch analysis:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * GET /api/dear-ceo/ai-analysis/:id
   * Get AI-powered analysis for a specific letter
   */
  router.get('/dear-ceo/ai-analysis/:id', async (req, res) => {
    try {
      const { id } = req.params

      const analysis = await dearCeoAnalyzer.generateAIOnePager(id)

      res.json({
        success: true,
        analysis
      })
    } catch (error) {
      console.error('Error generating AI analysis:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  /**
   * POST /api/dear-ceo/scrape
   * Trigger scraping of Dear CEO letters (admin only)
   */
  router.post('/dear-ceo/scrape', async (req, res) => {
    try {
      const puppeteerScraper = require('../../scrapers/puppeteerScraper')
      const dbService = require('../../services/dbService')

      // Run FCA Dear CEO scraper
      console.log('Starting Dear CEO scrape...')
      const fcaResults = await puppeteerScraper.scrapeFCADearCeo()

      // Optionally run PRA scraper
      let praResults = []
      if (req.body.includePRA !== false) {
        praResults = await puppeteerScraper.scrapePRASupervisory()
      }

      // Combine all results
      const allResults = [...fcaResults, ...praResults]
      let savedCount = 0
      let skippedCount = 0

      // Save each result to database
      for (const item of allResults) {
        try {
          // Check if already exists
          const exists = await dbService.checkUpdateExists(item.url)
          if (exists) {
            skippedCount++
            continue
          }

          // Transform to database format
          const updateData = {
            headline: item.headline,
            summary: item.summary,
            url: item.url,
            authority: item.authority || 'FCA',
            published_date: item.published_date,
            area: item.area || 'Dear CEO Letter',
            content_type: 'Dear CEO Letter',
            country: item.raw_data?.country || 'UK',
            region: item.raw_data?.region || 'Europe'
          }

          await dbService.saveUpdate(updateData)
          savedCount++
          console.log(`[Dear CEO] Saved: ${item.headline?.substring(0, 50)}...`)
        } catch (saveError) {
          console.error(`[Dear CEO] Failed to save: ${item.url}`, saveError.message)
        }
      }

      console.log(`[Dear CEO] Saved ${savedCount} new items, skipped ${skippedCount} existing`)

      res.json({
        success: true,
        results: {
          fca: fcaResults.length,
          pra: praResults.length,
          total: allResults.length,
          saved: savedCount,
          skipped: skippedCount
        }
      })
    } catch (error) {
      console.error('Error during Dear CEO scrape:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })
}

module.exports = registerDearCeoRoutes
