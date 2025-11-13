#!/usr/bin/env node
// Backfill script to update content_type for existing articles
require('dotenv').config()

const { Pool } = require('pg')
const aiAnalyzer = require('../src/services/aiAnalyzer')

async function backfillContentTypes() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   BACKFILLING CONTENT TYPES')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://horizon-scanning_owner:npg_ThUNJ1dmXg5u@ep-summer-art-ab0r6nxf-pooler.eu-west-2.aws.neon.tech/horizon-scanning?sslmode=require'
  })

  try {
    // Step 1: Count articles needing update
    console.log('📊 Step 1: Checking articles needing content type update...\n')

    const countQuery = `
      SELECT COUNT(*) as total
      FROM regulatory_updates
      WHERE content_type = 'OTHER' OR content_type IS NULL
    `

    const countResult = await pool.query(countQuery)
    const totalToUpdate = parseInt(countResult.rows[0].total)

    console.log(`Found ${totalToUpdate} articles with content_type = 'OTHER' or NULL\n`)

    if (totalToUpdate === 0) {
      console.log('✅ No articles need updating!')
      await pool.end()
      process.exit(0)
    }

    // Step 2: Fetch articles in batches
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 2: Fetching articles to update...\n')

    const fetchQuery = `
      SELECT id, headline, url, authority, ai_summary
      FROM regulatory_updates
      WHERE content_type = 'OTHER' OR content_type IS NULL
      ORDER BY created_at DESC
      LIMIT 500
    `

    const articles = await pool.query(fetchQuery)
    console.log(`Retrieved ${articles.rows.length} articles for processing\n`)

    // Step 3: Process each article
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 3: Detecting content types...\n')

    let updated = 0
    let failed = 0
    const stats = {}

    for (let i = 0; i < articles.rows.length; i++) {
      const article = articles.rows[i]

      try {
        // Use the fallback detectContentType method directly
        const content = article.ai_summary || article.headline || ''
        const url = article.url || ''
        const metadata = { authority: article.authority }

        // Detect content type using the fallback method
        const contentType = aiAnalyzer.detectContentType(content, url, metadata)

        // Update database
        const updateQuery = `
          UPDATE regulatory_updates
          SET content_type = $1
          WHERE id = $2
        `

        await pool.query(updateQuery, [contentType, article.id])

        updated++
        stats[contentType] = (stats[contentType] || 0) + 1

        // Progress indicator every 50 articles
        if ((i + 1) % 50 === 0) {
          console.log(`   Processed ${i + 1}/${articles.rows.length} articles...`)
        }

      } catch (error) {
        failed++
        console.error(`   ❌ Failed to update article ${article.id}: ${error.message}`)
      }
    }

    console.log(`\n✅ Processing complete!`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Failed: ${failed}\n`)

    // Step 4: Show statistics
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 4: Content Type Distribution\n')

    console.log('Updated articles by content type:')
    Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / updated) * 100).toFixed(1)
        console.log(`   ${type}: ${count} (${percentage}%)`)
      })

    console.log()

    // Step 5: Verify final state
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 5: Final Verification\n')

    const verifyQuery = `
      SELECT
        content_type,
        COUNT(*) as count
      FROM regulatory_updates
      GROUP BY content_type
      ORDER BY count DESC
    `

    const verifyResult = await pool.query(verifyQuery)

    console.log('Current content type distribution in database:')
    verifyResult.rows.forEach(row => {
      console.log(`   ${row.content_type || 'NULL'}: ${row.count} articles`)
    })

    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log('✅ BACKFILL COMPLETE')
    console.log('═══════════════════════════════════════════════════════════════\n')

    await pool.end()
    process.exit(0)

  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ BACKFILL FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    await pool.end()
    process.exit(1)
  }
}

backfillContentTypes()
