/**
 * Import FCA Regulatory Initiatives Grid into compliance_events table
 * Usage: node scripts/import-regulatory-initiatives.js
 */

const path = require('path')

// Date parsing functions
function parseQuarterDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null

  const str = dateStr.trim()

  // Exact dates - "9 December 2025", "1 January 2026"
  const exactMatch = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (exactMatch) {
    const parsed = new Date(Date.parse(str))
    if (!isNaN(parsed.getTime())) return parsed
  }

  // Q1, Q2, Q3, Q4 format
  const quarterMatch = str.match(/Q([1-4])\s*(\d{4})/)
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1])
    const year = parseInt(quarterMatch[2])
    const month = (quarter - 1) * 3 + 2 // mid-quarter month
    return new Date(year, month - 1, 15)
  }

  // H1, H2 format
  const halfMatch = str.match(/H([1-2])\s*(\d{4})/)
  if (halfMatch) {
    const half = parseInt(halfMatch[1])
    const year = parseInt(halfMatch[2])
    return half === 1 ? new Date(year, 2, 31) : new Date(year, 8, 30)
  }

  // "early 2026", "late 2025", "summer 2026", etc.
  const seasonMatch = str.match(/(early|late|summer|winter|autumn|spring)\s*(\d{4})/i)
  if (seasonMatch) {
    const season = seasonMatch[1].toLowerCase()
    const year = parseInt(seasonMatch[2])
    const monthMap = { early: 2, spring: 4, summer: 7, autumn: 10, winter: 1, late: 11 }
    return new Date(year, monthMap[season] - 1, 15)
  }

  // Winter 2025-26 format
  const winterMatch = str.match(/winter\s*(\d{4})-(\d{2})/i)
  if (winterMatch) {
    const year = parseInt(winterMatch[1])
    return new Date(year, 11, 15) // December
  }

  // Month YYYY - "March 2026", "December 2025"
  const monthYearMatch = str.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/i)
  if (monthYearMatch) {
    const parsed = new Date(Date.parse(str))
    if (!isNaN(parsed.getTime())) return parsed
  }

  // Just year - "2025-26", "2025"
  const yearMatch = str.match(/(\d{4})(?:-\d{2})?/)
  if (yearMatch) {
    const year = parseInt(yearMatch[1])
    return new Date(year, 5, 15) // Mid-year
  }

  return null
}

// Type mapping
function mapEventType(fcaType) {
  if (!fcaType) return 'deadline'

  const typeMap = {
    'consultation / policy development': 'consultation',
    'legislation / regulatory framework': 'implementation',
    'review / market study': 'review',
    'policy statement / final rules': 'assessment',
    'other': 'deadline'
  }

  const lower = fcaType.toLowerCase().trim()
  return typeMap[lower] || 'deadline'
}

// Priority mapping
function mapPriority(impact) {
  if (!impact) return 'medium'

  const priorityMap = {
    'high': 'high',
    'low': 'low',
    'unknown': 'medium'
  }

  return priorityMap[impact.toLowerCase()] || 'medium'
}

// Parse firm actions into actionable tasks
function parseActions(firmAction) {
  if (!firmAction) return []

  return firmAction.split(/[.;]/)
    .map(a => a.trim())
    .filter(a => a.length > 10)
    .map(action => ({
      action,
      status: 'pending',
      assignee: null,
      due_date: null
    }))
}

async function importInitiatives() {
  // Load data
  const dataPath = path.join(__dirname, '../src/data/regulatory-initiatives-dec-2025.json')
  const data = require(dataPath)

  console.log(`\n📥 Importing ${data.total_initiatives} regulatory initiatives...`)
  console.log(`   Source: ${data.source}`)
  console.log(`   Edition: ${data.edition}\n`)

  // Load dbService dynamically to handle env setup
  const dbService = require('../src/services/dbService')

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const initiative of data.initiatives) {
    try {
      // Parse dates
      const eventDate = parseQuarterDate(initiative.next_milestone) ||
                        parseQuarterDate(initiative.implementation_date) ||
                        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // +6 months default

      // Build event object
      const event = {
        title: initiative.title || 'Untitled Initiative',
        description: initiative.firm_action || `${initiative.authority} regulatory initiative`,
        event_type: mapEventType(initiative.type),
        event_date: eventDate,
        priority: mapPriority(initiative.impact),
        status: 'pending',
        tags: JSON.stringify([initiative.sector]),
        metadata: JSON.stringify({
          source: 'fca_rig_dec_2025',
          authority: initiative.authority,
          fca_type: initiative.type,
          impact: initiative.impact,
          consultation_due: initiative.consultation_due,
          implementation_date: initiative.implementation_date,
          source_page: initiative.source_page
        }),
        compliance_requirements: JSON.stringify([initiative.firm_action]),
        milestones: JSON.stringify(parseActions(initiative.firm_action)),
        is_active: true
      }

      // Check if event already exists (by title and authority)
      const exists = await dbService.complianceEventExists(
        event.title,
        initiative.authority,
        'fca_rig_dec_2025'
      )

      if (exists) {
        skipped++
        continue
      }

      // Insert into database using service method
      await dbService.createComplianceEvent(event)

      imported++

      // Progress indicator
      if (imported % 10 === 0) {
        process.stdout.write(`   Imported ${imported}...\r`)
      }
    } catch (error) {
      console.error(`\n❌ Error importing "${initiative.title}":`, error.message)
      errors++
    }
  }

  console.log(`\n\n✅ Import complete:`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Skipped (duplicates): ${skipped}`)
  console.log(`   Errors: ${errors}`)

  // Show breakdown
  console.log(`\n📊 Breakdown of imported events:`)

  try {
    const stats = await dbService.pool?.query(`
      SELECT
        event_type,
        priority,
        COUNT(*) as count
      FROM compliance_events
      WHERE metadata->>'source' = 'fca_rig_dec_2025'
      GROUP BY event_type, priority
      ORDER BY event_type, priority
    `)

    if (stats?.rows) {
      stats.rows.forEach(row => {
        console.log(`   ${row.event_type} (${row.priority}): ${row.count}`)
      })
    }
  } catch (err) {
    console.log('   (Could not fetch breakdown - database may not be connected)')
  }

  console.log('\n📅 Events will appear in the regulatory calendar at /regulatory-calendar')
}

// Run
importInitiatives().catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})
