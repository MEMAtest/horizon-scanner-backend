/**
 * Quick test for date-based FATF extraction
 */
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const FILTER = {
  urls: ['/job-opportunities','/secretariat/','/code-of-conduct','/history-of-the-fatf','/about-us','/about/','/contact','/members','/membership','/faqs','/glossary'],
  titles: ['job opportunit','secretariat','code of conduct','history of','about us','about fatf','contact us','members','membership','faq','glossary']
}

;(async () => {
  console.log('🚀 Testing Date-Based FATF Extraction\n')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')

    console.log('Loading FATF news page...')
    await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 10000))

    // Scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(r => setTimeout(r, 3000))

    // Date-based extraction
    const items = await page.evaluate((filter) => {
      const results = []
      const seen = new Set()

      const isInfo = (u, t) => {
        const ul = (u || '').toLowerCase()
        const tl = (t || '').toLowerCase()
        for (const p of filter.urls) if (ul.includes(p)) return true
        for (const p of filter.titles) if (tl.includes(p)) return true
        return false
      }

      // Find p.date elements
      const dateElements = document.querySelectorAll('p.date')
      console.log('Found', dateElements.length, 'date elements')

      dateElements.forEach((dateEl) => {
        const dateText = dateEl.textContent?.trim()
        if (!dateText) return

        // Traverse up to find link
        let parent = dateEl.parentElement
        for (let i = 0; i < 5 && parent; i++) {
          const link = parent.querySelector('a[href*="/publications/"]')
          if (link && link.href && !seen.has(link.href)) {
            const title = link.textContent?.trim()
            if (title && title.length > 15 && !isInfo(link.href, title)) {
              seen.add(link.href)
              const descEl = parent.querySelector('p:not(.date)')
              results.push({
                title: title.replace(/\s+/g, ' ').trim(),
                url: link.href,
                date: dateText,
                description: descEl?.textContent?.trim()?.substring(0, 150) || ''
              })
            }
            break
          }
          parent = parent.parentElement
        }
      })

      return results.slice(0, 20)
    }, FILTER)

    console.log(`\n📰 Found ${items.length} FATF items with dates:\n`)
    console.log('─'.repeat(70))

    items.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`)
      console.log(`   📅 Date: ${item.date}`)
      console.log(`   🔗 ${item.url}`)
      if (item.description) console.log(`   📝 ${item.description.substring(0, 80)}...`)
      console.log('')
    })

    console.log('─'.repeat(70))
    console.log(`✅ Test complete - ${items.length} items extracted`)

  } finally {
    await browser.close()
  }
})()
