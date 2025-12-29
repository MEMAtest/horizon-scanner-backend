const axios = require('axios')

const LSE_BASE_URL = 'https://www.londonstockexchange.com'
const LSE_API_BASE = 'https://api.londonstockexchange.com/api/v1'
const LSE_PAGE_PATH = 'discover/news-and-insights'
const LSE_PAGE_URL = `${LSE_BASE_URL}/${LSE_PAGE_PATH}?tab=latest`
const LSE_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function stripHtml(input) {
  if (!input) return ''
  return String(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildSummary(text, fallback) {
  const cleaned = stripHtml(text)
  if (!cleaned) return fallback || ''
  if (cleaned.length <= 280) return cleaned
  const truncated = cleaned.slice(0, 280)
  const lastPeriod = truncated.lastIndexOf('.')
  if (lastPeriod > 120) {
    return truncated.slice(0, lastPeriod + 1)
  }
  return `${truncated}...`
}

function normalizeUrl(link) {
  if (!link) return ''
  if (link.startsWith('http://') || link.startsWith('https://')) return link
  return `${LSE_BASE_URL}${link.startsWith('/') ? '' : '/'}${link}`
}

async function fetchLseJson(url, options = {}) {
  const response = await axios({
    method: options.method || 'GET',
    url,
    headers: {
      'User-Agent': LSE_USER_AGENT,
      Accept: 'application/json',
      ...(options.headers || {})
    },
    data: options.data,
    timeout: 20000
  })

  return response.data
}

function findLatestTab(pageData) {
  const components = Array.isArray(pageData?.components) ? pageData.components : []
  const tabNav = components.find(comp => comp && comp.type === 'tab-nav')
  const tabs = tabNav?.content?.[0]?.value?.contentTabNav
  if (!Array.isArray(tabs) || tabs.length === 0) return null
  return tabs.find(tab => (tab.label || '').toLowerCase() === 'latest') || tabs[0]
}

function extractApiArticles(components) {
  const items = []
  if (!Array.isArray(components)) return items

  components.forEach(comp => {
    if (!comp || typeof comp !== 'object') return

    if (comp.type === 'explore-stories-filter') {
      const results = comp.content?.[0]?.value?.exploreStoriesResults || []
      results.forEach(result => {
        items.push({
          title: result.title,
          url: result.link,
          date: result.datetime,
          summary: result.text
        })
      })
    }

    if (comp.type === 'card-grid') {
      const cards = comp.content?.[0]?.value?.cards || []
      cards.forEach(card => {
        items.push({
          title: card.title,
          url: card.link?.link || card.link?.url || card.link,
          summary: card.text
        })
      })
    }
  })

  return items
}

function dedupeArticles(items) {
  const seen = new Set()
  const deduped = []

  items.forEach(item => {
    const url = normalizeUrl(item.url)
    if (!item.title || !url || seen.has(url)) return
    seen.add(url)
    deduped.push({
      ...item,
      url
    })
  })

  return deduped
}

function applyLseMethods(ServiceClass) {
  ServiceClass.prototype.scrapeLSE = async function scrapeLSE() {
    console.log('\n📈 LSE: Starting scraping...')
    const results = []
    let page = null

    try {
      const browser = await this.initBrowser()
      page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      await page.setUserAgent(LSE_USER_AGENT)
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      })

      console.log(`🌐 LSE: Loading ${LSE_PAGE_URL}`)
      await page.goto(LSE_PAGE_URL, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(4000)

      let articles = []

      try {
        const pageData = await fetchLseJson(
          `${LSE_API_BASE}/pages?path=${LSE_PAGE_PATH}&parameters=tab%253Dlatest`
        )
        const latestTab = findLatestTab(pageData)

        if (latestTab) {
          const moduleIds = Array.isArray(latestTab.modules)
            ? latestTab.modules.map(module => module?.moduleId).filter(Boolean)
            : []

          if (moduleIds.length && latestTab.tabId) {
            const payload = {
              path: LSE_PAGE_PATH,
              parameters: `tab%3Dlatest%26tabId%3D${latestTab.tabId}`,
              components: moduleIds.map(id => ({ componentId: id }))
            }

            const refreshData = await fetchLseJson(
              `${LSE_API_BASE}/components/refresh`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: payload
              }
            )

            articles = extractApiArticles(refreshData)
            if (articles.length) {
              console.log(`📰 LSE: Found ${articles.length} articles via API`)
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ LSE API fetch failed: ${error.message}`)
      }

      if (!articles.length) {
        console.log('⚠️ LSE API returned no articles, falling back to DOM parsing')

        try {
          try {
            await page.click('button[data-tab="latest"], a[href*="tab=latest"]')
            await this.wait(3000)
          } catch (error) {
            console.log('Latest tab already selected or not found')
          }

          await this.autoScroll(page)
          await this.wait(2000)

          articles = await page.evaluate(() => {
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
                  const dateEl = parent?.querySelector('time, .date, [class*=\"date\"]')
                  const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime')
                  const summaryEl = parent?.querySelector('p, .description, .summary')
                  const summary = summaryEl?.textContent?.trim()

                  items.push({ title, url, date, summary })
                } else if (isArticle && title === 'Learn more') {
                  const parent = link.closest('div, article, section')
                  const titleEl = parent?.querySelector('h2, h3, .title, [class*=\"title\"]')
                  const actualTitle = titleEl?.textContent?.trim() || url.split('/').pop().replace(/-/g, ' ')

                  if (actualTitle && actualTitle !== 'Learn more') {
                    const dateEl = parent?.querySelector('time, .date, [class*=\"date\"]')
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
            return items.filter(item => {
              if (seen.has(item.url)) return false
              seen.add(item.url)
              return true
            })
          })

          console.log(`📰 LSE: Found ${articles.length} articles via DOM`)
        } catch (error) {
          console.log(`⚠️ LSE DOM parsing failed: ${error.message}`)
        }
      }

      const uniqueArticles = dedupeArticles(articles)
      console.log(`📰 LSE: Using ${uniqueArticles.length} unique articles`)

      for (const article of uniqueArticles.slice(0, 15)) {
        try {
          let detailContent = null
          let summaryText = article.summary

          if (!summaryText && article.url) {
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

              summaryText = detailContent
            } catch (detailError) {
              console.log(`⚠️ Detail page timeout for: ${article.title?.slice(0, 50)}... (continuing with metadata)`)
            }
          }

          const summary = buildSummary(summaryText, article.title)

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
              fullContent: detailContent || summary || `LSE News: ${article.title}`,
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

      console.log(`\n🎉 LSE: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('❌ LSE scraping failed:', error.message)
      return results
    } finally {
      if (page) {
        try {
          await page.close()
        } catch (error) {
          // ignore close errors
        }
      }
    }
  }
}

module.exports = applyLseMethods
