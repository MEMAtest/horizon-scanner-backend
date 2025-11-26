require('dotenv').config()
const fs = require('fs').promises
const path = require('path')
const db = require('./src/services/dbService')

async function migrateBriefingsToDatabase() {
  console.log('🔄 Migrating local briefings to database...\n')

  // Wait for DB to initialize
  await new Promise(resolve => setTimeout(resolve, 1000))

  if (!db.pool) {
    console.error('❌ Database pool not available')
    process.exit(1)
  }

  const briefingsDir = path.join(__dirname, 'data', 'weekly_briefings')

  try {
    // Check if directory exists
    try {
      await fs.access(briefingsDir)
    } catch (error) {
      console.log('⚠️  No local briefings directory found at:', briefingsDir)
      process.exit(0)
    }

    // Read all JSON files
    const files = await fs.readdir(briefingsDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    console.log(`Found ${jsonFiles.length} briefing files\n`)

    if (jsonFiles.length === 0) {
      console.log('No briefings to migrate')
      process.exit(0)
    }

    let successCount = 0
    let failCount = 0
    const errors = []

    for (const file of jsonFiles) {
      const filePath = path.join(briefingsDir, file)

      try {
        const content = await fs.readFile(filePath, 'utf8')
        const briefing = JSON.parse(content)

        // Validate required fields
        if (!briefing.id) {
          throw new Error('Missing briefing ID')
        }

        // Save to database
        const saved = await db.saveWeeklyBriefing(briefing)

        if (saved) {
          successCount++
          console.log(`✅ Migrated: ${briefing.id}`)
          if (briefing.dateRange) {
            console.log(`   Date range: ${briefing.dateRange.start} to ${briefing.dateRange.end}`)
          }
        } else {
          failCount++
          errors.push({ file, error: 'Save returned false' })
          console.log(`❌ Failed: ${file}`)
        }

      } catch (error) {
        failCount++
        errors.push({ file, error: error.message })
        console.log(`❌ Failed: ${file} - ${error.message}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`Migration complete:`)
    console.log(`  ✅ Success: ${successCount}`)
    console.log(`  ❌ Failed: ${failCount}`)
    console.log('='.repeat(60))

    if (errors.length > 0) {
      console.log('\nErrors:')
      errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`)
      })
    }

    // Verify migration
    console.log('\nVerifying migration...')
    const briefings = await db.listWeeklyBriefings(100)
    console.log(`Database now contains ${briefings.length} briefings`)

    if (briefings.length > 0) {
      console.log('\nLatest 5 briefings:')
      briefings.slice(0, 5).forEach((b, i) => {
        console.log(`  ${i + 1}. ${b.generatedAt} (${b.id})`)
      })
    }

    process.exit(failCount > 0 ? 1 : 0)

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

migrateBriefingsToDatabase()
