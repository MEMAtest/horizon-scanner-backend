function applyLseMethods(ServiceClass) {
  ServiceClass.prototype.scrapeLSE = async function scrapeLSE() {
    console.log('\n📈 LSE: Starting scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      // Set realistic user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

      // Add extra headers
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      })

      const lseUrl = 'https://www.londonstockexchange.com/discover/news-and-insights?tab=latest'
      console.log(`🌐 LSE: Loading ${lseUrl}`)

      await page.goto(lseUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(8000)

      try {
        await page.click('button[data-tab="latest"], a[href*="tab=latest"]')
        await this.wait(3000)
      } catch (error) {
        console.log('Latest tab already selected or not found')
      }

      await this.autoScroll(page)
      await this.wait(2000)

      const articles = await page.evaluate(() => {
        const items = []
        const allLinks = Array.from(document.querySelectorAll('a'))

        allLinks.forEach((link) => {
          try {
            const url = link.href
            const title = link.textContent?.trim()

            const isArticle = url.includes('/discover/news-and-insights/') &&
              !url.includes('?tab=') &&
              url.split('/').length > 5

            if (isArticle && title && title.length > 10 && title !== 'Learn more') {
              const parent = link.closest('div, article, section')
              const dateEl = parent?.querySelector('time, .date, [class*="date"]')
              const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime')
              const summaryEl = parent?.querySelector('p, .description, .summary')
              const summary = summaryEl?.textContent?.trim()

              items.push({ title, url, date, summary })
            } else if (isArticle && title === 'Learn more') {
              const parent = link.closest('div, article, section')
              const titleEl = parent?.querySelector('h2, h3, .title, [class*="title"]')
              const actualTitle = titleEl?.textContent?.trim() || url.split('/').pop().replace(/-/g, ' ')

              if (actualTitle && actualTitle !== 'Learn more') {
                const dateEl = parent?.querySelector('time, .date, [class*="date"]')
                const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime')
                const summaryEl = parent?.querySelector('p, .description, .summary')
                const summary = summaryEl?.textContent?.trim()

                items.push({ title: actualTitle, url, date, summary })
              }
            }
          } catch (error) {
            console.log('Error extracting article:', error.message)
          }
        })

        const seen = new Set()
        const uniqueItems = items.filter(item => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })

        return uniqueItems
      })

      console.log(`📰 LSE: Found ${articles.length} articles`)

      for (const article of articles.slice(0, 15)) {
        try {
          let detailContent = null

          try {
            await page.goto(article.url, {
              waitUntil: 'domcontentloaded',
              timeout: 15000
            })

            await this.wait(1000)

            detailContent = await page.evaluate(() => {
              const content = document.querySelector('article .content, .article-body, main, .page-content')
              return content ? content.textContent.trim().slice(0, 3000) : null
            })
          } catch (detailError) {
            console.log(`⚠️ Detail page timeout for: ${article.title.slice(0, 50)}... (continuing with metadata)`)
          }

          let summary = article.summary
          if (!summary && detailContent && detailContent.length > 50) {
            const cleanedContent = detailContent.replace(/\s+/g, ' ').trim()
            summary = cleanedContent.slice(0, 250)
            const lastPeriod = summary.lastIndexOf('.')
            if (lastPeriod > 100) {
              summary = summary.slice(0, lastPeriod + 1)
            } else {
              summary = summary + '...'
            }
          }
          if (!summary) {
            summary = article.title
          }

          results.push({
            headline: article.title,
            url: article.url,
            authority: 'LSE',
            area: 'Market News',
            source_category: 'market_news',
            source_description: 'London Stock Exchange News',
            fetched_date: new Date().toISOString(),
            raw_data: {
              sourceType: 'puppeteer',
              sourceKey: 'LSE',
              country: 'UK',
              priority: 'MEDIUM',
              originalDate: article.date,
              summary,
              fullContent: detailContent || `LSE News: ${article.title}`,
              market: {
                isMarketNews: true,
                exchange: 'LSE'
              }
            }
          })

          await this.wait(500)
        } catch (error) {
          console.log(`⚠️ Failed to process LSE article: ${article.title}`)
        }
      }

      await page.close()

      console.log(`\n🎉 LSE: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('❌ LSE scraping failed:', error.message)
      return results
    }
  }
}

module.exports = applyLseMethods
