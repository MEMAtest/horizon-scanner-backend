// Weekly Roundup API Routes
// File: src/routes/weeklyRoundup.js

const express = require('express')
const router = express.Router()
const weeklyRoundupService = require('../services/weeklyRoundupService')

/**
 * GET /api/weekly-roundup
 * Generate weekly roundup for the last 7 days
 */
router.get('/weekly-roundup', async (req, res) => {
  try {
    console.log('📊 Weekly roundup requested')

    // Optional query parameters for custom date range
    const { start, end } = req.query

    let weekStart = null
    let weekEnd = null

    if (start) {
      weekStart = new Date(start)
      weekEnd = end ? new Date(end) : new Date()
    }

    const roundup = await weeklyRoundupService.generateWeeklyRoundup(weekStart, weekEnd)

    res.json(roundup)
  } catch (error) {
    console.error('❌ Error generating weekly roundup:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate weekly roundup',
      message: error.message
    })
  }
})

/**
 * GET /api/weekly-roundup/cached
 * Get cached weekly roundup (faster response)
 */
router.get('/weekly-roundup/cached', async (req, res) => {
  try {
    const fs = require('fs').promises
    const path = require('path')
    const cachePath = path.join(process.cwd(), 'data', 'weekly_roundup_cache.json')

    const data = await fs.readFile(cachePath, 'utf8')
    const roundup = JSON.parse(data)

    // Check if cache is fresh (less than 6 hours old)
    const generatedAt = new Date(roundup.roundup.generatedAt)
    const hoursSinceGenerated = (Date.now() - generatedAt) / (1000 * 60 * 60)

    if (hoursSinceGenerated > 6) {
      // Cache is stale, generate new roundup in background
      weeklyRoundupService.generateWeeklyRoundup().catch(console.error)

      res.json({
        ...roundup,
        cacheStatus: 'stale',
        message: 'Showing cached data. Fresh roundup is being generated.'
      })
    } else {
      res.json({
        ...roundup,
        cacheStatus: 'fresh'
      })
    }
  } catch (error) {
    // No cache available, generate new roundup
    console.log('📊 No cache available, generating fresh roundup')
    const roundup = await weeklyRoundupService.generateWeeklyRoundup()
    res.json(roundup)
  }
})

/**
 * GET /api/weekly-roundup/preview
 * Get a preview/summary of the weekly roundup (lighter version)
 */
router.get('/weekly-roundup/preview', async (req, res) => {
  try {
    const { start, end } = req.query

    const weekStart = start ? new Date(start) : new Date()
    const weekEnd = end ? new Date(end) : new Date()

    if (!start) {
      weekStart.setDate(weekStart.getDate() - 7)
    }

    // Fetch basic statistics without full AI analysis
    const updates = await weeklyRoundupService.fetchWeeklyUpdates(weekStart, weekEnd)
    const authorityBreakdown = weeklyRoundupService.calculateAuthorityBreakdown(updates)
    const impactBreakdown = weeklyRoundupService.calculateImpactBreakdown(updates)

    res.json({
      success: true,
      preview: {
        totalUpdates: updates.length,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        topAuthorities: Object.entries(authorityBreakdown)
          .slice(0, 3)
          .map(([authority, count]) => ({ authority, count })),
        impactSummary: {
          significant: impactBreakdown.Significant || 0,
          moderate: impactBreakdown.Moderate || 0,
          total: updates.length
        },
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error generating preview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      message: error.message
    })
  }
})

/**
 * GET /api/weekly-roundup/authorities/:authority
 * Get weekly roundup for a specific authority
 */
router.get('/weekly-roundup/authorities/:authority', async (req, res) => {
  try {
    const { authority } = req.params
    const { start, end } = req.query

    const weekStart = start ? new Date(start) : new Date()
    const weekEnd = end ? new Date(end) : new Date()

    if (!start) {
      weekStart.setDate(weekStart.getDate() - 7)
    }

    // Fetch updates for specific authority
    const allUpdates = await weeklyRoundupService.fetchWeeklyUpdates(weekStart, weekEnd)
    const authorityUpdates = allUpdates.filter(u => u.authority === authority)

    if (authorityUpdates.length === 0) {
      return res.json({
        success: true,
        authority,
        message: `No updates found for ${authority} in the specified period`,
        totalUpdates: 0,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0]
      })
    }

    // Generate authority-specific insights
    const impactBreakdown = weeklyRoundupService.calculateImpactBreakdown(authorityUpdates)
    const highImpactUpdates = weeklyRoundupService.identifyHighImpactUpdates(authorityUpdates)
    const upcomingDeadlines = weeklyRoundupService.extractUpcomingDeadlines(authorityUpdates)

    res.json({
      success: true,
      authority,
      summary: {
        totalUpdates: authorityUpdates.length,
        highImpactCount: highImpactUpdates.length,
        upcomingDeadlines: upcomingDeadlines.length,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0]
      },
      impactBreakdown,
      highImpactUpdates: highImpactUpdates.slice(0, 5),
      upcomingDeadlines: upcomingDeadlines.slice(0, 5),
      recentUpdates: authorityUpdates.slice(0, 10).map(u => ({
        id: u.id,
        title: u.headline,
        publishedDate: u.published_date,
        impactLevel: u.impact_level,
        businessImpactScore: u.business_impact_score,
        url: u.url
      })),
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error generating authority roundup:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate authority roundup',
      message: error.message
    })
  }
})

module.exports = router
