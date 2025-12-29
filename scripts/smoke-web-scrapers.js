#!/usr/bin/env node

const webScraper = require('../src/services/webScraper')

const SCRAPER_TIMEOUT_MS = Number(process.env.SCRAPER_TIMEOUT_MS || 30000)
const DELAY_MS = Number(process.env.SCRAPER_DELAY_MS || 1000)

const scrapers = [
  { name: 'FCA', fn: webScraper.scrapeFCA },
  { name: 'PRA', fn: webScraper.scrapePRA },
  { name: 'BoE', fn: webScraper.scrapeBoE },
  { name: 'EBA', fn: webScraper.scrapeEBA },
  { name: 'FOS', fn: webScraper.scrapeFOS },
  { name: 'FRC', fn: webScraper.scrapeFRC },
  { name: 'FATF', fn: webScraper.scrapeFATF, timeoutMs: 60000 },
  { name: 'ICO', fn: webScraper.scrapeICO },
  { name: 'SFO', fn: webScraper.scrapeSFO },
  { name: 'JMLSG', fn: webScraper.scrapeJMLSG },
  { name: 'TPR', fn: webScraper.scrapePensionRegulator },
  { name: 'Gambling Commission', fn: webScraper.scrapeGamblingCommission },
  { name: 'HSE', fn: webScraper.scrapeHSE },
  { name: 'Ofcom', fn: webScraper.scrapeOfcom },
  { name: 'SRA', fn: webScraper.scrapeSRA }
]

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    })
  ])
}

function summarizeItems(items) {
  const summary = {
    count: items.length,
    withTitle: 0,
    withLink: 0,
    withDate: 0,
    withSummary: 0,
    withAuthority: 0
  }

  items.forEach(item => {
    const title = item.title || item.headline || item.name
    const link = item.link || item.url
    const date = item.pubDate || item.date || item.publishedDate || item.publishedAt
    const summaryText = item.summary || item.description || item.excerpt
    const authority = item.authority || item.source

    if (title) summary.withTitle += 1
    if (link) summary.withLink += 1
    if (date) summary.withDate += 1
    if (summaryText) summary.withSummary += 1
    if (authority) summary.withAuthority += 1
  })

  return summary
}

function formatItem(item) {
  const title = item.title || item.headline || item.name || 'Untitled'
  const link = item.link || item.url || 'No link'
  const date = item.pubDate || item.date || item.publishedDate || item.publishedAt || 'No date'
  const authority = item.authority || item.source || 'Unknown authority'
  const summaryText = item.summary || item.description || item.excerpt || 'No summary'

  return {
    title,
    link,
    date,
    authority,
    summary: summaryText
  }
}

async function runScraper({ name, fn, timeoutMs }) {
  if (typeof fn !== 'function') {
    throw new Error('Scraper function is not defined')
  }

  const start = Date.now()
  const items = await withTimeout(fn(), timeoutMs || SCRAPER_TIMEOUT_MS)
  const duration = Date.now() - start

  if (!Array.isArray(items)) {
    throw new Error('Scraper did not return an array')
  }

  if (items.length === 0) {
    throw new Error('Scraper returned 0 items')
  }

  const summary = summarizeItems(items)

  if (summary.withTitle !== summary.count) {
    throw new Error(`Missing title on ${summary.count - summary.withTitle} items`)
  }

  if (summary.withLink !== summary.count) {
    throw new Error(`Missing link on ${summary.count - summary.withLink} items`)
  }

  return {
    name,
    duration,
    summary,
    sample: formatItem(items[0])
  }
}

async function main() {
  console.log('Web scraper smoke test (network required)\n')
  console.log(`Timeout: ${SCRAPER_TIMEOUT_MS}ms | Delay: ${DELAY_MS}ms\n`)

  const failures = []

  for (const scraper of scrapers) {
    console.log(`-> ${scraper.name}...`)
    try {
      const result = await runScraper(scraper)
      console.log(`  OK ${result.summary.count} items in ${result.duration}ms`)
      console.log(`  - Titles: ${result.summary.withTitle}/${result.summary.count}`)
      console.log(`  - Links: ${result.summary.withLink}/${result.summary.count}`)
      if (result.summary.withDate !== result.summary.count) {
        console.log(`  WARN Dates: ${result.summary.withDate}/${result.summary.count}`)
      }
      if (result.summary.withSummary !== result.summary.count) {
        console.log(`  WARN Summaries: ${result.summary.withSummary}/${result.summary.count}`)
      }
      if (result.summary.withAuthority !== result.summary.count) {
        console.log(`  WARN Authorities: ${result.summary.withAuthority}/${result.summary.count}`)
      }
      console.log(`  Sample: ${result.sample.title}`)
      console.log(`  URL: ${result.sample.link}`)
      console.log(`  Date: ${result.sample.date}`)
      console.log(`  Authority: ${result.sample.authority}`)
    } catch (error) {
      failures.push({ name: scraper.name, error })
      console.log(`  FAIL ${error.message}`)
    }

    if (DELAY_MS > 0) {
      await delay(DELAY_MS)
    }
  }

  console.log('\n---------------------------------------------------------------')
  if (failures.length) {
    console.log(`FAIL Smoke test failed: ${failures.length} scraper(s)`)
    failures.forEach(f => {
      console.log(`- ${f.name}: ${f.error.message}`)
    })
    console.log('---------------------------------------------------------------')
    process.exit(1)
  }

  console.log('OK Smoke test passed: all scrapers returned >= 1 item')
  console.log('---------------------------------------------------------------')
}

main().catch(error => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
