/**
 * Targeted test to find the chronological FATF publications list
 * (Belgium Dec 16, Malaysia Dec 11, etc.)
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

async function findPublicationsList() {
  console.log('🔍 Searching for FATF chronological publications list...\n')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')

    // Try the news page first
    console.log('📰 Checking news page: https://www.fatf-gafi.org/en/the-fatf/news.html')
    await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 10000))

    // Scroll multiple times to load all content
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 500))
      await new Promise(r => setTimeout(r, 1000))
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(r => setTimeout(r, 3000))

    // Debug: Get page HTML structure
    const debugInfo = await page.evaluate(() => {
      const info = {
        title: document.title,
        allContainers: [],
        allDates: [],
        allLinks: []
      }

      // Find all elements with dates in format "16 Dec 2025"
      const datePattern = /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i

      // Walk through all text nodes looking for dates
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false)
      let node
      while (node = walker.nextNode()) {
        const text = node.textContent.trim()
        if (datePattern.test(text) && text.length < 20) {
          const parent = node.parentElement
          info.allDates.push({
            date: text,
            parentTag: parent?.tagName,
            parentClass: parent?.className?.substring(0, 50),
            grandParentClass: parent?.parentElement?.className?.substring(0, 50)
          })
        }
      }

      // Find publication-like structures
      const possibleContainers = [
        '.cmp-contentfragmentlist',
        '.publication-list',
        '.news-list',
        '[class*="result"]',
        '[class*="list"]',
        'section[class*="publication"]',
        'div[class*="teaser"]'
      ]

      for (const sel of possibleContainers) {
        const els = document.querySelectorAll(sel)
        if (els.length > 0) {
          info.allContainers.push({
            selector: sel,
            count: els.length,
            firstClass: els[0].className?.substring(0, 100)
          })
        }
      }

      // Look for links containing keywords from recent publications
      const keywords = ['belgium', 'malaysia', 'mutual evaluation', 'aml/cft', 'money laundering']
      document.querySelectorAll('a').forEach(link => {
        const text = link.textContent?.toLowerCase() || ''
        const href = link.href || ''
        for (const kw of keywords) {
          if (text.includes(kw) || href.toLowerCase().includes(kw.replace(' ', '-'))) {
            info.allLinks.push({
              text: link.textContent?.trim()?.substring(0, 80),
              href: href,
              parentClass: link.parentElement?.className?.substring(0, 50)
            })
            break
          }
        }
      })

      return info
    })

    console.log('\n📊 DEBUG INFO:')
    console.log('Page title:', debugInfo.title)
    console.log('\nDates found:', debugInfo.allDates.length)
    debugInfo.allDates.slice(0, 10).forEach(d => {
      console.log(`  - "${d.date}" in <${d.parentTag}> class="${d.parentClass}"`)
    })

    console.log('\nContainers found:')
    debugInfo.allContainers.forEach(c => {
      console.log(`  - ${c.selector}: ${c.count} elements (class: ${c.firstClass})`)
    })

    console.log('\nRelevant links found:', debugInfo.allLinks.length)
    debugInfo.allLinks.slice(0, 10).forEach(l => {
      console.log(`  - "${l.text}"`)
      console.log(`    URL: ${l.href}`)
    })

    // Now try the publications page
    console.log('\n\n📚 Checking publications page: https://www.fatf-gafi.org/en/publications.html')
    await page.goto('https://www.fatf-gafi.org/en/publications.html', { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 10000))

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 500))
      await new Promise(r => setTimeout(r, 1000))
    }

    const pubDebug = await page.evaluate(() => {
      const items = []

      // Try to find teaser items with dates
      const teasers = document.querySelectorAll('.cmp-teaser, [data-cmp-is="teaser"]')
      teasers.forEach(teaser => {
        const link = teaser.querySelector('a')
        const dateEl = teaser.querySelector('time, .date, [class*="date"]')
        const descEl = teaser.querySelector('p, [class*="description"]')

        if (link) {
          items.push({
            title: link.textContent?.trim()?.substring(0, 80),
            url: link.href,
            date: dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || '',
            description: descEl?.textContent?.trim()?.substring(0, 100) || ''
          })
        }
      })

      // Also try contentfragmentlist
      const fragments = document.querySelectorAll('.cmp-contentfragmentlist__item')
      fragments.forEach(frag => {
        const link = frag.querySelector('a')
        const dateEl = frag.querySelector('time, .date, [class*="date"]')

        if (link) {
          items.push({
            title: link.textContent?.trim()?.substring(0, 80),
            url: link.href,
            date: dateEl?.textContent?.trim() || '',
            source: 'contentfragmentlist'
          })
        }
      })

      return items.slice(0, 15)
    })

    console.log('\nPublications page items:')
    pubDebug.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.title}`)
      console.log(`   Date: ${item.date || 'Not found'}`)
      console.log(`   URL: ${item.url}`)
      if (item.description) console.log(`   Desc: ${item.description}`)
    })

  } finally {
    await browser.close()
  }
}

findPublicationsList().catch(console.error)
