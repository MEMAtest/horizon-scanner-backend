/**
 * Test all scrapers to identify which are broken
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const axios = require('axios')
const cheerio = require('cheerio')

puppeteer.use(StealthPlugin())

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'

const results = {}

async function testScraper(name, testFn) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Testing: ${name}`)
  console.log('─'.repeat(60))

  const start = Date.now()
  try {
    const items = await testFn()
    const duration = ((Date.now() - start) / 1000).toFixed(1)

    results[name] = {
      status: items.length > 0 ? '✅ WORKING' : '❌ BROKEN (0 items)',
      count: items.length,
      duration: `${duration}s`,
      sample: items[0]?.title || items[0]?.headline || 'N/A'
    }

    console.log(`Status: ${results[name].status}`)
    console.log(`Items: ${items.length}`)
    console.log(`Time: ${duration}s`)
    if (items[0]) {
      console.log(`Sample: ${(items[0].title || items[0].headline || '').substring(0, 60)}...`)
    }
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(1)
    results[name] = {
      status: '❌ ERROR',
      error: error.message,
      duration: `${duration}s`
    }
    console.log(`Status: ❌ ERROR`)
    console.log(`Error: ${error.message}`)
  }
}

// Test functions for each scraper

async function testFCA() {
  const url = 'https://www.fca.org.uk/news'
  const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 })
  const $ = cheerio.load(data)
  const items = []

  $('.search-result, .latest-news li, .news-item, article').each((_, el) => {
    const title = $(el).find('a').first().text().trim()
    if (title && title.length > 10) items.push({ title })
  })

  return items
}

async function testBoE() {
  const endpoint = 'https://www.bankofengland.co.uk/_api/News/RefreshPagedNewsList'
  const payload = {
    SearchTerm: '',
    Id: '{CE377CC8-BFBC-418B-B4D9-DBC1C64774A8}',
    PageSize: 10,
    NewsTypes: ['d10a561861b94c2ea06d82cfeda25c57'],
    NewsTypesAvailable: ['d10a561861b94c2ea06d82cfeda25c57'],
    Taxonomies: [],
    TaxonomiesAvailable: [],
    Page: 1,
    Direction: 1
  }

  const { data } = await axios.post(endpoint, payload, {
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    timeout: 15000
  })

  const $ = cheerio.load(data.Results || data)
  const items = []
  $('.release, .col3 > a').each((_, el) => {
    const title = $(el).find('h3').text().trim() || $(el).text().trim()
    if (title && title.length > 10) items.push({ title })
  })

  return items
}

async function testESMA() {
  const url = 'https://www.esma.europa.eu/press-news/esma-news'
  const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 })
  const $ = cheerio.load(data)
  const items = []

  $('article, .view-content .views-row, .news-item').each((_, el) => {
    const title = $(el).find('a, h2, h3').first().text().trim()
    if (title && title.length > 10) items.push({ title })
  })

  return items
}

async function testEBA() {
  // EBA uses RSS
  const Parser = require('rss-parser')
  const parser = new Parser()
  const feed = await parser.parseURL('https://www.eba.europa.eu/news-press/news/rss.xml')
  return feed.items.slice(0, 10).map(item => ({ title: item.title }))
}

async function testPuppeteerScraper(url, name, selectors) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent(USER_AGENT)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 5000))

    const items = await page.evaluate((sels) => {
      const found = []
      for (const sel of sels) {
        document.querySelectorAll(sel).forEach(el => {
          const text = el.textContent?.trim()
          if (text && text.length > 20 && text.length < 300) {
            found.push({ title: text.substring(0, 100) })
          }
        })
        if (found.length > 0) break
      }
      return found.slice(0, 10)
    }, selectors)

    return items
  } finally {
    await browser.close()
  }
}

async function testLSE() {
  return testPuppeteerScraper(
    'https://www.londonstockexchange.com/discover/news-and-insights',
    'LSE',
    ['h2 a', 'h3 a', '.news-title', 'article h2', 'article h3']
  )
}

async function testPayUK() {
  return testPuppeteerScraper(
    'https://www.wearepay.uk/news-and-insight/latest-updates/',
    'PayUK',
    ['.elementor-heading-title', 'h2', 'h3', '.e-loop-item h2']
  )
}

async function testAquis() {
  return testPuppeteerScraper(
    'https://www.aquis.eu/announcements',
    'Aquis',
    ['h2', 'h3', '.announcement-title', 'article h2', 'a[href*="announcement"]']
  )
}

async function testJMLSG() {
  return testPuppeteerScraper(
    'https://www.jmlsg.org.uk/',
    'JMLSG',
    ['h2 a', 'h3 a', '.news-title', 'article h2', '.post-title']
  )
}

async function testTPR() {
  const url = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases'
  const { data } = await axios.get(url, { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 })
  const $ = cheerio.load(data)
  const items = []

  $('.newsitem, .news-item, article, .search-result').each((_, el) => {
    const title = $(el).find('a, h2, h3').first().text().trim()
    if (title && title.length > 10) items.push({ title })
  })

  return items
}

async function testICO() {
  // ICO has API
  try {
    const { data } = await axios.post('https://ico.org.uk/api/search', {
      query: '',
      filters: { contentType: ['news'] },
      page: 1,
      pageSize: 10
    }, { headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT }, timeout: 15000 })

    return (data.results || []).map(r => ({ title: r.title }))
  } catch {
    // Fallback to HTML
    const { data } = await axios.get('https://ico.org.uk/about-the-ico/media-centre/', { headers: { 'User-Agent': USER_AGENT }, timeout: 15000 })
    const $ = cheerio.load(data)
    const items = []
    $('article, .news-item, h2 a').each((_, el) => {
      const title = $(el).text().trim()
      if (title && title.length > 10) items.push({ title })
    })
    return items
  }
}

// Main test runner
async function runAllTests() {
  console.log('=' .repeat(60))
  console.log('SCRAPER HEALTH CHECK')
  console.log('=' .repeat(60))
  console.log(`Started: ${new Date().toISOString()}`)

  // Test each scraper
  await testScraper('FCA (News)', testFCA)
  await testScraper('Bank of England', testBoE)
  await testScraper('EBA (RSS)', testEBA)
  await testScraper('ESMA', testESMA)
  await testScraper('TPR', testTPR)
  await testScraper('ICO', testICO)
  await testScraper('LSE (Puppeteer)', testLSE)
  await testScraper('PayUK (Puppeteer)', testPayUK)
  await testScraper('Aquis (Puppeteer)', testAquis)
  await testScraper('JMLSG (Puppeteer)', testJMLSG)

  // Summary
  console.log('\n' + '=' .repeat(60))
  console.log('SUMMARY')
  console.log('=' .repeat(60))

  const working = Object.entries(results).filter(([_, r]) => r.status.includes('WORKING'))
  const broken = Object.entries(results).filter(([_, r]) => !r.status.includes('WORKING'))

  console.log(`\n✅ Working (${working.length}):`)
  working.forEach(([name, r]) => console.log(`   ${name}: ${r.count} items`))

  console.log(`\n❌ Broken/Error (${broken.length}):`)
  broken.forEach(([name, r]) => console.log(`   ${name}: ${r.error || '0 items'}`))

  console.log('\n' + '=' .repeat(60))
}

runAllTests().catch(console.error)
