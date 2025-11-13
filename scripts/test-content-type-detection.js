#!/usr/bin/env node
// Test script to diagnose content type detection
require('dotenv').config()

const aiAnalyzer = require('../src/services/aiAnalyzer')
const { Pool } = require('pg')

async function testContentTypeDetection() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   TESTING CONTENT TYPE DETECTION')
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    // Step 1: Get a sample Bank of England Speech
    console.log('📊 Step 1: Fetching a sample Bank of England Speech...\n')

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://horizon-scanning_owner:npg_ThUNJ1dmXg5u@ep-summer-art-ab0r6nxf-pooler.eu-west-2.aws.neon.tech/horizon-scanning?sslmode=require'
    })

    const query = `
      SELECT
        id, headline, url, authority, published_date,
        ai_summary, content_type
      FROM regulatory_updates
      WHERE authority = 'Bank of England'
        AND headline ILIKE '%speech%'
      ORDER BY published_date DESC
      LIMIT 1
    `

    const result = await pool.query(query)

    if (result.rows.length === 0) {
      console.log('⚠️  No Bank of England speeches found in database')
      console.log('   Trying to find any recent update instead...\n')

      const fallbackQuery = `
        SELECT
          id, headline, url, authority, published_date,
          ai_summary, content_type
        FROM regulatory_updates
        ORDER BY created_at DESC
        LIMIT 1
      `

      const fallbackResult = await pool.query(fallbackQuery)
      if (fallbackResult.rows.length === 0) {
        console.error('❌ No articles found in database at all!')
        process.exit(1)
      }

      const article = fallbackResult.rows[0]
      console.log(`📄 Testing with: ${article.headline}`)
      console.log(`   Authority: ${article.authority}`)
      console.log(`   URL: ${article.url}`)
      console.log(`   Current Content Type: ${article.content_type || 'NULL'}`)
      console.log(`   Current AI Summary: ${(article.ai_summary || 'No summary').substring(0, 100)}...\n`)

      await testAnalysis(article, pool)
    } else {
      const article = result.rows[0]
      console.log(`📄 Found Speech: ${article.headline}`)
      console.log(`   Authority: ${article.authority}`)
      console.log(`   URL: ${article.url}`)
      console.log(`   Current Content Type: ${article.content_type || 'NULL'}`)
      console.log(`   Current AI Summary: ${(article.ai_summary || 'No summary').substring(0, 100)}...\n`)

      await testAnalysis(article, pool)
    }

    await pool.end()

  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ TEST FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

async function testAnalysis(article, pool) {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📊 Step 2: Testing AI Analysis...\n')

  // Create a minimal update object for testing
  const testUpdate = {
    headline: article.headline,
    url: article.url,
    summary: article.ai_summary || article.headline,
    description: article.ai_summary || article.headline
  }

  const metadata = {
    authority: article.authority,
    publishedDate: article.published_date
  }

  console.log('🤖 Calling AI analyzer...')
  const startTime = Date.now()

  const analysis = await aiAnalyzer.analyzeUpdate(testUpdate, metadata)

  const duration = Date.now() - startTime
  console.log(`✅ Analysis completed in ${duration}ms\n`)

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📊 Step 3: Analysis Results\n')

  console.log('RAW AI RESPONSE:')
  console.log(JSON.stringify(analysis, null, 2))
  console.log('\n')

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📊 Step 4: Key Fields Check\n')

  console.log(`Content Type: ${analysis.contentType || analysis.content_type || 'NOT SET'}`)
  console.log(`Expected: Speech, Consultation, Final Rule, Guidance, etc.`)
  console.log(`Got: ${analysis.contentType || analysis.content_type || 'NULL'}\n`)

  if (analysis.contentType === 'Other' || analysis.content_type === 'OTHER') {
    console.log('❌ PROBLEM DETECTED: Content type is defaulting to "Other"')
    console.log('   This means the AI is not properly categorizing the content\n')
  } else {
    console.log('✅ Content type is properly set!')
  }

  console.log(`AI Summary: ${(analysis.ai_summary || analysis.impact || 'No summary').substring(0, 150)}...\n`)
  console.log(`Impact Level: ${analysis.impactLevel || analysis.impact_level || 'NOT SET'}`)
  console.log(`Urgency: ${analysis.urgency || 'NOT SET'}`)
  console.log(`Business Impact Score: ${analysis.businessImpactScore || analysis.business_impact_score || 'NOT SET'}`)

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('✅ TEST COMPLETE')
  console.log('═══════════════════════════════════════════════════════════════\n')

  process.exit(0)
}

testContentTypeDetection()
