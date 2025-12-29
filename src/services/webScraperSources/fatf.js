const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── FATF (Enhanced with Puppeteer Stealth for Cloudflare bypass) ───────── */

// FATF Informational page patterns to filter out
const FATF_FILTER_PATTERNS = {
  urls: [
    '/job-opportunities', '/jobs/', '/careers/',
    '/fatf-secretariat', '/secretariat/',
    '/code-of-conduct', '/history-of-the-fatf',
    '/fatf-presidency', '/mandate-of-the-fatf',
    '/about-us', '/about/', '/contact',
    '/members', '/membership', '/who-we-are',
    '/faqs', '/glossary', '/sitemap'
  ],
  titles: [
    'job opportunit', 'career', 'vacancy', 'recruitment',
    'secretariat', 'fatf team', 'staff',
    'code of conduct', 'history of the fatf',
    'presidency', 'mandate', 'about us', 'about fatf',
    'contact us', 'members', 'membership', 'faq', 'glossary'
  ]
}

function isFatfInformationalPage(url, title) {
  const urlLower = (url || '').toLowerCase()
  const titleLower = (title || '').toLowerCase()
  for (const pattern of FATF_FILTER_PATTERNS.urls) {
    if (urlLower.includes(pattern)) return true
  }
  for (const pattern of FATF_FILTER_PATTERNS.titles) {
    if (titleLower.includes(pattern)) return true
  }
  return false
}

async function scrapeFATF() {
  // Use puppeteer-extra with stealth plugin for Cloudflare bypass
  const puppeteer = require('puppeteer-extra')
  const StealthPlugin = require('puppeteer-extra-plugin-stealth')
  puppeteer.use(StealthPlugin())

  let browser

  try {
    console.log('🌍 FATF: Starting Puppeteer Stealth scraping...')

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=site-per-process',
        '--window-size=1920,1080'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    })

    // Block images/fonts/media for speed
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    const allResults = []

    // Scrape News page
    console.log('   📰 Scraping FATF news...')
    const newsItems = await scrapeFATFPage(page, 'https://www.fatf-gafi.org/en/the-fatf/news.html', 'news')
    allResults.push(...newsItems)
    console.log(`   ✅ FATF News: ${newsItems.length} items`)

    await new Promise(resolve => setTimeout(resolve, 3000))

    // Scrape Publications page
    console.log('   📚 Scraping FATF publications...')
    const pubItems = await scrapeFATFPage(page, 'https://www.fatf-gafi.org/en/publications.html', 'publications')
    allResults.push(...pubItems)
    console.log(`   ✅ FATF Publications: ${pubItems.length} items`)

    // Deduplicate
    const seen = new Set()
    const results = allResults.filter(item => {
      if (seen.has(item.link)) return false
      seen.add(item.link)
      return true
    })

    if (results.length > 0) {
      console.log(`   🎉 FATF: Total ${results.length} unique items`)
      return results
    }

    console.log('   ⚠️ FATF Puppeteer returned no items, falling back to JSON...')
    return fatfJson()
  } catch (error) {
    console.error('FATF Puppeteer scraping failed:', error.message)
    return fatfJson()
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function scrapeFATFPage(page, url, type) {
  const results = []
  const filterPatterns = FATF_FILTER_PATTERNS

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(resolve => setTimeout(resolve, 8000))

    // Scroll for lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await new Promise(resolve => setTimeout(resolve, 2000))
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(resolve => setTimeout(resolve, 3000))

    const items = await page.evaluate((filterPatterns) => {
      const found = []
      const seen = new Set()

      // Helper to check informational pages
      const isInfo = (u, t) => {
        const ul = (u || '').toLowerCase()
        const tl = (t || '').toLowerCase()
        for (const p of filterPatterns.urls) if (ul.includes(p)) return true
        for (const p of filterPatterns.titles) if (tl.includes(p)) return true
        return false
      }

      // Try multiple selector strategies
      const strategies = [
        '.cmp-teaser, [data-cmp-is="teaser"]',
        '.cmp-list__item',
        '.cmp-contentfragmentlist__item',
        'article, .article, .card'
      ]

      for (const selector of strategies) {
        const containers = document.querySelectorAll(selector)
        if (containers.length > 0) {
          containers.forEach(container => {
            const link = container.querySelector('a[href]')
            if (!link) return

            const href = link.href
            const title = link.textContent?.trim() ||
                         container.querySelector('h2, h3, [class*="title"]')?.textContent?.trim()

            if (!href || !title || title.length < 15 || seen.has(href)) return
            if (isInfo(href, title)) return

            seen.add(href)

            // Extract date
            let dateText = ''
            const dateEl = container.querySelector('time, [datetime], .date, [class*="date"]')
            if (dateEl) {
              dateText = dateEl.getAttribute('datetime') || dateEl.textContent?.trim() || ''
            }
            // Check for embedded date in title
            if (!dateText) {
              const match = title.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
              if (match) dateText = match[1]
            }

            // Extract description
            const descEl = container.querySelector('p, [class*="description"]')
            const description = descEl?.textContent?.trim() || title.substring(0, 200)

            found.push({ title: title.replace(/\s+/g, ' ').trim(), href, dateText, description })
          })
          break
        }
      }

      // Fallback: direct link discovery
      if (found.length === 0) {
        const links = document.querySelectorAll('a[href*="/publications/"], a[href*="/news/"], a[href*="/topics/"]')
        links.forEach(link => {
          const href = link.href
          const title = link.textContent?.trim()
          if (!href || !title || title.length < 25 || seen.has(href) || href.includes('.pdf')) return
          if (isInfo(href, title)) return
          seen.add(href)

          const parent = link.closest('div, article, section, li')
          let dateText = ''
          if (parent) {
            const dateEl = parent.querySelector('time, [datetime], .date')
            dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''
          }

          found.push({ title: title.replace(/\s+/g, ' ').trim(), href, dateText, description: title.substring(0, 200) })
        })
      }

      return found.slice(0, 15)
    }, filterPatterns)

    // Process items
    for (const item of items) {
      // Double-check filter
      if (isFatfInformationalPage(item.href, item.title)) continue

      // Parse date
      let pubDate = parseDate(item.dateText)

      // Skip items older than 90 days
      const maxAgeDays = 90
      if (pubDate) {
        const ageDays = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24)
        if (ageDays > maxAgeDays) continue
      }

      results.push({
        title: item.title,
        link: item.href.startsWith('http') ? item.href : `https://www.fatf-gafi.org${item.href}`,
        pubDate: pubDate ? pubDate.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('FATF'),
        summary: item.description,
        description: item.description
      })
    }
  } catch (error) {
    console.error(`FATF page scrape failed (${url}):`, error.message)
  }

  return results
}

async function fatfJson(pages = 2, size = 20, maxDays = 90) {
  const endpoint = 'https://www.fatf-gafi.org/en/publications/_jcr_content.results.json'
  const list = []

  for (let p = 0; p < pages; p++) {
    try {
      const { data } = await axios.get(
        `${endpoint}?page=${p}&size=${size}&sort=Publication%20date%20descending`,
        { timeout: 15000 }
      )

      if (!data?.items?.length) break

      for (const it of data.items) {
        const date = parseDate(it.publicationDate)
        if (!isRecent(date, maxDays)) continue

        // Filter informational
        const title = it.title?.trim() || ''
        const url = it.detailsPage?.absoluteUrl || it.url || `https://www.fatf-gafi.org${it.path}`
        if (isFatfInformationalPage(url, title)) continue

        const summary = it.description || it.summary || it.excerpt || `FATF: ${title}`

        list.push({
          title,
          link: url,
          pubDate: date ? date.toISOString() : new Date().toISOString(),
          authority: normalizeAuthority('FATF'),
          summary: summary.trim()
        })
      }
    } catch (e) {
      console.error(`FATF JSON page ${p} error:`, e.message)
      break
    }
  }

  return list
}

module.exports = { scrapeFATF }
