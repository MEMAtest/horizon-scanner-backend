#!/usr/bin/env node

/**
 * Quick test script for AI Analyzer
 * Tests the analyzeUpdate method with a sample regulatory update
 */

const aiAnalyzer = require('../src/services/aiAnalyzer')

const sampleUpdate = {
  title: 'FCA announces new consumer duty requirements for financial services firms',
  summary: 'The Financial Conduct Authority has published final guidance on the new Consumer Duty, which sets higher standards of consumer protection across financial services. Firms must ensure products and services meet customer needs and deliver good outcomes.',
  content: `The FCA's Consumer Duty represents a paradigm shift in how financial services firms should treat their customers.

  Key requirements include:
  - Putting customers' needs first in product design and distribution
  - Providing clear, timely communications that customers can understand
  - Offering fair value products and services
  - Providing appropriate customer support

  Implementation deadline: July 31, 2023 for new and existing products
  Closed book products: July 31, 2024

  Firms face significant fines for non-compliance.`,
  authority: 'FCA',
  published_date: new Date().toISOString(),
  url: 'https://www.fca.org.uk/news/consumer-duty'
}

async function testAnalyzer() {
  console.log('🧪 Testing AI Analyzer...\n')
  console.log('Sample Update:')
  console.log('  Title:', sampleUpdate.title)
  console.log('  Authority:', sampleUpdate.authority)
  console.log('\n⏳ Analyzing...\n')

  try {
    const analysis = await aiAnalyzer.analyzeUpdate(sampleUpdate)

    console.log('✅ Analysis Complete!\n')
    console.log('📊 Results:')
    console.log(JSON.stringify(analysis, null, 2))

    // Validate response structure
    console.log('\n🔍 Validation:')
    const checks = [
      { field: 'impact_level', present: !!analysis.impact_level, value: analysis.impact_level },
      { field: 'urgency', present: !!analysis.urgency, value: analysis.urgency },
      { field: 'sectors', present: Array.isArray(analysis.sectors), value: analysis.sectors?.length || 0 },
      { field: 'key_topics', present: Array.isArray(analysis.key_topics), value: analysis.key_topics?.length || 0 },
      { field: 'ai_summary', present: !!analysis.ai_summary, value: analysis.ai_summary?.length || 0 }
    ]

    checks.forEach(check => {
      const icon = check.present ? '✅' : '❌'
      console.log(`  ${icon} ${check.field}: ${check.value}`)
    })

    const allValid = checks.every(c => c.present)
    console.log(`\n${allValid ? '✅ All checks passed!' : '⚠️  Some checks failed'}`)

    process.exit(allValid ? 0 : 1)
  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
    console.error('\nStack trace:', error.stack)
    process.exit(1)
  }
}

testAnalyzer()
