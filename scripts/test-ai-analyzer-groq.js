#!/usr/bin/env node
// Test script to verify AI analyzer works with Groq API
require('dotenv').config()

const aiAnalyzer = require('../src/services/aiAnalyzer')

async function testAIAnalyzer() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   TESTING AI ANALYZER WITH GROQ')
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    const testArticle = {
      headline: 'FCA publishes guidance on consumer duty implementation',
      url: 'https://www.fca.org.uk/news/guidance-consumer-duty',
      authority: 'FCA',
      content: 'The Financial Conduct Authority has published new guidance to help firms implement the Consumer Duty. The guidance clarifies expectations around fair value assessments and customer support standards.'
    }

    console.log('📊 Test Article:')
    console.log('   Headline:', testArticle.headline)
    console.log('   Authority:', testArticle.authority)
    console.log()

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Running AI Analysis...\n')

    const result = await aiAnalyzer.analyzeUpdate(testArticle)

    console.log('✅ Analysis Complete!\n')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Results:\n')
    console.log('Impact:', result.impact)
    console.log('Content Type:', result.contentType)
    console.log('Impact Level:', result.impactLevel)
    console.log('Urgency:', result.urgency)
    console.log('Business Impact Score:', result.businessImpactScore)
    console.log('Primary Sectors:', result.primarySectors)
    console.log('Using Fallback:', result.fallbackAnalysis || false)
    console.log()

    if (!result.fallbackAnalysis) {
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('✅ SUCCESS: AI ANALYSIS WORKING WITH GROQ')
      console.log('   - System properly initialized with Groq API')
      console.log('   - AI-generated RegCanary-branded summary received')
      console.log('   - Ready to backfill all articles with proper summaries')
      console.log('═══════════════════════════════════════════════════════════════\n')
      process.exit(0)
    } else {
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('⚠️  WARNING: Still using fallback analysis')
      console.log('   AI API may not be working properly')
      console.log('═══════════════════════════════════════════════════════════════\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ TEST FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testAIAnalyzer()
