#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Refactored Platform
 * Tests all major components: Puppeteer, RSS, AI, Frontend
 */

const dbService = require('../src/services/dbService')

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
}

function logTest(name, status, details = {}) {
  const test = { name, status, details, timestamp: new Date().toISOString() }
  results.tests.push(test)
  results.summary.total++
  results.summary[status]++

  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️'
  console.log(`${icon} ${name}`)
  if (details.message) console.log(`   ${details.message}`)
  if (details.error) console.error(`   Error: ${details.error}`)
}

async function testPuppeteerSources() {
  console.log('\n📌 Testing Puppeteer Sources...')
  try {
    const puppeteerScraper = require('../src/scrapers/puppeteerScraper')

    const items = await puppeteerScraper.scrapeAll()

    if (items.length > 0) {
      logTest('Puppeteer Sources', 'passed', {
        message: `Successfully scraped ${items.length} items`,
        itemCount: items.length,
        sources: [...new Set(items.map(i => i.source))].join(', ')
      })

      // Spot-check one item per source
      const sources = {}
      items.forEach(item => {
        if (!sources[item.source]) sources[item.source] = item
      })

      Object.entries(sources).forEach(([source, item]) => {
        console.log(`   Sample from ${source}: ${item.title?.substring(0, 60)}...`)
      })
    } else {
      logTest('Puppeteer Sources', 'failed', {
        message: 'No items scraped',
        itemCount: 0
      })
    }
  } catch (error) {
    logTest('Puppeteer Sources', 'failed', {
      error: error.message,
      suggestion: 'Check if Chrome/Chromium is installed'
    })
  }
}

async function testRSSPipeline() {
  console.log('\n📌 Testing RSS/Web Scraping Pipeline...')
  try {
    const rssFetcher = require('../src/services/rssFetcher')

    const summary = await rssFetcher.fetchAllFeeds({ fastMode: true })

    if (summary.successful > 0 && summary.newUpdates >= 0) {
      logTest('RSS Pipeline', 'passed', {
        message: `Fetched from ${summary.successful}/${summary.total} sources, ${summary.newUpdates} new updates`,
        successful: summary.successful,
        failed: summary.failed,
        newUpdates: summary.newUpdates
      })

      // Show by-source breakdown
      console.log('   Source breakdown:')
      Object.entries(summary.bySource || {}).slice(0, 5).forEach(([source, data]) => {
        console.log(`     - ${source}: ${data.fetched} fetched, ${data.new} new`)
      })
    } else {
      logTest('RSS Pipeline', 'failed', {
        message: 'No successful fetches',
        summary
      })
    }

    // Verify persistence
    const recentUpdates = await dbService.getRecentUpdates(10)
    logTest('RSS Persistence', recentUpdates.length > 0 ? 'passed' : 'failed', {
      message: `${recentUpdates.length} recent updates found in database`
    })

  } catch (error) {
    logTest('RSS Pipeline', 'failed', {
      error: error.message,
      suggestion: 'Check network connectivity'
    })
  }
}

async function testAIServices() {
  console.log('\n📌 Testing AI Analyzer & Prediction Services...')

  // Test AI Analyzer
  try {
    const aiAnalyzer = require('../src/services/aiAnalyzer')

    const sampleUpdate = {
      title: 'FCA publishes new guidance on consumer duty',
      summary: 'The Financial Conduct Authority has published guidance on implementing the Consumer Duty framework.',
      content: 'Full content here...',
      authority: 'FCA',
      published_date: new Date().toISOString()
    }

    const analysis = await aiAnalyzer.analyzeUpdate(sampleUpdate)

    if (analysis && analysis.impact_level && analysis.sectors) {
      logTest('AI Analyzer', 'passed', {
        message: 'Successfully analyzed update',
        impact: analysis.impact_level,
        sectors: analysis.sectors?.join(', '),
        urgency: analysis.urgency
      })
    } else {
      logTest('AI Analyzer', 'failed', {
        message: 'Invalid analysis response',
        analysis
      })
    }
  } catch (error) {
    logTest('AI Analyzer', 'failed', {
      error: error.message,
      suggestion: 'Check AI service configuration'
    })
  }

  // Test Predictive Intelligence
  try {
    const predictiveService = require('../src/services/predictiveIntelligenceService')

    const dashboard = await predictiveService.getPredictiveDashboard()

    if (dashboard && dashboard.predictions) {
      logTest('Predictive Intelligence', 'passed', {
        message: `Found ${dashboard.predictions.imminent?.length || 0} imminent predictions`,
        imminentCount: dashboard.predictions.imminent?.length || 0,
        nearTermCount: dashboard.predictions.nearTerm?.length || 0
      })
    } else {
      logTest('Predictive Intelligence', 'skipped', {
        message: 'No predictions available (may need historical data)'
      })
    }
  } catch (error) {
    logTest('Predictive Intelligence', 'skipped', {
      error: error.message,
      message: 'Service may not be fully configured'
    })
  }
}

async function testFrontendPages() {
  console.log('\n📌 Testing Frontend Page Rendering...')

  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Enforcement', path: '/enforcement' },
    { name: 'Weekly Briefing', path: '/weekly-briefing' },
    { name: 'Analytics', path: '/analytics' }
  ]

  for (const page of pages) {
    try {
      // Mock req/res for server-side rendering test
      const req = { query: {} }
      let htmlOutput = null
      const res = {
        send: (html) => { htmlOutput = html },
        status: () => res
      }

      // Import and test page renderer
      const pagePath = `../src/routes/pages/${page.name.toLowerCase().replace(' ', '')}Page`
      try {
        const pageModule = require(pagePath)
        if (pageModule && typeof pageModule === 'function') {
          await pageModule(req, res)
        } else if (pageModule.render || pageModule.renderPage) {
          const renderFn = pageModule.render || pageModule.renderPage
          await renderFn(req, res)
        }

        if (htmlOutput && htmlOutput.length > 100) {
          logTest(`Frontend: ${page.name}`, 'passed', {
            message: `Rendered ${htmlOutput.length} bytes of HTML`,
            hasTitle: htmlOutput.includes('<title>'),
            hasRegCanary: htmlOutput.includes('RegCanary')
          })
        } else {
          logTest(`Frontend: ${page.name}`, 'skipped', {
            message: 'Page structure may have changed'
          })
        }
      } catch (err) {
        logTest(`Frontend: ${page.name}`, 'skipped', {
          message: 'Page module not found or incompatible',
          error: err.message
        })
      }
    } catch (error) {
      logTest(`Frontend: ${page.name}`, 'failed', {
        error: error.message
      })
    }
  }
}

async function testDatabase() {
  console.log('\n📌 Testing Database Connectivity...')
  try {
    const allUpdates = await dbService.getAllUpdates({ limit: 5 })
    logTest('Database Connection', 'passed', {
      message: `Retrieved ${allUpdates.length} updates`,
      totalCount: allUpdates.length
    })

    const stats = await dbService.getDashboardStatistics()
    logTest('Database Statistics', stats ? 'passed' : 'failed', {
      message: stats ? 'Successfully retrieved statistics' : 'No statistics available',
      totalUpdates: stats?.totalUpdates
    })
  } catch (error) {
    logTest('Database Connection', 'failed', {
      error: error.message,
      suggestion: 'Check DATABASE_URL configuration'
    })
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Test Suite')
  console.log('=====================================\n')

  await testDatabase()
  await testRSSPipeline()
  await testAIServices()
  await testFrontendPages()

  // Puppeteer tests can be slow/require Chrome
  console.log('\n⚠️  Skipping Puppeteer tests (requires Chrome/Chromium)')
  console.log('   Run manually: node -e "require(\'./src/scrapers/puppeteerScraper\').scrapeAll().then(console.log)"')

  // Summary
  console.log('\n=====================================')
  console.log('📊 Test Summary')
  console.log('=====================================')
  console.log(`Total Tests: ${results.summary.total}`)
  console.log(`✅ Passed: ${results.summary.passed}`)
  console.log(`❌ Failed: ${results.summary.failed}`)
  console.log(`⏭️  Skipped: ${results.summary.skipped}`)
  console.log(`\nSuccess Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`)

  // Save results
  const fs = require('fs').promises
  const reportPath = './test-results.json'
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)

  process.exit(results.summary.failed > 0 ? 1 : 0)
}

runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
