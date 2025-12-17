function applyJMLSGMethods(ServiceClass) {
  ServiceClass.prototype.scrapeJMLSG = async function scrapeJMLSG() {
    console.log('\n📰 JMLSG: Starting scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      // Set realistic user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

      // Add extra headers to appear more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      })

      // Try multiple URLs - JMLSG news location may vary
      const urls = [
        'https://www.jmlsg.org.uk/',  // Homepage often has latest updates
        'https://www.jmlsg.org.uk/latest-news/',
        'https://www.jmlsg.org.uk/news/'
      ]

      let items = []

      for (const url of urls) {
        console.log(`🌐 JMLSG: Trying ${url}`)

        try {
          await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 45000
          })

          await this.wait(6000)

          // Scroll to load lazy content
          await this.autoScroll(page)
          await this.wait(2000)

          // Extract news items with multiple strategies
          items = await page.evaluate(() => {
            const articles = []
            const seen = new Set()

            // Strategy 1: Look for news-related containers
            const containerSelectors = [
              '.news-item',
              '.news-article',
              'article',
              '.post',
              '.entry',
              '[class*="news"]',
              '[class*="update"]',
              '.card',
              '.content-item'
            ]

            for (const selector of containerSelectors) {
              const elements = document.querySelectorAll(selector)
              elements.forEach(article => {
                const titleEl = article.querySelector('h2, h3, h4, .title, .post-title, .entry-title')
                const linkEl = article.querySelector('a[href]')
                const title = titleEl?.textContent?.trim() || linkEl?.textContent?.trim()
                const url = linkEl?.href

                if (title && url && title.length > 15 && !seen.has(url)) {
                  seen.add(url)
                  const dateEl = article.querySelector('.date, time, .published, .post-date, [datetime]')
                  const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime')
                  const summaryEl = article.querySelector('p, .excerpt, .summary, .description')
                  const summary = summaryEl?.textContent?.trim()

                  articles.push({ title, url, date, summary })
                }
              })
              if (articles.length > 0) break
            }

            // Strategy 2: Look for links with guidance/news-related keywords
            if (articles.length === 0) {
              const links = document.querySelectorAll('a')
              links.forEach(link => {
                const href = link.href || ''
                const text = link.textContent?.trim()

                // JMLSG focuses on AML/CTF guidance
                const isRelevant =
                  href.includes('/guidance') ||
                  href.includes('/news') ||
                  href.includes('/update') ||
                  href.includes('/consultation') ||
                  (text && text.length > 20 && text.length < 200 &&
                   /guidance|consultation|amendment|update|money laundering|aml|ctf|sanctions/i.test(text))

                if (isRelevant && !seen.has(href) && text && text.length > 15) {
                  seen.add(href)
                  const parent = link.closest('div, li, article, section')
                  const dateEl = parent?.querySelector('.date, time, [class*="date"]')
                  const date = dateEl?.textContent?.trim()
                  const summaryEl = parent?.querySelector('p:not(:first-child)')
                  const summary = summaryEl?.textContent?.trim()

                  articles.push({ title: text, url: href, date, summary })
                }
              })
            }

            return articles.slice(0, 20)
          })

          if (items.length > 0) {
            console.log(`📰 JMLSG: Found ${items.length} items from ${url}`)
            break
          }
        } catch (urlError) {
          console.log(`⚠️ JMLSG: Failed to load ${url}: ${urlError.message}`)
          continue
        }
      }

      results.push(...items.filter(item => item.title && item.url))
      await page.close()

      console.log(`\n🎉 JMLSG: Total items collected: ${results.length}`)

      // Normalize the results
      return results.map(item => ({
        title: item.title,
        url: item.url,
        publishedDate: item.date || new Date().toISOString(),
        description: item.summary?.substring(0, 500) || `JMLSG update: ${item.title}`,
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
