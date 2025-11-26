/**
 * Smoke Test for Weekly Briefing Feature (Production)
 * Tests the complete workflow from API to UI rendering
 */

const https = require('https')

const PROD_URL = 'https://www.regcanary.com'

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    https.get(`${PROD_URL}${path}`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve({ status: res.statusCode, body: data, contentType: res.headers['content-type'] })
          } else {
            resolve({ status: res.statusCode, body: data, error: true })
          }
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', reject)
  })
}

async function runSmokeTests() {
  console.log('🧪 Starting Weekly Briefing Smoke Tests\n')
  console.log('Target: ' + PROD_URL)
  console.log('='.repeat(60) + '\n')

  let passed = 0
  let failed = 0

  // Test 1: List briefings API
  try {
    console.log('Test 1: List Briefings API')
    console.log('  GET /api/weekly-briefings')
    const result = await makeRequest('/api/weekly-briefings')

    if (result.status === 200) {
      const data = JSON.parse(result.body)
      if (data.success && Array.isArray(data.briefings)) {
        console.log(`  ✅ PASS - Found ${data.briefings.length} briefings`)
        console.log(`     Latest: ${data.briefings[0]?.id}`)
        passed++
      } else {
        console.log('  ❌ FAIL - Invalid response structure')
        failed++
      }
    } else {
      console.log(`  ❌ FAIL - Status ${result.status}`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}`)
    failed++
  }
  console.log()

  // Test 2: Get latest briefing API
  try {
    console.log('Test 2: Get Latest Briefing API')
    console.log('  GET /api/weekly-briefings/latest')
    const result = await makeRequest('/api/weekly-briefings/latest')

    if (result.status === 200) {
      const data = JSON.parse(result.body)
      if (data.success && data.briefing && data.briefing.id) {
        console.log(`  ✅ PASS - Briefing ID: ${data.briefing.id}`)
        console.log(`     Generated: ${data.briefing.generatedAt}`)
        console.log(`     Has artifacts: ${!!data.briefing.artifacts}`)
        console.log(`     Has dataset: ${!!data.briefing.dataset}`)
        passed++
      } else {
        console.log('  ❌ FAIL - Invalid briefing structure')
        failed++
      }
    } else {
      console.log(`  ❌ FAIL - Status ${result.status}`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}`)
    failed++
  }
  console.log()

  // Test 3: Weekly Briefing page loads
  try {
    console.log('Test 3: Weekly Briefing Page')
    console.log('  GET /weekly-roundup')
    const result = await makeRequest('/weekly-roundup')

    if (result.status === 200) {
      const html = result.body
      const checks = [
        { name: 'HTML page', test: html.includes('<!DOCTYPE html>') },
        { name: 'App script', test: html.includes('weekly-briefing/index.js') },
        { name: 'CSS layout', test: html.includes('weekly-briefing/layout.css') },
        { name: 'CSS components', test: html.includes('weekly-briefing/components.css') },
        { name: 'Tab navigation', test: html.includes('tab-navigation') },
        { name: 'Sidebar', test: html.includes('report-sidebar') }
      ]

      const allPassed = checks.every(c => c.test)

      if (allPassed) {
        console.log('  ✅ PASS - Page structure valid')
        checks.forEach(c => console.log(`     ✓ ${c.name}`))
        passed++
      } else {
        console.log('  ❌ FAIL - Missing elements:')
        checks.filter(c => !c.test).forEach(c => console.log(`     ✗ ${c.name}`))
        failed++
      }
    } else {
      console.log(`  ❌ FAIL - Status ${result.status}`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}`)
    failed++
  }
  console.log()

  // Test 4: JavaScript modules load
  try {
    console.log('Test 4: JavaScript Modules')
    console.log('  GET /js/weekly-briefing/index.js')
    const result = await makeRequest('/js/weekly-briefing/index.js')

    if (result.status === 200) {
      const js = result.body
      const checks = [
        { name: 'Bootstrap function', test: js.includes('bootstrapWeeklyBriefing') },
        { name: 'Error handling', test: js.includes('showErrorBanner') },
        { name: 'DOM ready', test: js.includes('DOMContentLoaded') },
        { name: 'Initialization', test: js.includes('initialize') }
      ]

      const allPassed = checks.every(c => c.test)

      if (allPassed) {
        console.log('  ✅ PASS - JavaScript valid')
        checks.forEach(c => console.log(`     ✓ ${c.name}`))
        passed++
      } else {
        console.log('  ❌ FAIL - Missing code:')
        checks.filter(c => !c.test).forEach(c => console.log(`     ✗ ${c.name}`))
        failed++
      }
    } else {
      console.log(`  ❌ FAIL - Status ${result.status}`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}`)
    failed++
  }
  console.log()

  // Test 5: CSS loads
  try {
    console.log('Test 5: CSS Stylesheets')
    console.log('  GET /css/weekly-briefing/components.css')
    const result = await makeRequest('/css/weekly-briefing/components.css')

    if (result.status === 200) {
      const css = result.body
      const checks = [
        { name: 'Tab styles', test: css.includes('.tab-navigation') },
        { name: 'Status card', test: css.includes('.briefing-status-card') },
        { name: 'Progress bar', test: css.includes('.progress-bar') },
        { name: 'Modal styles', test: css.includes('.modal-overlay') },
        { name: 'Animations', test: css.includes('@keyframes') }
      ]

      const allPassed = checks.every(c => c.test)

      if (allPassed) {
        console.log('  ✅ PASS - CSS valid')
        checks.forEach(c => console.log(`     ✓ ${c.name}`))
        passed++
      } else {
        console.log('  ❌ FAIL - Missing styles:')
        checks.filter(c => !c.test).forEach(c => console.log(`     ✗ ${c.name}`))
        failed++
      }
    } else {
      console.log(`  ❌ FAIL - Status ${result.status}`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}`)
    failed++
  }
  console.log()

  // Test 6: Check for real briefing data (not just test data)
  try {
    console.log('Test 6: Real Briefing Data')
    console.log('  Checking for non-test briefings')
    const result = await makeRequest('/api/weekly-briefings')

    if (result.status === 200) {
      const data = JSON.parse(result.body)
      const realBriefings = data.briefings.filter(b => !b.metadata?.test)

      if (realBriefings.length >= 2) {
        console.log(`  ✅ PASS - Found ${realBriefings.length} real briefings`)
        console.log(`     Most recent real briefing:`)
        console.log(`       ID: ${realBriefings[0].id}`)
        console.log(`       Date: ${realBriefings[0].generatedAt}`)
        passed++
      } else {
        console.log(`  ⚠️  WARN - Only ${realBriefings.length} real briefings found`)
        console.log(`     Expected at least 2 based on user history`)
        failed++
      }
    } else {
      console.log(`  ❌ FAIL - Status ${result.status}`)
      failed++
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}`)
    failed++
  }
  console.log()

  // Summary
  console.log('='.repeat(60))
  console.log('SMOKE TEST RESULTS')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${passed + failed}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log()

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED - Production ready!')
    process.exit(0)
  } else {
    console.log('⚠️  SOME TESTS FAILED - Review needed')
    process.exit(1)
  }
}

runSmokeTests()
