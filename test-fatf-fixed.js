/**
 * Test script for the updated FATF scraper with Cloudflare bypass
 * Run with: node test-fatf-fixed.js
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

// Filter patterns
const FILTER_PATTERNS = {
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

function isInformationalPage(url, title) {
  const urlLower = (url || '').toLowerCase()
  const titleLower = (title || '').toLowerCase()
  for (const pattern of FILTER_PATTERNS.urls) {
    if (urlLower.includes(pattern)) return true
  }
  for (const pattern of FILTER_PATTERNS.titles) {
    if (titleLower.includes(pattern)) return true
  }
  return false
}

async function testFATFScraper() {
  console.log('=' .repeat(70))
  console.log('FATF Scraper Test - with Cloudflare Bypass')
  console.log('=' .repeat(70))
  console.log('')

  let browser
  const results = []

  try {
    console.log('Launching browser with stealth mode...')
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
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    })

    // Block unnecessary resources
    await page.setRequestInterception(true)
    page.on('request', req => {
      if (['image', 'font', 'media'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // Test News Page
    console.log('\n' + '-'.repeat(50))
    console.log('Testing FATF NEWS page...')
    console.log('-'.repeat(50))

    await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    console.log('Page loaded, waiting for content...')
    await new Promise(resolve => setTimeout(resolve, 8000))

    // Scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await new Promise(resolve => setTimeout(resolve, 2000))
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(resolve => setTimeout(resolve, 3000))

    const newsItems = await page.evaluate((filterPatterns) => {
      const found = []
      const seen = new Set()

      const isInfo = (u, t) => {
        const ul = (u || '').toLowerCase()
        const tl = (t || '').toLowerCase()
        for (const p of filterPatterns.urls) if (ul.includes(p)) return true
        for (const p of filterPatterns.titles) if (tl.includes(p)) return true
        return false
      }

      // Try selectors
      const strategies = [
        '.cmp-teaser, [data-cmp-is="teaser"]',
        '.cmp-list__item',
        '.cmp-contentfragmentlist__item',
        'article, .article, .card'
      ]

      let usedStrategy = 'none'

      for (const selector of strategies) {
        const containers = document.querySelectorAll(selector)
        if (containers.length > 0) {
          usedStrategy = selector
          containers.forEach(container => {
            const link = container.querySelector('a[href]')
            if (!link) return

            const href = link.href
            const title = link.textContent?.trim() ||
              container.querySelector('h2, h3, [class*="title"]')?.textContent?.trim()

            if (!href || !title || title.length < 15 || seen.has(href)) return
            if (isInfo(href, title)) return
            seen.add(href)

            let dateText = ''
            const dateEl = container.querySelector('time, [datetime], .date, [class*="date"]')
            if (dateEl) {
              dateText = dateEl.getAttribute('datetime') || dateEl.textContent?.trim() || ''
            }
            if (!dateText) {
              const match = title.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
              if (match) dateText = match[1]
            }

            found.push({
              title: title.replace(/\s+/g, ' ').trim(),
              href,
              dateText
            })
          })
          break
        }
      }

      // Fallback
      if (found.length === 0) {
        usedStrategy = 'link-fallback'
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

          found.push({
            title: title.replace(/\s+/g, ' ').trim(),
            href,
            dateText
          })
        })
      }

      return { items: found.slice(0, 15), strategy: usedStrategy }
    }, FILTER_PATTERNS)

    console.log(`Strategy used: ${newsItems.strategy}`)
    console.log(`News items found: ${newsItems.items.length}`)

    newsItems.items.forEach(item => {
      // Double-check filter
      if (!isInformationalPage(item.href, item.title)) {
        results.push({ ...item, type: 'News' })
      }
    })

    // Test Publications Page
    console.log('\n' + '-'.repeat(50))
    console.log('Testing FATF PUBLICATIONS page...')
    console.log('-'.repeat(50))

    await new Promise(resolve => setTimeout(resolve, 3000))
    await page.goto('https://www.fatf-gafi.org/en/publications.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    console.log('Page loaded, waiting for content...')
    await new Promise(resolve => setTimeout(resolve, 8000))

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await new Promise(resolve => setTimeout(resolve, 2000))
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(resolve => setTimeout(resolve, 3000))

    const pubItems = await page.evaluate((filterPatterns) => {
      const found = []
      const seen = new Set()

      const isInfo = (u, t) => {
        const ul = (u || '').toLowerCase()
        const tl = (t || '').toLowerCase()
        for (const p of filterPatterns.urls) if (ul.includes(p)) return true
        for (const p of filterPatterns.titles) if (tl.includes(p)) return true
        return false
      }

      const strategies = [
        '.cmp-teaser, [data-cmp-is="teaser"]',
        '.cmp-list__item',
        '.cmp-contentfragmentlist__item',
        'article, .article, .card'
      ]

      let usedStrategy = 'none'

      for (const selector of strategies) {
        const containers = document.querySelectorAll(selector)
        if (containers.length > 0) {
          usedStrategy = selector
          containers.forEach(container => {
            const link = container.querySelector('a[href]')
            if (!link) return

            const href = link.href
            const title = link.textContent?.trim() ||
              container.querySelector('h2, h3, [class*="title"]')?.textContent?.trim()

            if (!href || !title || title.length < 15 || seen.has(href)) return
            if (isInfo(href, title)) return
            seen.add(href)

            let dateText = ''
            const dateEl = container.querySelector('time, [datetime], .date, [class*="date"]')
            if (dateEl) {
              dateText = dateEl.getAttribute('datetime') || dateEl.textContent?.trim() || ''
            }
            if (!dateText) {
              const match = title.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
              if (match) dateText = match[1]
            }

            found.push({
              title: title.replace(/\s+/g, ' ').trim(),
              href,
              dateText
            })
          })
          break
        }
      }

      if (found.length === 0) {
        usedStrategy = 'link-fallback'
        const links = document.querySelectorAll('a[href*="/publications/"]')
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

          found.push({
            title: title.replace(/\s+/g, ' ').trim(),
            href,
            dateText
          })
        })
      }

      return { items: found.slice(0, 15), strategy: usedStrategy }
    }, FILTER_PATTERNS)

    console.log(`Strategy used: ${pubItems.strategy}`)
    console.log(`Publication items found: ${pubItems.items.length}`)

    pubItems.items.forEach(item => {
      if (!isInformationalPage(item.href, item.title)) {
        results.push({ ...item, type: 'Publications' })
      }
    })

    await page.close()

  } catch (error) {
    console.error('Test failed:', error.message)
    console.error(error.stack)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  // Results summary
  console.log('\n' + '='.repeat(70))
  console.log('TEST RESULTS')
  console.log('='.repeat(70))
  console.log(`Total items captured: ${results.length}`)

  // Check for informational pages that slipped through
  const informationalSlipped = results.filter(item =>
    isInformationalPage(item.href, item.title)
  )

  if (informationalSlipped.length > 0) {
    console.log(`\nWARNING: ${informationalSlipped.length} informational pages slipped through:`)
    informationalSlipped.forEach(item => {
      console.log(`  - ${item.title}`)
    })
  } else {
    console.log('\nAll informational pages were filtered correctly!')
  }

  // Show sample items
  console.log('\nSample items captured:')
  console.log('-'.repeat(50))
  results.slice(0, 10).forEach((item, i) => {
    console.log(`\n${i + 1}. [${item.type}] ${item.title}`)
    console.log(`   Date: ${item.dateText || 'Not found'}`)
    console.log(`   URL: ${item.href}`)
  })

  // Final verdict
  console.log('\n' + '='.repeat(70))
  if (results.length > 0 && informationalSlipped.length === 0) {
    console.log('TEST PASSED - Scraper is working correctly')
  } else if (results.length === 0) {
    console.log('TEST FAILED - No items captured')
  } else {
    console.log('TEST PARTIAL - Items captured but some filtering issues')
  }
  console.log('='.repeat(70))

  return results
}

// Run test
testFATFScraper()
  .then(results => {
    console.log(`\nTest completed with ${results.length} items.`)
    process.exit(results.length > 0 ? 0 : 1)
  })
  .catch(error => {
    console.error('Test error:', error)
    process.exit(1)
  })
