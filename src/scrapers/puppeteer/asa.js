function applyASAMethods(ServiceClass) {
  ServiceClass.prototype.scrapeASA = async function scrapeASA() {
    console.log('\n📺 ASA: Starting Puppeteer scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      const url = 'https://www.asa.org.uk/advice-and-resources/news.html'
      console.log(`🌐 ASA: Loading ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(3000)

      // Click "Load More" button several times to load more articles
      const loadMoreClicks = 5
      for (let i = 0; i < loadMoreClicks; i++) {
        try {
          // Look for load more button with various selectors
          const loadMoreButton = await page.$(
            'button.load-more, .load-more-button, button[data-action="load-more"], ' +
            'a.load-more, .btn-load-more, [class*="load-more"], [class*="LoadMore"]'
          )

          if (loadMoreButton) {
            const isVisible = await page.evaluate(el => {
              const style = window.getComputedStyle(el)
              return style.display !== 'none' && style.visibility !== 'hidden'
            }, loadMoreButton)

            if (isVisible) {
              console.log(`📥 ASA: Clicking Load More (${i + 1}/${loadMoreClicks})...`)
              await loadMoreButton.click()
              await this.wait(2500)
            } else {
              console.log('📌 ASA: Load More button hidden, stopping')
              break
            }
          } else {
            console.log('📌 ASA: No Load More button found, stopping')
            break
          }
        } catch (clickError) {
          console.log(`⚠️ ASA: Load More click ${i + 1} failed:`, clickError.message)
          break
        }
      }

      // Extract all loaded articles
      const articles = await page.evaluate(() => {
        const items = []

        // Try multiple selector patterns for news items
        const selectors = [
          '.news-item',
          '.news-article',
          'article',
          '.content-item',
          '.news-card',
          '[class*="news"]',
          '.resource-item'
        ]

        let elements = []
        for (const selector of selectors) {
          const found = document.querySelectorAll(selector)
          if (found.length > elements.length) {
            elements = found
          }
        }

        elements.forEach((el) => {
          try {
            // Extract title
            const titleEl = el.querySelector('h3, h2, h4, .title, a[class*="title"]')
            const title = titleEl?.textContent?.trim()

            // Extract link
            const linkEl = el.querySelector('a[href]')
            const link = linkEl?.href || titleEl?.closest('a')?.href

            // Extract date
            const dateEl = el.querySelector('.date, time, .meta, [class*="date"]')
            let dateText = dateEl?.textContent?.trim()

            // If no dedicated date element, try to find date pattern in text
            if (!dateText) {
              const fullText = el.textContent
              const dateMatch = fullText.match(/\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i)
              dateText = dateMatch ? dateMatch[0] : null
            }

            // Extract summary/description
            const summaryEl = el.querySelector('p, .description, .summary, .excerpt')
            const summary = summaryEl?.textContent?.trim()

            if (title && link) {
              items.push({
                title,
                url: link,
                dateText,
                summary: summary || ''
              })
            }
          } catch (error) {
            console.log('Error extracting article:', error.message)
          }
        })

        return items
      })

      console.log(`📋 ASA: Extracted ${articles.length} articles`)

      // Process and filter articles
      const now = new Date()
      const maxAgeDays = 60
      const cutoffDate = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000)

      for (const article of articles.slice(0, 30)) {
        try {
          let publishedDate = null

          if (article.dateText) {
            // Parse date like "18 December 2025"
            const parsed = new Date(article.dateText)
            if (!isNaN(parsed.getTime())) {
              publishedDate = parsed
            }
          }

          // Skip if too old
          if (publishedDate && publishedDate < cutoffDate) {
            continue
          }

          results.push({
            headline: article.title,
            url: article.url,
            authority: 'ASA',
            area: 'Advertising Standards',
            source_category: 'regulatory_news',
            source_description: 'Advertising Standards Authority - News',
            publishedDate: publishedDate || now,
            summary: article.summary || `ASA update: ${article.title}`,
            fetched_date: new Date().toISOString(),
            raw_data: {
              sourceType: 'puppeteer',
              sourceKey: 'ASA',
              country: 'UK',
              priority: 'MEDIUM',
              originalDate: article.dateText,
              sectors: ['Advertising', 'Consumer Protection', 'Marketing']
            }
          })
        } catch (error) {
          console.log(`⚠️ ASA: Failed to process article: ${article.title}`)
        }
      }

      await page.close()

      console.log(`\n🎉 ASA: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('❌ ASA Puppeteer scraping failed:', error.message)
      return results
    }
  }
}

module.exports = applyASAMethods
