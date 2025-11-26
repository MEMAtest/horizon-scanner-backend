function applyJMLSGMethods(ServiceClass) {
  ServiceClass.prototype.scrapeJMLSG = async function scrapeJMLSG() {
    console.log('\n📰 JMLSG: Starting scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      const url = 'https://www.jmlsg.org.uk/latest-news/'
      console.log(`🌐 JMLSG: Loading ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      await this.wait(5000)

      // Extract news items
      const items = await page.evaluate(() => {
        const articles = []

        // Try multiple selectors for robustness
        const selectors = [
          '.news-item',
          'article',
          '.post',
          '.entry',
          '[class*="news"]',
          '[class*="article"]'
        ]

        let elements = []
        for (const selector of selectors) {
          elements = document.querySelectorAll(selector)
          if (elements.length > 0) break
        }

        elements.forEach(article => {
          // Try multiple selectors for title
          const titleEl = article.querySelector('h2, h3, .title, .post-title, .entry-title, a[href]')
          const title = titleEl?.textContent?.trim()

          // Try multiple selectors for link
          const linkEl = article.querySelector('a[href], .title a, h2 a, h3 a')
          const url = linkEl?.href

          // Try multiple selectors for date
          const dateEl = article.querySelector('.date, time, .published, .post-date, [datetime]')
          const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime')

          // Try multiple selectors for summary
          const summaryEl = article.querySelector('p, .excerpt, .summary, .description, .content')
          const summary = summaryEl?.textContent?.trim()

          if (title && url) {
            articles.push({ title, url, date, summary })
          }
        })

        return articles
      })

      results.push(...items.filter(item => item.title && item.url))
      await page.close()

      console.log(`\n🎉 JMLSG: Total items collected: ${results.length}`)

      // Normalize the results
      return results.map(item => ({
        title: item.title,
        url: item.url,
        publishedDate: item.date || new Date().toISOString(),
        description: item.summary?.substring(0, 500) || '',
        authority: 'JMLSG',
        feedType: 'puppeteer'
      }))
    } catch (error) {
      console.error('❌ JMLSG scraping failed:', error.message)
      return results
    }
  }
}

module.exports = applyJMLSGMethods
