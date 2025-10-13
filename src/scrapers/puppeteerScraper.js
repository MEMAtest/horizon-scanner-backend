// src/scrapers/puppeteerScraper.js
// Puppeteer-based scraper for JavaScript-heavy and Cloudflare-protected sites
// Handles: FATF, Aquis Exchange, London Stock Exchange

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

// Use stealth plugin to bypass Cloudflare and bot detection
puppeteer.use(StealthPlugin())

class PuppeteerScraper {
  constructor() {
    this.browser = null
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    }
  }

  async initBrowser() {
    if (this.browser) return this.browser

    console.log('🚀 Launching Puppeteer browser with stealth mode...')
    this.browser = await puppeteer.launch({
      headless: 'new', // Use 'new' headless mode to bypass Cloudflare
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=site-per-process',
        '--window-size=1920x1080'
      ]
    })

    console.log('✅ Puppeteer browser launched successfully')
    return this.browser
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      console.log('🔒 Puppeteer browser closed')
    }
  }

  // =================================================================================
  // FATF SCRAPER
  // =================================================================================

  async scrapeFATF() {
    console.log('\n🌍 FATF: Starting comprehensive scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()

      // Set a realistic viewport
      await page.setViewport({ width: 1920, height: 1080 })

      // Scrape News
      console.log('📰 FATF: Scraping news...')
      const newsItems = await this.scrapeFATFNews(page)
      results.push(...newsItems)
      console.log(`✅ FATF News: ${newsItems.length} items`)

      // Wait before next request
      await this.wait(3000)

      // Scrape Publications
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

  async scrapeFATFNews(page) {
    const items = []

    try {
      const newsUrl = 'https://www.fatf-gafi.org/en/the-fatf/news.html'
      console.log(`🌐 FATF: Loading ${newsUrl}`)

      await page.goto(newsUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      // Wait for content to load (longer wait for FATF)
      await this.wait(8000)

      // Extract news items - FATF uses specific components
      const newsData = await page.evaluate(() => {
        const newsItems = []

        // Helper function to clean title and extract date
        const cleanTitleAndExtractDate = (rawText) => {
          if (!rawText) return { title: '', date: null }

          // Remove excessive whitespace and newlines
          let cleaned = rawText.replace(/\s+/g, ' ').trim()

          // Try to extract date pattern (e.g., "19 Apr 2024", "10 May 2024")
          const datePattern = /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i
          const dateMatch = cleaned.match(datePattern)

          let extractedDate = null
          let cleanedTitle = cleaned

          if (dateMatch) {
            extractedDate = dateMatch[1]
            // Remove the date and surrounding text to clean the title
            // Split on the date and take the part before it
            const parts = cleaned.split(datePattern)
            cleanedTitle = parts[0].trim()

            // If title is too short, try to get more content after the date
            if (cleanedTitle.length < 10 && parts[2]) {
              // Sometimes the actual description comes after the date
              const afterDate = parts[2].trim()
              // Take first sentence or first 100 chars
              const firstSentence = afterDate.match(/^[^.!?]+[.!?]/)
              if (firstSentence) {
                cleanedTitle = cleanedTitle + (cleanedTitle ? ': ' : '') + firstSentence[0].trim()
              }
            }
          }

          return { title: cleanedTitle, date: extractedDate }
        }

        // Helper function to check if URL/title is an informational page (not actual news)
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

        // FATF uses .cmp-teaser for featured items and .cmp-list__item for list items
        // First get featured news (teaser)
        const teasers = document.querySelectorAll('.cmp-teaser')
        teasers.forEach((teaser) => {
          const link = teaser.querySelector('a')
          if (link) {
            const rawTitle = link.textContent?.trim() || teaser.querySelector('[class*="title"]')?.textContent?.trim()
            let url = link.href

            // Fix relative URLs
            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            const description = teaser.querySelector('p, [class*="description"]')?.textContent?.trim()

            // Clean title and extract date from the raw text
            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            // Try to extract date from HTML elements first
            let date = extractedDate
            if (!date) {
              const dateElement = teaser.querySelector('time, .date, [class*="date"], .cmp-teaser__date')
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

        // Then get list items
        const listItems = document.querySelectorAll('.cmp-list__item')
        listItems.forEach((item) => {
          const link = item.querySelector('a')
          if (link && (link.href.includes('/news/') || link.href.includes('/the-fatf/'))) {
            const rawTitle = link.textContent?.trim()
            let url = link.href

            // Fix relative URLs
            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            // Clean title and extract date from the raw text
            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            // Try to extract date from HTML elements if not found in text
            let date = extractedDate
            if (!date) {
              const dateElement = item.querySelector('time, .date, [class*="date"], .cmp-list__item-date')
              if (dateElement) {
                date = dateElement.getAttribute('datetime') || dateElement.textContent?.trim()
              }
            }

            // Look for date in parent container if still not found
            if (!date) {
              const parent = item.closest('.cmp-list, .content-list')
              if (parent) {
                const parentDate = parent.querySelector('time, .date, [class*="date"]')
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

        // Also look for any other news links
        if (newsItems.length === 0) {
          const allLinks = document.querySelectorAll('a')
          allLinks.forEach(link => {
            let href = link.href
            const rawText = link.textContent?.trim()

            // Fix relative URLs
            if (href && !href.startsWith('http')) {
              href = new URL(href, 'https://www.fatf-gafi.org').href
            }

            if (href && rawText && rawText.length > 30 &&
                (href.includes('/news/') || href.includes('/the-fatf/') || href.includes('/fatf-')) &&
                !href.includes('.pdf')) {

              // Clean title and extract date
              const { title, date: extractedDate } = cleanTitleAndExtractDate(rawText)

              // Try to find date in parent if not found in text
              let date = extractedDate
              if (!date) {
                const parent = link.closest('div, article, section, li')
                if (parent) {
                  const dateEl = parent.querySelector('time, .date, [class*="date"]')
                  if (dateEl) {
                    date = dateEl.getAttribute('datetime') || dateEl.textContent?.trim()
                  }
                }
              }

              // Filter out informational pages
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

        // Remove duplicates
        const seen = new Set()
        return newsItems.filter(item => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })
      })

      // Navigate to detail pages and extract full content
      for (const item of newsData.slice(0, 10)) {
        // Limit to first 10 to avoid timeout
        try {
          const detailContent = await this.scrapeFATFDetailPage(page, item.url)
          // Parse and format date if available
          let publishedDate = null
          if (item.date) {
            try {
              // Try to parse the date string
              const parsed = new Date(item.date)
              if (!isNaN(parsed.getTime())) {
                publishedDate = parsed.toISOString()
              } else {
                // If direct parsing fails, keep the original string
                publishedDate = item.date
              }
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

          await this.wait(2000) // Rate limiting
        } catch (error) {
          console.log(`⚠️ Failed to scrape detail for: ${item.title}`)
        }
      }
    } catch (error) {
      console.error('❌ FATF news scraping failed:', error.message)
    }

    return items
  }

  async scrapeFATFPublications(page) {
    const items = []

    try {
      const pubUrl = 'https://www.fatf-gafi.org/en/publications.html'
      console.log(`🌐 FATF: Loading ${pubUrl}`)

      await page.goto(pubUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      // Wait for content (longer for FATF)
      await this.wait(8000)

      // Extract publications - FATF uses .cmp-teaser and .cmp-list__item
      const pubData = await page.evaluate(() => {
        const pubs = []

        // Helper function to clean title and extract date (same as news)
        const cleanTitleAndExtractDate = (rawText) => {
          if (!rawText) return { title: '', date: null }

          // Remove excessive whitespace and newlines
          let cleaned = rawText.replace(/\s+/g, ' ').trim()

          // Try to extract date pattern (e.g., "19 Apr 2024", "10 May 2024")
          const datePattern = /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i
          const dateMatch = cleaned.match(datePattern)

          let extractedDate = null
          let cleanedTitle = cleaned

          if (dateMatch) {
            extractedDate = dateMatch[1]
            // Remove the date and surrounding text to clean the title
            const parts = cleaned.split(datePattern)
            cleanedTitle = parts[0].trim()

            // If title is too short, try to get more content after the date
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

        // Helper function to check if URL/title is an informational page (not actual publication)
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

        // Get featured publications (teasers)
        const teasers = document.querySelectorAll('.cmp-teaser')
        teasers.forEach((teaser) => {
          const link = teaser.querySelector('a')
          if (link && link.href.includes('/publications/')) {
            const rawTitle = link.textContent?.trim() || teaser.querySelector('[class*="title"]')?.textContent?.trim()
            let url = link.href

            // Fix relative URLs
            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            const description = teaser.querySelector('p, [class*="description"]')?.textContent?.trim()

            // Clean title and extract date from raw text
            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            // Try to extract date from HTML elements if not found in text
            let date = extractedDate
            if (!date) {
              const dateElement = teaser.querySelector('time, .date, [class*="date"], .cmp-teaser__date')
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

        // Get publication list items
        const listItems = document.querySelectorAll('.cmp-list__item')
        listItems.forEach((item) => {
          const link = item.querySelector('a')
          if (link && link.href.includes('/publications/')) {
            const rawTitle = link.textContent?.trim()
            let url = link.href

            // Fix relative URLs
            if (url && !url.startsWith('http')) {
              url = new URL(url, 'https://www.fatf-gafi.org').href
            }

            // Clean title and extract date from raw text
            const { title, date: extractedDate } = cleanTitleAndExtractDate(rawTitle)

            // Try to extract date from HTML elements if not found in text
            let date = extractedDate
            if (!date) {
              const dateElement = item.querySelector('time, .date, [class*="date"], .cmp-list__item-date')
              if (dateElement) {
                date = dateElement.getAttribute('datetime') || dateElement.textContent?.trim()
              }
            }

            // Look in parent if still not found
            if (!date) {
              const parent = item.closest('.cmp-list, .content-list')
              if (parent) {
                const parentDate = parent.querySelector('time, .date, [class*="date"]')
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

        // If no items found with specific selectors, look for publication links
        if (pubs.length === 0) {
          const allLinks = document.querySelectorAll('a[href*="/publications/"]')
          allLinks.forEach(link => {
            let href = link.href
            const rawText = link.textContent?.trim()

            // Fix relative URLs
            if (href && !href.startsWith('http')) {
              href = new URL(href, 'https://www.fatf-gafi.org').href
            }

            if (href && rawText && rawText.length > 20 &&
                !href.includes('.pdf') &&
                !rawText.includes('Read more') &&
                href.includes('fatf-gafi.org')) {

              // Clean title and extract date
              const { title, date: extractedDate } = cleanTitleAndExtractDate(rawText)

              // Try to find date in parent if not found in text
              let date = extractedDate
              if (!date) {
                const parent = link.closest('div, article, section, li')
                if (parent) {
                  const dateEl = parent.querySelector('time, .date, [class*="date"]')
                  if (dateEl) {
                    date = dateEl.getAttribute('datetime') || dateEl.textContent?.trim()
                  }
                }
              }

              // Filter out informational pages
              if (!isInformationalPage(href, title || rawText)) {
                pubs.push({
                  title: title || rawText,
                  url: href,
                  date: date || null,
                  type: 'Publication',
                  summary: title || rawText
                })
              }
            }
          })
        }

        // Remove duplicates
        const seen = new Set()
        return pubs.filter(item => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })
      })

      // Navigate to detail pages
      for (const item of pubData.slice(0, 10)) {
        try {
          const detailContent = await this.scrapeFATFDetailPage(page, item.url)

          // Parse and format date if available
          let publishedDate = null
          if (item.date) {
            try {
              // Try to parse the date string
              const parsed = new Date(item.date)
              if (!isNaN(parsed.getTime())) {
                publishedDate = parsed.toISOString()
              } else {
                // If direct parsing fails, keep the original string
                publishedDate = item.date
              }
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

  async scrapeFATFDetailPage(page, url) {
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

        // Extract summary (first paragraph or first 300 chars)
        const summaryEl =
          document.querySelector('.summary') ||
          document.querySelector('.lead') ||
          document.querySelector('p')
        const summary = summaryEl ? summaryEl.textContent.trim().slice(0, 300) : null

        return {
          content: contentText.slice(0, 5000), // Limit content size
          summary: summary || contentText.slice(0, 300)
        }
      })

      return content
    } catch (error) {
      console.error(`⚠️ Detail page scraping failed for ${url}:`, error.message)
      return null
    }
  }

  // =================================================================================
  // AQUIS EXCHANGE SCRAPER
  // =================================================================================

  async scrapeAquis() {
    console.log('\n📊 AQUIS: Starting scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      // Get current month and previous month
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1 // JavaScript months are 0-indexed

      const monthsToScrape = [
        { year, month },
        { year: month === 1 ? year - 1 : year, month: month === 1 ? 12 : month - 1 }
      ]

      for (const { year: y, month: m } of monthsToScrape) {
        console.log(`📅 AQUIS: Scraping ${y}-${String(m).padStart(2, '0')}`)
        const monthItems = await this.scrapeAquisMonth(page, y, m)
        results.push(...monthItems)
        await this.wait(2000)
      }

      await page.close()

      console.log(`\n🎉 AQUIS: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('❌ AQUIS scraping failed:', error.message)
      return results
    }
  }

  async scrapeAquisMonth(page, year, month) {
    const items = []

    try {
      const url = `https://www.aquis.eu/stock-exchange/announcements?year=${year}&month=${month}`
      console.log(`🌐 AQUIS: Loading ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(3000)

      // Extract announcement list
      const announcements = await page.evaluate(() => {
        const items = []

        // Find table rows
        const rows = document.querySelectorAll('table tbody tr')

        rows.forEach((row) => {
          try {
            const cells = row.querySelectorAll('td')
            if (cells.length >= 2) {
              const dateTime = cells[0]?.textContent?.trim()
              const titleEl = cells[1]?.querySelector('a') || cells[1]
              const title = titleEl?.textContent?.trim()

              // Get link from first cell or second cell
              const link = cells[1]?.querySelector('a')?.href || row.querySelector('a')?.href

              if (title && dateTime && link) {
                items.push({ dateTime, title, viewLink: link })
              }
            }
          } catch (error) {
            console.log('Error extracting row:', error.message)
          }
        })

        return items
      })

      console.log(`📋 AQUIS: Found ${announcements.length} announcements`)

      // Extract detail for each announcement
      for (const announcement of announcements.slice(0, 20)) {
        // Limit to 20 per month
        try {
          if (!announcement.viewLink) continue

          await page.goto(announcement.viewLink, {
            waitUntil: 'networkidle2',
            timeout: 30000
          })

          await this.wait(2000)

          const detailContent = await page.evaluate(() => {
            const content = document.querySelector('.announcement-content, .content, main')
            return content ? content.textContent.trim() : null
          })

          // Parse company name from title
          const companyMatch = announcement.title.match(/^([^-]+)\s*-\s*(.+)$/)
          const company = companyMatch ? companyMatch[1].trim() : 'Unknown'
          const announcementType = companyMatch ? companyMatch[2].trim() : announcement.title

          // Generate summary from detail content (first 250 chars, clean whitespace)
          let summary = announcementType // Default to announcement type
          if (detailContent && detailContent.length > 50) {
            // Clean excessive whitespace and take first 250 chars
            const cleanedContent = detailContent.replace(/\s+/g, ' ').trim()
            summary = cleanedContent.slice(0, 250)
            // Try to end at a sentence boundary
            const lastPeriod = summary.lastIndexOf('.')
            const lastQuestion = summary.lastIndexOf('?')
            const lastExclamation = summary.lastIndexOf('!')
            const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
            if (lastSentenceEnd > 100) {
              summary = summary.slice(0, lastSentenceEnd + 1)
            } else {
              summary = summary + '...'
            }
          }

          items.push({
            headline: announcement.title,
            url: announcement.viewLink,
            authority: 'AQUIS',
            area: 'Market Announcements',
            source_category: 'market_news',
            source_description: `Aquis Exchange - ${company}`,
            fetched_date: new Date().toISOString(),
            raw_data: {
              sourceType: 'puppeteer',
              sourceKey: 'AQUIS',
              country: 'UK',
              priority: 'MEDIUM',
              originalDate: announcement.dateTime,
              company,
              announcementType,
              summary, // Add summary field
              fullContent: detailContent,
              market: {
                isMarketNews: true,
                exchange: 'Aquis',
                company
              }
            }
          })

          await this.wait(1500)
        } catch (error) {
          console.log(`⚠️ Failed to scrape announcement: ${announcement.title}`)
        }
      }
    } catch (error) {
      console.error(`❌ AQUIS month scraping failed for ${year}-${month}:`, error.message)
    }

    return items
  }

  // =================================================================================
  // LONDON STOCK EXCHANGE SCRAPER
  // =================================================================================

  async scrapeLSE() {
    console.log('\n📈 LSE: Starting scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      const lseUrl = 'https://www.londonstockexchange.com/discover/news-and-insights?tab=latest'
      console.log(`🌐 LSE: Loading ${lseUrl}`)

      await page.goto(lseUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(8000) // Increased wait for Angular app to load

      // Click "Latest" tab if needed
      try {
        await page.click('button[data-tab="latest"], a[href*="tab=latest"]')
        await this.wait(3000)
      } catch (error) {
        console.log('Latest tab already selected or not found')
      }

      // Scroll to load more content
      await this.autoScroll(page)
      await this.wait(2000) // Wait after scroll

      // Extract articles - LSE uses specific URL patterns
      const articles = await page.evaluate(() => {
        const items = []

        // Find all links
        const allLinks = Array.from(document.querySelectorAll('a'))

        allLinks.forEach((link) => {
          try {
            const url = link.href
            const title = link.textContent?.trim()

            // LSE articles have this pattern: /discover/news-and-insights/[article-slug]
            // But NOT the tab navigation: /discover/news-and-insights?tab=...
            const isArticle = url.includes('/discover/news-and-insights/') &&
              !url.includes('?tab=') &&
              url.split('/').length > 5 // Has a slug after news-and-insights

            if (isArticle && title && title.length > 10 && title !== 'Learn more') {
              // Look for date near the link
              const parent = link.closest('div, article, section')
              const dateEl = parent?.querySelector('time, .date, [class*="date"]')
              const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime')

              // Look for summary
              const summaryEl = parent?.querySelector('p, .description, .summary')
              const summary = summaryEl?.textContent?.trim()

              items.push({ title, url, date, summary })
            } else if (isArticle && title === 'Learn more') {
              // For "Learn more" links, get title from parent
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

        // Deduplicate by URL
        const seen = new Set()
        const uniqueItems = items.filter(item => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })

        return uniqueItems
      })

      console.log(`📰 LSE: Found ${articles.length} articles`)

      // For LSE, collect metadata only (detail pages are too slow/unreliable)
      for (const article of articles.slice(0, 15)) {
        // Limit to 15
        try {
          // Add article with metadata even if detail scraping fails
          let detailContent = null

          // Try to get detail content but don't fail if it times out
          try {
            await page.goto(article.url, {
              waitUntil: 'domcontentloaded', // Less strict wait
              timeout: 15000 // Shorter timeout
            })

            await this.wait(1000)

            detailContent = await page.evaluate(() => {
              const content = document.querySelector('article .content, .article-body, main, .page-content')
              return content ? content.textContent.trim().slice(0, 3000) : null
            })
          } catch (detailError) {
            console.log(`⚠️ Detail page timeout for: ${article.title.slice(0, 50)}... (continuing with metadata)`)
          }

          // Generate summary with fallback
          let summary = article.summary
          if (!summary && detailContent && detailContent.length > 50) {
            // Generate from detail content if summary not available
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
            summary = article.title // Final fallback to title
          }

          // Add item regardless of whether detail content was retrieved
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

  // =================================================================================
  // HELPER FUNCTIONS
  // =================================================================================

  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance

          if (totalHeight >= scrollHeight || totalHeight >= 3000) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })
    })
  }

  async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // =================================================================================
  // MAIN ORCHESTRATOR
  // =================================================================================

  async scrapeAll() {
    console.log('\n🚀 Starting Puppeteer scraping for all sources...')
    const allResults = []

    try {
      // Scrape FATF
      const fatfResults = await this.scrapeFATF()
      allResults.push(...fatfResults)

      // Scrape Aquis
      const aquisResults = await this.scrapeAquis()
      allResults.push(...aquisResults)

      // Scrape LSE
      const lseResults = await this.scrapeLSE()
      allResults.push(...lseResults)

      console.log(`\n✅ Puppeteer scraping complete: ${allResults.length} total items`)

      return allResults
    } catch (error) {
      console.error('❌ Puppeteer scraping failed:', error)
      return allResults
    } finally {
      await this.closeBrowser()
    }
  }
}

// Export singleton
module.exports = new PuppeteerScraper()
