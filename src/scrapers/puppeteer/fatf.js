function applyFatfMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFATF = async function scrapeFATF() {
    console.log('\n🌍 FATF: Starting comprehensive scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      console.log('📰 FATF: Scraping news...')
      const newsItems = await this.scrapeFATFNews(page)
      results.push(...newsItems)
      console.log(`✅ FATF News: ${newsItems.length} items`)

      await this.wait(3000)

      console.log('📚 FATF: Scraping publications...')
      const pubItems = await this.scrapeFATFPublications(page)
      results.push(...pubItems)
      console.log(`✅ FATF Publications: ${pubItems.length} items`)

      await page.close()

      console.log(`\n🎉 FATF: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('❌ FATF scraping failed:', error.message)
      return results
    }
  }

  ServiceClass.prototype.scrapeFATFNews = async function scrapeFATFNews(page) {
    const items = []

    try {
      const newsUrl = 'https://www.fatf-gafi.org/en/the-fatf/news.html'
      console.log(`🌐 FATF: Loading ${newsUrl}`)

      await page.goto(newsUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(12000)

      const newsData = await page.evaluate(() => {
        const newsItems = []

        const cleanTitleAndExtractDate = (rawText) => {
          if (!rawText) return { title: '', date: null }
          let cleaned = rawText.replace(/\s+/g, ' ').trim()
          const datePattern = /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i
          const dateMatch = cleaned.match(datePattern)

          let extractedDate = null
          let cleanedTitle = cleaned

          if (dateMatch) {
            extractedDate = dateMatch[1]
            const parts = cleaned.split(datePattern)
            cleanedTitle = parts[0].trim()

            if (cleanedTitle.length < 10 && parts[2]) {
              const afterDate = parts[2].trim()
              const firstSentence = afterDate.match(/^[^.!?]+[.!?]/)
              if (firstSentence) {
                cleanedTitle = cleanedTitle + (cleanedTitle ? ': ' : '') + firstSentence[0].trim()
              }
            }
          }

          return { title: cleanedTitle, date: extractedDate }
        }

        const isInformationalPage = (url, title) => {
          const informationalKeywords = [
            'job-opportunities', 'job opportunities',
            'fatf-secretariat', 'secretariat',
            'fatf-code-of-conduct', 'code of conduct',
            'history-of-the-fatf', 'history of',
            'fatf-presidency', 'presidency',
            'mandate-of-the-fatf', 'mandate',
            'outcomes-of-meetings', 'outcomes of',
            'about-us', 'about',
            'contact', 'members', 'membership',
            'who-we-are', 'what-we-do',
            'how-to-join', 'faqs'
          ]

          const urlLower = url.toLowerCase()
          const titleLower = title.toLowerCase()

          return informationalKeywords.some(keyword =>
            urlLower.includes(keyword) || titleLower.includes(keyword)
          )
        }

        const teasers = document.querySelectorAll('.cmp-teaser')
        teasers.forEach((teaser) => {
          const link = teaser.querySelector('a')
          if (link) {
            const rawTitle = link.textContent?.trim() || teaser.querySelector('[class*=\"title\"]')?.textContent?.trim()
            let url = link.href

            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            const description = teaser.querySelector('p, [class*=\"description\"]')?.textContent?.trim()
            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            let date = extractedDate
            if (!date) {
              const dateElement = teaser.querySelector('time, .date, [class*=\"date\"], .cmp-teaser__date')
              if (dateElement) {
                date = dateElement.getAttribute('datetime') || dateElement.textContent?.trim()
              }
            }

            if (title && url && url.includes('fatf-gafi.org') && !isInformationalPage(url, title)) {
              newsItems.push({
                title,
                url,
                date: date || null,
                summary: description || title
              })
            }
          }
        })

        const listItems = document.querySelectorAll('.cmp-list__item')
        listItems.forEach((item) => {
          const link = item.querySelector('a')
          if (link && link.href.includes('/news/')) {
            const rawTitle = link.textContent?.trim()
            let url = link.href

            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            let date = extractedDate
            if (!date) {
              const dateElement = item.querySelector('time, .date, [class*=\"date\"], .cmp-list__item-date')
              if (dateElement) {
                date = dateElement.getAttribute('datetime') || dateElement.textContent?.trim()
              }
            }

            if (!date) {
              const parent = item.closest('.cmp-list, .content-list')
              if (parent) {
                const parentDate = parent.querySelector('time, .date, [class*=\"date\"]')
                if (parentDate) {
                  date = parentDate.getAttribute('datetime') || parentDate.textContent?.trim()
                }
              }
            }

            if (title && url && title.length > 10 && url.includes('fatf-gafi.org') && !isInformationalPage(url, title)) {
              newsItems.push({
                title,
                url,
                date: date || null,
                summary: title
              })
            }
          }
        })

        if (newsItems.length === 0) {
          const allLinks = document.querySelectorAll('a')
          allLinks.forEach(link => {
            let href = link.href
            const rawText = link.textContent?.trim()

            if (href && !href.startsWith('http')) {
              href = new URL(href, 'https://www.fatf-gafi.org').href
            }

            if (href && rawText && rawText.length > 30 &&
                (href.includes('/news/') || href.includes('/the-fatf/') || href.includes('/fatf-')) &&
                !href.includes('.pdf')) {

              const { title, date: extractedDate } = cleanTitleAndExtractDate(rawText)

              let date = extractedDate
              if (!date) {
                const parent = link.closest('div, article, section, li')
                if (parent) {
                  const dateEl = parent.querySelector('time, .date, [class*=\"date\"]')
                  if (dateEl) {
                    date = dateEl.getAttribute('datetime') || dateEl.textContent?.trim()
                  }
                }
              }

              if (!isInformationalPage(href, title || rawText)) {
                newsItems.push({
                  title: title || rawText,
                  url: href,
                  date: date || null,
                  summary: title || rawText
                })
              }
            }
          })
        }

        const seen = new Set()
        return newsItems.filter(item => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })
      })

      for (const item of newsData.slice(0, 10)) {
        try {
          const detailContent = await this.scrapeFATFDetailPage(page, item.url)
          let publishedDate = null
          if (item.date) {
            try {
              const parsed = new Date(item.date)
              publishedDate = !isNaN(parsed.getTime()) ? parsed.toISOString() : item.date
            } catch (e) {
              publishedDate = item.date
            }
          }

          items.push({
            headline: item.title,
            url: item.url,
            authority: 'FATF',
            area: 'News',
            source_category: 'international_scraping',
            source_description: 'FATF News',
            fetched_date: new Date().toISOString(),
            published_date: publishedDate,
            raw_data: {
              sourceType: 'puppeteer',
              sourceKey: 'FATF',
              country: 'International',
              priority: 'MEDIUM',
              originalDate: item.date || null,
              summary: item.summary || detailContent?.summary,
              fullContent: detailContent?.content,
              international: {
                isInternational: true,
                sourceAuthority: 'FATF',
                sourceCountry: 'International',
                scrapingTarget: 'news'
              }
            }
          })

          await this.wait(2000)
        } catch (error) {
          console.log(`⚠️ Failed to scrape detail for: ${item.title}`)
        }
      }
    } catch (error) {
      console.error('❌ FATF news scraping failed:', error.message)
    }

    return items
  }

  ServiceClass.prototype.scrapeFATFPublications = async function scrapeFATFPublications(page) {
    const items = []

    try {
      const pubUrl = 'https://www.fatf-gafi.org/en/publications.html'
      console.log(`🌐 FATF: Loading ${pubUrl}`)

      await page.goto(pubUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(8000)

      const pubData = await page.evaluate(() => {
        const pubs = []

        const cleanTitleAndExtractDate = (rawText) => {
          if (!rawText) return { title: '', date: null }
          let cleaned = rawText.replace(/\s+/g, ' ').trim()
          const datePattern = /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i
          const dateMatch = cleaned.match(datePattern)

          let extractedDate = null
          let cleanedTitle = cleaned

          if (dateMatch) {
            extractedDate = dateMatch[1]
            const parts = cleaned.split(datePattern)
            cleanedTitle = parts[0].trim()

            if (cleanedTitle.length < 10 && parts[2]) {
              const afterDate = parts[2].trim()
              const firstSentence = afterDate.match(/^[^.!?]+[.!?]/)
              if (firstSentence) {
                cleanedTitle = cleanedTitle + (cleanedTitle ? ': ' : '') + firstSentence[0].trim()
              }
            }
          }

          return { title: cleanedTitle, date: extractedDate }
        }

        const isInformationalPage = (url, title) => {
          const informationalKeywords = [
            'job-opportunities', 'job opportunities',
            'fatf-secretariat', 'secretariat',
            'fatf-code-of-conduct', 'code of conduct',
            'history-of-the-fatf', 'history of',
            'fatf-presidency', 'presidency',
            'mandate-of-the-fatf', 'mandate',
            'outcomes-of-meetings', 'outcomes of',
            'about-us', 'about',
            'contact', 'members', 'membership',
            'who-we-are', 'what-we-do',
            'how-to-join', 'faqs'
          ]

          const urlLower = url.toLowerCase()
          const titleLower = title.toLowerCase()

          return informationalKeywords.some(keyword =>
            urlLower.includes(keyword) || titleLower.includes(keyword)
          )
        }

        const teasers = document.querySelectorAll('.cmp-teaser')
        teasers.forEach((teaser) => {
          const link = teaser.querySelector('a')
          if (link && link.href.includes('/publications/')) {
            const rawTitle = link.textContent?.trim() || teaser.querySelector('[class*=\"title\"]')?.textContent?.trim()
            let url = link.href

            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            const description = teaser.querySelector('p, [class*=\"description\"]')?.textContent?.trim()
            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            let date = extractedDate
            if (!date) {
              const dateElement = teaser.querySelector('time, .date, [class*=\"date\"], .cmp-teaser__date')
              if (dateElement) {
                date = dateElement.getAttribute('datetime') || dateElement.textContent?.trim()
              }
            }

            if (title && url && url.includes('fatf-gafi.org') && !isInformationalPage(url, title)) {
              pubs.push({
                title,
                url,
                date: date || null,
                type: 'Publication',
                summary: description || title
              })
            }
          }
        })

        const listItems = document.querySelectorAll('.cmp-list__item')
        listItems.forEach((item) => {
          const link = item.querySelector('a')
          if (link && link.href.includes('/publications/')) {
            const rawTitle = link.textContent?.trim()
            let url = link.href

            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            let date = extractedDate
            if (!date) {
              const dateElement = item.querySelector('time, .date, [class*=\"date\"], .cmp-list__item-date')
              if (dateElement) {
                date = dateElement.getAttribute('datetime') || dateElement.textContent?.trim()
              }
            }

            if (!date) {
              const parent = item.closest('.cmp-list, .content-list')
              if (parent) {
                const parentDate = parent.querySelector('time, .date, [class*=\"date\"]')
                if (parentDate) {
                  date = parentDate.getAttribute('datetime') || parentDate.textContent?.trim()
                }
              }
            }

            if (title && url && title.length > 10 && url.includes('fatf-gafi.org') && !isInformationalPage(url, title)) {
              pubs.push({
                title,
                url,
                date: date || null,
                type: 'Publication',
                summary: title
              })
            }
          }
        })

        if (pubs.length === 0) {
          const allLinks = document.querySelectorAll('a[href*=\"/publications/\"]')
          allLinks.forEach(link => {
            let href = link.href
            const rawText = link.textContent?.trim()

            if (href && !href.startsWith('http')) {
              href = new URL(href, 'https://www.fatf-gafi.org').href
            }

            if (href && rawText && rawText.length > 30 && !href.includes('.pdf')) {
              const { title, date: extractedDate } = cleanTitleAndExtractDate(rawText)

              if (!isInformationalPage(href, title || rawText)) {
                pubs.push({
                  title: title || rawText,
                  url: href,
                  date: extractedDate,
                  type: 'Publication',
                  summary: title || rawText
                })
              }
            }
          })
        }

        const seen = new Set()
        return pubs.filter(item => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })
      })

      for (const item of pubData.slice(0, 10)) {
        try {
          const detailContent = await this.scrapeFATFDetailPage(page, item.url)
          let publishedDate = null
          if (item.date) {
            try {
              const parsed = new Date(item.date)
              publishedDate = !isNaN(parsed.getTime()) ? parsed.toISOString() : item.date
            } catch (e) {
              publishedDate = item.date
            }
          }

          items.push({
            headline: item.title,
            url: item.url,
            authority: 'FATF',
            area: item.type || 'Publications',
            source_category: 'international_scraping',
            source_description: 'FATF Publications',
            fetched_date: new Date().toISOString(),
            published_date: publishedDate,
            raw_data: {
              sourceType: 'puppeteer',
              sourceKey: 'FATF',
              country: 'International',
              priority: 'MEDIUM',
              originalDate: item.date || null,
              documentType: item.type,
              summary: item.summary || detailContent?.summary,
              fullContent: detailContent?.content,
              international: {
                isInternational: true,
                sourceAuthority: 'FATF',
                sourceCountry: 'International',
                scrapingTarget: 'publications'
              }
            }
          })

          await this.wait(2000)
        } catch (error) {
          console.log(`⚠️ Failed to scrape detail for: ${item.title}`)
        }
      }
    } catch (error) {
      console.error('❌ FATF publications scraping failed:', error.message)
    }

    return items
  }

  ServiceClass.prototype.scrapeFATFDetailPage = async function scrapeFATFDetailPage(page, url) {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(3000)

      const content = await page.evaluate(() => {
        const contentSelectors = [
          '.content-main',
          '.main-content',
          '.publication-content',
          '.news-content',
          'article .content',
          'main',
          '.body-content'
        ]

        let contentText = ''
        for (const selector of contentSelectors) {
          const contentEl = document.querySelector(selector)
          if (contentEl) {
            contentText = contentEl.textContent.trim()
            if (contentText.length > 100) break
          }
        }

        const summaryEl =
          document.querySelector('.summary') ||
          document.querySelector('.lead') ||
          document.querySelector('p')
        const summary = summaryEl ? summaryEl.textContent.trim().slice(0, 300) : null

        return {
          content: contentText.slice(0, 5000),
          summary: summary || contentText.slice(0, 300)
        }
      })

      return content
    } catch (error) {
      console.error(`⚠️ Detail page scraping failed for ${url}:`, error.message)
      return null
    }
  }
}

module.exports = applyFatfMethods
