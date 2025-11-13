#!/usr/bin/env node
// Test current implementation - fetch updates and check AI enhancement
require('dotenv').config()

const rssFetcher = require('../src/services/rssFetcher')
const { Pool } = require('pg')

async function testCurrentImplementation() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   TESTING CURRENT IMPLEMENTATION')
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    // Step 1: Fetch fresh updates (including FATF)
    console.log('📡 Step 1: Fetching updates from all sources (including FATF)...\n')
    const startTime = Date.now()

    const summary = await rssFetcher.fetchAllFeeds({
      fastMode: false // Include Puppeteer scrapers like FATF
    })

    const duration = Date.now() - startTime
    console.log(`✅ Fetch completed in ${(duration / 1000).toFixed(2)}s\n`)
    console.log('📊 Fetch Summary:')
    console.log(`   Total sources: ${summary.total}`)
    console.log(`   Successful: ${summary.successful}`)
    console.log(`   Failed: ${summary.failed}`)
    console.log(`   New updates: ${summary.newUpdates}\n`)

    // Step 2: Check database for FATF articles
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 2: Checking database for FATF articles...\n')

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://horizon-scanning_owner:npg_ThUNJ1dmXg5u@ep-summer-art-ab0r6nxf-pooler.eu-west-2.aws.neon.tech/horizon-scanning?sslmode=require'
    })

    const fatfQuery = `
      SELECT
        id, headline, authority, published_date,
        ai_summary, content_type, business_impact_score,
        created_at
      FROM regulatory_updates
      WHERE authority ILIKE '%FATF%'
      ORDER BY published_date DESC
      LIMIT 10
    `

    const fatfResult = await pool.query(fatfQuery)
    console.log(`✅ Found ${fatfResult.rows.length} FATF articles in database\n`)

    if (fatfResult.rows.length > 0) {
      console.log('Sample FATF Articles:\n')
      fatfResult.rows.slice(0, 5).forEach((row, i) => {
        console.log(`${i + 1}. ${row.headline}`)
        console.log(`   Authority: ${row.authority}`)
        console.log(`   Published: ${row.published_date ? new Date(row.published_date).toLocaleDateString() : 'Unknown'}`)
        console.log(`   Content Type: ${row.content_type || 'Not categorized'}`)
        console.log(`   Business Impact Score: ${row.business_impact_score || 'Not scored'}`)
        console.log(`   AI Summary: ${row.ai_summary ? (row.ai_summary.substring(0, 80) + '...') : 'No summary'}`)
        console.log(`   Created: ${new Date(row.created_at).toLocaleString()}\n`)
      })
    } else {
      console.log('⚠️  WARNING: No FATF articles found in database!')
      console.log('   This could mean:')
      console.log('   1. FATF scraper is not running')
      console.log('   2. All FATF articles already exist in DB')
      console.log('   3. FATF scraper encountered errors\n')
    }

    // Step 3: Check content type distribution
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 3: Content Type Distribution (Last 50 updates)...\n')

    const contentTypeQuery = `
      SELECT
        content_type,
        COUNT(*) as count
      FROM regulatory_updates
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY content_type
      ORDER BY count DESC
    `

    const contentTypeResult = await pool.query(contentTypeQuery)

    if (contentTypeResult.rows.length > 0) {
      console.log('Content Types in last 7 days:\n')
      contentTypeResult.rows.forEach(row => {
        console.log(`   ${row.content_type || 'NULL'}: ${row.count} articles`)
      })
      console.log()
    } else {
      console.log('⚠️  No recent updates with content types\n')
    }

    // Step 4: Check AI summary quality
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 4: AI Summary Quality Check...\n')

    const summaryQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(ai_summary) as with_summary,
        COUNT(content_type) as with_content_type,
        COUNT(business_impact_score) as with_score
      FROM regulatory_updates
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `

    const summaryResult = await pool.query(summaryQuery)
    const stats = summaryResult.rows[0]

    console.log(`Total updates (last 7 days): ${stats.total}`)
    console.log(`With AI summary: ${stats.with_summary} (${((stats.with_summary / stats.total) * 100).toFixed(1)}%)`)
    console.log(`With content type: ${stats.with_content_type} (${((stats.with_content_type / stats.total) * 100).toFixed(1)}%)`)
    console.log(`With business impact score: ${stats.with_score} (${((stats.with_score / stats.total) * 100).toFixed(1)}%)\n`)

    await pool.end()

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('✅ TEST COMPLETE')
    console.log('═══════════════════════════════════════════════════════════════\n')

    process.exit(0)
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ TEST FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testCurrentImplementation()
