const puppeteer = require('puppeteer')

function applyFatfMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFATF = async function() {
    console.log('🌍 FATF: Starting specialized scraping...')

    let browser
    const results = []

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

      console.log('   📰 Scraping FATF news...')
      await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await new Promise(resolve => setTimeout(resolve, 5000))

      const newsItems = await page.evaluate(() => {
        const items = []
        const mainContent = document.querySelector('main') || document.body

        const walker = document.createTreeWalker(
          mainContent,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          null,
          false
        )

        let currentDate = null
        let node = walker.nextNode()

        while (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim() || ''
            const dateMatch = text.match(/^(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})$/)
            if (dateMatch) {
              currentDate = dateMatch[1]
            }
          } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
            const link = node
            const href = link.href
            const fullText = link.textContent?.trim() || ''

            if (currentDate &&
                href &&
                fullText.length > 20 &&
                (href.includes('/publications/') ||
                 href.includes('/news/') ||
                 href.includes('/the-fatf/')) &&
                !fullText.includes('All publications') &&
                !fullText.includes('window.') &&
                !href.includes('#')) {
              items.push({
                title: fullText,
                link: href,
                date: currentDate,
                type: 'news'
              })
            }
          }

          node = walker.nextNode()
        }

        return items
      })

      newsItems.forEach(item => {
        if (item.title && item.link) {
          results.push({
            headline: item.title,
            url: item.link,
            authority: 'FATF',
            area: 'news',
            source_category: 'fatf_news',
            source_description: 'FATF - News & Updates',
            fetched_date: new Date().toISOString(),
            published_date: this.parseFATFDate(item.date),
            raw_data: {
              originalDate: item.date,
              type: 'news',
              fullTitle: item.title,
              fatfSource: true
            }
          })
        }
      })

      console.log('   📚 Scraping FATF publications...')
      await page.goto('https://www.fatf-gafi.org/en/publications.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await new Promise(resolve => setTimeout(resolve, 5000))

      const publications = await page.evaluate(() => {
        const items = []
        const mainContent = document.querySelector('main') || document.body
        const links = mainContent.querySelectorAll('a[href*=\"/publications/\"]')

        links.forEach(link => {
          const href = link.href
          const fullText = link.textContent?.trim() || ''

          if (fullText.length > 20 &&
              !fullText.includes('Publications') &&
              !fullText.includes('Browse') &&
              !href.endsWith('/publications.html') &&
              !href.includes('#')) {
            const parent = link.closest('article, div, li, section')
            let dateText = null

            if (parent) {
              const parentText = parent.textContent || ''
              const dateMatch = parentText.match(/(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/)
              if (dateMatch) dateText = dateMatch[1]
            }

            items.push({
              title: fullText,
              link: href,
              date: dateText,
              type: 'publication'
            })
          }
        })

        return items
      })

      const seenUrls = new Set()
      publications.forEach(item => {
        if (item.title && item.link && !seenUrls.has(item.link)) {
          seenUrls.add(item.link)

          let category = 'publication'
          const lowerTitle = item.title.toLowerCase()

          if (lowerTitle.includes('consultation') || lowerTitle.includes('public comment')) {
            category = 'consultation'
          } else if (lowerTitle.includes('mutual evaluation') || lowerTitle.includes('follow-up report')) {
            category = 'country_evaluation'
          } else if (lowerTitle.includes('guidance')) {
            category = 'guidance'
          }

          results.push({
            headline: item.title,
            url: item.link,
            authority: 'FATF',
            area: category,
            source_category: `fatf_${category}`,
            source_description: `FATF - ${category.replace('_', ' ').toUpperCase()}`,
            fetched_date: new Date().toISOString(),
            published_date: this.parseFATFDate(item.date),
            raw_data: {
              originalDate: item.date,
              type: 'publication',
              category,
              fullTitle: item.title,
              fatfSource: true
            }
          })
        }
      })

      await browser.close()

      const recentResults = results.filter(item => {
        if (!item.published_date) return false
        const date = new Date(item.published_date)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        return date >= cutoff
      })

      console.log(`   ✅ FATF: Found ${recentResults.length} recent items`)

      this.processingStats.byType.fatf = recentResults.length

      return recentResults
    } catch (error) {
      console.error('❌ FATF scraping error:', error.message)
      if (browser) await browser.close()
      return []
    }
  }

  ServiceClass.prototype.parseFATFDate = function(dateStr) {
    if (!dateStr) return null

    try {
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
      }

      const match = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/)
      if (match) {
        const day = parseInt(match[1], 10)
        const month = monthMap[match[2]]
        const year = parseInt(match[3], 10)
        return new Date(year, month, day).toISOString()
      }

      return null
    } catch (error) {
      return null
    }
  }
}

module.exports = applyFatfMethods
