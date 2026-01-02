require('dotenv').config()

const db = require('../src/services/dbService')

const SAMPLE_SOURCEBOOKS = ['PRIN', 'SYSC', 'COBS']

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function checkSourcebook(code) {
  const sourcebook = await db.getHandbookSourcebookByCode('FCA', code)
  assert(sourcebook, `Missing sourcebook: ${code}`)
  assert(sourcebook.latest_version_id, `Missing latest version for ${code}`)

  const outline = await db.getHandbookOutlineBySourcebookId(
    sourcebook.id,
    sourcebook.latest_version_id
  )
  assert(outline && outline.sectionsCount > 0, `No sections for ${code}`)

  const firstChapter = outline.chapters?.[0]
  const firstSection = firstChapter?.sections?.[0]
  assert(firstSection, `No section entries for ${code}`)

  const section = await db.getHandbookSectionById(firstSection.id)
  assert(section, `Missing section details for ${code}`)

  const paragraphs = await db.getHandbookParagraphsBySectionId(firstSection.id)
  assert(paragraphs.length > 0, `No paragraphs found for ${code} section ${firstSection.id}`)

  return {
    code,
    title: sourcebook.title || null,
    sections: outline.sectionsCount,
    paragraphs: paragraphs.length
  }
}

async function main() {
  const issues = []
  const warnings = []
  const results = []

  await db.waitForInitialization()
  if (db.fallbackMode || !db.pool) {
    throw new Error('PostgreSQL not available (fallback mode active)')
  }

  const latestRun = await db.getLatestHandbookIngestRun('FCA')
  if (!latestRun) {
    issues.push('No ingest run found')
  } else if (latestRun.status !== 'completed') {
    warnings.push(`Latest ingest status: ${latestRun.status}`)
  }

  const sourcebooks = await db.getHandbookSourcebooks('FCA')
  if (!sourcebooks.length) {
    issues.push('No sourcebooks found for FCA')
  }

  for (const code of SAMPLE_SOURCEBOOKS) {
    try {
      const summary = await checkSourcebook(code)
      results.push(summary)
    } catch (error) {
      issues.push(error.message)
    }
  }

  try {
    const searchResults = await db.searchHandbook('integrity', {
      authority: 'FCA',
      limit: 5,
      sourcebookCode: 'PRIN'
    })
    if (!searchResults.length) {
      issues.push('Search returned no results for "integrity" in PRIN')
    }
  } catch (error) {
    issues.push(`Search failed: ${error.message}`)
  }

  console.log('FCA Handbook Health Check')
  console.log('Sourcebooks:', sourcebooks.length)
  if (latestRun) {
    console.log('Latest ingest:', latestRun.status, latestRun.ended_at || latestRun.started_at)
  }
  results.forEach(item => {
    console.log(`- ${item.code}: ${item.sections} sections, ${item.paragraphs} paragraphs`)
  })

  warnings.forEach(message => {
    console.warn('Warning:', message)
  })
  issues.forEach(message => {
    console.error('Issue:', message)
  })

  if (issues.length) {
    process.exitCode = 1
  }
}

main()
  .catch(error => {
    console.error('Handbook health check failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => {
    if (db.pool) {
      db.pool.end().catch(() => {})
    }
  })
