const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Joint Money Laundering Steering Group (JMLSG) - Enhanced with Puppeteer ───────── */
async function scrapeJMLSG() {
  const puppeteer = require('puppeteer')
  let browser

  try {
    console.log('🌍 JMLSG: Starting Puppeteer scraping...')

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    console.log('   📰 Scraping JMLSG news...')
    await page.goto('https://www.jmlsg.org.uk/latest-news/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    const newsItems = await page.evaluate(() => {
      const items = []
      const base = 'https://www.jmlsg.org.uk'

      // Try multiple selectors for JMLSG news items
      const selectors = [
        '.news-item',
        '.post',
        'article',
        '.entry',
        '.content-item',
        '.news-list .item',
        '[class*="news"]',
        'a[href*="/news/"]',
        'a[href*="/latest-news/"]'
      ]

      let elements = []
      for (const selector of selectors) {
        const found = document.querySelectorAll(selector)
        if (found.length > 0) {
          elements = Array.from(found)
          break
        }
      }

      // If no specific elements found, try to find links in main content
      if (elements.length === 0) {
        const mainContent = document.querySelector('main, .main, .content, #content') || document.body
        const links = mainContent.querySelectorAll('a[href]')
        elements = Array.from(links).filter(link => {
          const href = link.href || ''
          const text = link.textContent.trim()
          return (href.includes('/news/') || href.includes('/latest-news/') ||
                           href.includes('/publications/') || text.length > 20) && text.length < 200
        })
      }

      for (const element of elements.slice(0, 10)) {
        let title = ''
        let link = ''
        let dateText = ''
        let summary = ''

        if (element.tagName === 'A') {
          title = element.textContent?.trim() || ''
          link = element.href || ''
        } else {
          const linkEl = element.querySelector('a')
          if (linkEl) {
            title = linkEl.textContent?.trim() || element.textContent?.trim() || ''
            link = linkEl.href || ''
          } else {
            // Try to find title in headings
            const heading = element.querySelector('h1, h2, h3, h4, h5, .title, .headline')
            if (heading) {
              title = heading.textContent?.trim() || ''
            }
          }
        }

        if (!title || title.length < 10) continue

        // Try to find date
        const dateEl = element.querySelector('[class*="date"], time, .published, .pub-date, .meta-date')
        if (dateEl) {
          dateText = dateEl.textContent?.trim() || ''
        }

        // Try to find summary
        const summaryEl = element.querySelector('p, .summary, .description, .excerpt, .intro')
        if (summaryEl) {
          summary = summaryEl.textContent?.trim() || ''
        }

        // Ensure absolute URL
        if (link && !link.startsWith('http')) {
          link = link.startsWith('/') ? `${base}${link}` : `${base}/${link}`
        }

        if (title && link) {
          items.push({
            title,
            link,
            dateText,
            summary: summary || `JMLSG news: ${title.substring(0, 100)}`
          })
        }
      }

      return items
    })

    const results = newsItems.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: parseDate(item.dateText)?.toISOString() || new Date().toISOString(),
      authority: normalizeAuthority('JMLSG'),
      summary: item.summary,
      description: item.summary
    }))

    console.log(`   ✅ JMLSG: Found ${results.length} items via Puppeteer`)
    return results.slice(0, 6)
  } catch (error) {
    console.error('JMLSG Puppeteer scraping failed:', error.message)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

module.exports = { scrapeJMLSG }
