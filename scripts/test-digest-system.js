// Test script for daily digest system
const dailyDigestService = require('../src/services/dailyDigestService')
const { buildDailyDigestEmail } = require('../src/templates/emails/dailyDigestEmail-classic')

async function runTests() {
  console.log('🧪 Daily Digest System Test Suite\n')
  console.log('=' .repeat(60))

  // Test 1: Build digest payload
  console.log('\n📊 Test 1: Building Digest Payload...')
  try {
    const payload = await dailyDigestService.buildDigestPayload({
      persona: 'Executive',
      rollingWindowHours: 1080,
      limit: 50
    })

    console.log('✅ Payload built successfully')
    console.log(`   - Insights: ${payload.insights.length}`)
    console.log(`   - Metrics: HIGH=${payload.metrics.highCount}, ENFORCEMENT=${payload.metrics.mediumCount}, MONITOR=${payload.metrics.lowCount}`)
    console.log(`   - Authorities: ${payload.metrics.uniqueAuthorities}`)

    // Validate balanced selection
    const authorityCount = {}
    const sectorCount = {}
    payload.insights.forEach(item => {
      const authority = item.authority || 'Unknown'
      const sector = item.sector || 'Unknown'
      authorityCount[authority] = (authorityCount[authority] || 0) + 1
      sectorCount[sector] = (sectorCount[sector] || 0) + 1
    })

    console.log('\n   Authority distribution:')
    Object.entries(authorityCount).forEach(([auth, count]) => {
      const status = count > 3 ? '❌' : '✅'
      console.log(`   ${status} ${auth}: ${count} items ${count > 3 ? '(EXCEEDS LIMIT!)' : ''}`)
    })

    console.log('\n   Sector distribution:')
    Object.entries(sectorCount).forEach(([sector, count]) => {
      const status = count > 4 ? '❌' : '✅'
      console.log(`   ${status} ${sector}: ${count} items ${count > 4 ? '(EXCEEDS LIMIT!)' : ''}`)
    })

    // Test 2: Build email template
    console.log('\n📧 Test 2: Building Email Template...')
    const { subject, html, text } = buildDailyDigestEmail({
      date: new Date(),
      summary: payload.summary,
      insights: payload.insights,
      metrics: payload.metrics,
      personaLabel: 'Executive',
      brand: {
        title: 'RegCanary Regulatory Intelligence',
        footer: 'Sent for QA – not for redistribution.'
      }
    })

    console.log('✅ Email template built successfully')
    console.log(`   - Subject: ${subject}`)
    console.log(`   - HTML size: ${(html.length / 1024).toFixed(2)} KB`)
    console.log(`   - Text size: ${(text.length / 1024).toFixed(2)} KB`)

    // Validate email contains key elements
    const checks = [
      { name: 'Contains RegCanary branding', test: html.includes('RegCanary') },
      { name: 'Contains SVG canary icon', test: html.includes('<svg') && html.includes('Canary') },
      { name: 'Contains metrics section', test: html.includes('High Impact') && html.includes('Enforcement') },
      { name: 'Contains insights', test: payload.insights.length > 0 },
      { name: 'No AQUIS AGM spam', test: !payload.insights.some(i => i.headline?.toLowerCase().includes('agm')) }
    ]

    console.log('\n   Template validation:')
    checks.forEach(check => {
      console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`)
    })

    // Test 3: Verify metrics calculation
    console.log('\n📈 Test 3: Verifying Metrics Calculation...')
    const highCount = payload.insights.filter(i => (i.relevanceScore || 0) >= 80).length
    const mediumCount = payload.insights.filter(i => {
      const score = i.relevanceScore || 0
      return score >= 70 && score < 80
    }).length
    const lowCount = payload.insights.filter(i => (i.relevanceScore || 0) < 70).length

    const metricsMatch =
      highCount === payload.metrics.highCount &&
      mediumCount === payload.metrics.mediumCount &&
      lowCount === payload.metrics.lowCount

    console.log(`   ${metricsMatch ? '✅' : '❌'} Metrics calculation accurate`)
    console.log(`   Expected: HIGH=${highCount}, ENFORCEMENT=${mediumCount}, MONITOR=${lowCount}`)
    console.log(`   Got:      HIGH=${payload.metrics.highCount}, ENFORCEMENT=${payload.metrics.mediumCount}, MONITOR=${payload.metrics.lowCount}`)

    // Test 4: Content quality check
    console.log('\n🔍 Test 4: Content Quality Check...')
    const qualityIssues = []
    payload.insights.forEach((item, idx) => {
      if (!item.headline || item.headline.length < 10) {
        qualityIssues.push(`Item ${idx + 1}: Headline too short or missing`)
      }
      if (!item.summary || item.summary.length < 30) {
        qualityIssues.push(`Item ${idx + 1}: Summary too short or missing`)
      }
      if (!item.authority) {
        qualityIssues.push(`Item ${idx + 1}: Missing authority`)
      }
    })

    if (qualityIssues.length === 0) {
      console.log('   ✅ All content passes quality checks')
    } else {
      console.log('   ❌ Quality issues found:')
      qualityIssues.forEach(issue => console.log(`      - ${issue}`))
    }

    // Final summary
    console.log('\n' + '='.repeat(60))
    const allPassed =
      payload.insights.length > 0 &&
      metricsMatch &&
      qualityIssues.length === 0 &&
      checks.every(c => c.test) &&
      Object.values(authorityCount).every(c => c <= 3) &&
      Object.values(sectorCount).every(c => c <= 4)

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED - System ready for production!\n')
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - Review issues before deploying\n')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

runTests()
