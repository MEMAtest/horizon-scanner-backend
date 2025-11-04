function applyPayUKMethods(ServiceClass) {
  ServiceClass.prototype.scrapePayUK = async function scrapePayUK() {
    console.log('\n💳 Pay.UK: Starting scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      const payukUrl = 'https://www.wearepay.uk/news-and-insight/latest-updates/'
      console.log(`🌐 Pay.UK: Loading ${payukUrl}`)

      await page.goto(payukUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(5000)

      // Scroll to load lazy-loaded content
      await this.autoScroll(page)
      await this.wait(2000)

      const articles = await page.evaluate(() => {
        const items = []
        const dateRegex = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/

        // Elementor loop items - these are the article cards
        const loopItems = document.querySelectorAll('.e-loop-item')

        console.log(`Found ${loopItems.length} loop items`)

        loopItems.forEach(item => {
          try {
            // Get title from heading
            const titleEl = item.querySelector('.elementor-heading-title, h2, h3, .elementor-widget-heading')
            const title = titleEl?.textContent?.trim()

            // Get date
            const dateEl = item.querySelector('.elementor-post-info__item--type-date')
            const dateText = dateEl?.textContent?.trim()
            const dateMatch = dateText?.match(dateRegex)

            // Get link - find links that are NOT to category pages
            const allLinks = Array.from(item.querySelectorAll('a[href]'))
            const linkEl = allLinks.find(a =>
              !a.href.includes('/category/') &&
              !a.href.includes('#') &&
              a.href !== 'https://www.wearepay.uk/news-and-insight/latest-updates/' &&
              a.href.startsWith('https://www.wearepay.uk/') &&
              a.href.split('/').length > 4 // Proper article URLs have path segments
            )
            const url = linkEl?.href

            // Get categories
            const categoryEls = item.querySelectorAll('.elementor-post-info__terms-list-item a')
            const categories = Array.from(categoryEls)
              .map(a => a.textContent.trim())
              .filter(c => c && c.length > 0)

            // Get summary/excerpt if present
            const summaryEl = item.querySelector('p, .elementor-text-editor')
            const summary = summaryEl?.textContent?.trim() || ''

            if (title && url && title.length > 10) {
              items.push({
                title,
                url,
                date: dateMatch ? dateMatch[0] : null,
                categories: [...new Set(categories)], // Remove duplicates
                summary: summary.substring(0, 300)
              })
            }
          } catch (error) {
            console.log('Error parsing item:', error.message)
          }
        })

        // Remove duplicates by URL
        const seen = new Set()
        const uniqueItems = items.filter(item => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })

        return uniqueItems
      })

      console.log(`✅ Pay.UK: Found ${articles.length} articles`)

      // Transform to match expected format
      const transformedArticles = articles.map(article => ({
        title: article.title,
        url: article.url,
        date: article.date,
        summary: article.summary,
        authority: 'Pay.UK',
        source: 'Pay.UK Latest Updates',
        categories: article.categories
      }))

      results.push(...transformedArticles)

      await page.close()
      return results
    } catch (error) {
      console.error('❌ Pay.UK scraping error:', error.message)
      return results
    }
  }
}

module.exports = applyPayUKMethods
