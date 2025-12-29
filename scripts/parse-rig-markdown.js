/**
 * Parse FCA Regulatory Initiatives Grid Markdown to JSON
 * Usage: node scripts/parse-rig-markdown.js
 */

const fs = require('fs')
const path = require('path')

function parseMarkdownTable(mdContent) {
  const lines = mdContent.split('\n')
  const initiatives = []
  let skippedLines = []

  for (const line of lines) {
    // Skip header row, separator, and empty lines
    if (!line.startsWith('|')) continue
    if (line.includes('---')) continue
    if (line.toLowerCase().includes('sector') && line.toLowerCase().includes('regulator')) continue

    // Split but keep empty cells - don't filter them out
    const rawCells = line.split('|')
    // Remove first and last (empty strings from leading/trailing pipes)
    const cells = rawCells.slice(1, -1).map(c => c.trim())

    // Need at least 9 fields for a valid row
    if (cells.length >= 9) {
      initiatives.push({
        sector: cells[0] || 'Multi-sector',
        authority: cells[1] || 'FCA',
        title: cells[2] || '',
        type: cells[3] || 'Other',
        impact: cells[4] || 'Unknown',
        next_milestone: cells[5] || null,
        consultation_due: cells[6] || null,
        implementation_date: cells[7] || null,
        firm_action: cells[8] || '',
        source_page: parseInt(cells[9]) || null
      })
    } else if (cells.length > 0 && cells.some(c => c)) {
      skippedLines.push({ cells: cells.length, line: line.substring(0, 80) })
    }
  }

  if (skippedLines.length > 0) {
    console.log(`\n⚠️ Skipped ${skippedLines.length} lines with insufficient cells`)
  }

  return {
    source: 'FCA Regulatory Initiatives Grid',
    edition: 'December 2025',
    extracted_date: new Date().toISOString(),
    total_initiatives: initiatives.length,
    initiatives
  }
}

// Main execution
const mdPath = '/Users/adeomosanya/Downloads/regulatory_initiatives_grid_dec_2025_ONE_SHEET.md'
const outputPath = path.join(__dirname, '../src/data/regulatory-initiatives-dec-2025.json')

try {
  console.log(`📖 Reading MD file: ${mdPath}`)
  const mdContent = fs.readFileSync(mdPath, 'utf8')

  console.log('🔄 Parsing markdown table...')
  const parsed = parseMarkdownTable(mdContent)

  console.log(`📊 Found ${parsed.total_initiatives} initiatives`)

  // Show breakdown by sector
  const bySector = {}
  const byAuthority = {}
  const byType = {}
  const byImpact = {}

  for (const init of parsed.initiatives) {
    bySector[init.sector] = (bySector[init.sector] || 0) + 1
    byAuthority[init.authority] = (byAuthority[init.authority] || 0) + 1
    byType[init.type] = (byType[init.type] || 0) + 1
    byImpact[init.impact] = (byImpact[init.impact] || 0) + 1
  }

  console.log('\n📈 Breakdown by Sector:')
  Object.entries(bySector).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`   ${k}: ${v}`)
  })

  console.log('\n🏛️ Breakdown by Authority:')
  Object.entries(byAuthority).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`   ${k}: ${v}`)
  })

  console.log('\n📋 Breakdown by Type:')
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`   ${k}: ${v}`)
  })

  console.log('\n⚡ Breakdown by Impact:')
  Object.entries(byImpact).forEach(([k, v]) => {
    console.log(`   ${k}: ${v}`)
  })

  // Write JSON output
  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2))
  console.log(`\n✅ JSON saved to: ${outputPath}`)

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
