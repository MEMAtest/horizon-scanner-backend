/**
 * Feed Health Check Script
 * Tests all configured feeds to verify they're accessible and working
 */

require('dotenv').config()
const { feedSources } = require('./src/services/rss/config')
const https = require('https')
const http = require('http')

const results = {
  total: 0,
  working: 0,
  failed: 0,
  disabled: 0,
  byType: {},
  byAuthority: {},
  failures: []
}

function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    const req = client.get(url, {
      headers: {
        'User-Agent': 'RegCanary-FeedChecker/1.0'
      },
      timeout: 10000
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          redirected: res.statusCode >= 300 && res.statusCode < 400
        })
      })
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.on('error', reject)
  })
}

async function testFeed(feed) {
  // Skip disabled/demo feeds
  if (feed.priority === 'disabled' || feed.type === 'demo') {
    return { status: 'skipped', reason: 'disabled' }
  }

  try {
    const response = await makeHttpRequest(feed.url)

    // Check status code
    if (response.status === 200) {
      // For RSS feeds, check if it's valid XML
      if (feed.type === 'rss' && response.body) {
        if (response.body.includes('<?xml') || response.body.includes('<rss') || response.body.includes('<feed')) {
          return { status: 'working', contentType: response.headers['content-type'], size: response.body.length }
        } else {
          return { status: 'failed', reason: 'Not valid RSS/XML', statusCode: 200 }
        }
      }

      // For web scraping/puppeteer, just check it returns content
      if (response.body && response.body.length > 0) {
        return { status: 'working', contentType: response.headers['content-type'], size: response.body.length }
      }

      return { status: 'failed', reason: 'Empty response', statusCode: 200 }
    }

    if (response.redirected) {
      return { status: 'redirect', statusCode: response.status, location: response.headers.location }
    }

    return { status: 'failed', reason: 'HTTP error', statusCode: response.status }

  } catch (error) {
    return { status: 'error', reason: error.message }
  }
}

async function runFeedHealthCheck() {
  console.log('🔍 Feed Health Check Starting...\n')
  console.log('='.repeat(80))
  console.log(`Testing ${feedSources.length} configured feeds\n`)

  for (const feed of feedSources) {
    results.total++

    // Skip disabled
    if (feed.priority === 'disabled' || feed.type === 'demo') {
      results.disabled++
      continue
    }

    // Track by type
    results.byType[feed.type] = (results.byType[feed.type] || 0) + 1

    // Track by authority
    results.byAuthority[feed.authority] = (results.byAuthority[feed.authority] || 0) + 1

    console.log(`Testing: ${feed.name}`)
    console.log(`  Type: ${feed.type}`)
    console.log(`  Authority: ${feed.authority}`)
    console.log(`  URL: ${feed.url}`)
    console.log(`  Priority: ${feed.priority}`)

    const result = await testFeed(feed)

    if (result.status === 'working') {
      results.working++
      console.log(`  ✅ STATUS: Working`)
      console.log(`     Content-Type: ${result.contentType}`)
      console.log(`     Size: ${(result.size / 1024).toFixed(2)} KB`)
    } else if (result.status === 'skipped') {
      results.disabled++
      console.log(`  ⏭️  STATUS: Skipped (${result.reason})`)
    } else if (result.status === 'redirect') {
      results.failed++
      console.log(`  ⚠️  STATUS: Redirect (${result.statusCode})`)
      console.log(`     Location: ${result.location || 'Not specified'}`)
      results.failures.push({
        feed: feed.name,
        url: feed.url,
        reason: `Redirect ${result.statusCode}`,
        details: result.location
      })
    } else {
      results.failed++
      console.log(`  ❌ STATUS: Failed`)
      console.log(`     Reason: ${result.reason}`)
      if (result.statusCode) console.log(`     Status Code: ${result.statusCode}`)
      results.failures.push({
        feed: feed.name,
        url: feed.url,
        reason: result.reason,
        statusCode: result.statusCode
      })
    }

    console.log()
  }

  // Print summary
  console.log('='.repeat(80))
  console.log('FEED HEALTH CHECK SUMMARY')
  console.log('='.repeat(80))
  console.log()

  console.log('Overall Status:')
  console.log(`  Total Feeds: ${results.total}`)
  console.log(`  ✅ Working: ${results.working}`)
  console.log(`  ❌ Failed: ${results.failed}`)
  console.log(`  ⏭️  Disabled: ${results.disabled}`)
  console.log(`  📊 Success Rate: ${((results.working / (results.total - results.disabled)) * 100).toFixed(1)}%`)
  console.log()

  console.log('By Feed Type:')
  Object.entries(results.byType).sort(([, a], [, b]) => b - a).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} feeds`)
  })
  console.log()

  console.log('By Authority:')
  Object.entries(results.byAuthority).sort(([, a], [, b]) => b - a).forEach(([authority, count]) => {
    console.log(`  ${authority}: ${count} feeds`)
  })
  console.log()

  if (results.failures.length > 0) {
    console.log('Failed Feeds:')
    results.failures.forEach((failure, index) => {
      console.log(`  ${index + 1}. ${failure.feed}`)
      console.log(`     URL: ${failure.url}`)
      console.log(`     Reason: ${failure.reason}`)
      if (failure.statusCode) console.log(`     Status: ${failure.statusCode}`)
      if (failure.details) console.log(`     Details: ${failure.details}`)
      console.log()
    })
  }

  console.log('='.repeat(80))

  // Return results for programmatic use
  return results
}

// Run the check
runFeedHealthCheck()
  .then((results) => {
    process.exit(results.failed > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(2)
  })
