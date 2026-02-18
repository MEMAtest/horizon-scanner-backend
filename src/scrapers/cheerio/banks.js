/**
 * Cheerio-based Bank News Scrapers
 *
 * Lightweight alternative to Puppeteer bank scrapers for serverless environments.
 * Uses axios + cheerio to extract press releases from bank websites.
 * Some JS-rendered sites may return fewer results than Puppeteer, but this
 * is preferred over zero results when Puppeteer can't run (e.g., Vercel).
 */

const axios = require('axios')
const cheerio = require('cheerio')

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const BANK_CONFIGS = {
  JPMorgan: {
    name: 'JPMorgan Chase',
    url: 'https://www.jpmorganchase.com/newsroom/press-releases',
    baseUrl: 'https://www.jpmorganchase.com',
    linkPatterns: ['a[href*="/newsroom/press-releases/"]', 'a[href*="/newsroom/stories/"]'],
    skipPatterns: ['/press-releases$', '/stories$', '/press-releases/$', '/stories/$']
  },
  BofA: {
    name: 'Bank of America',
    url: 'https://newsroom.bankofamerica.com/content/newsroom/press-releases.html',
    baseUrl: 'https://newsroom.bankofamerica.com',
    linkPatterns: ['a[href*="/press-releases/"]', 'a[href*="/newsroom/"][href$=".html"]'],
    skipPatterns: ['/press-releases.html$', '/newsroom/$']
  },
  Citigroup: {
    name: 'Citigroup',
    url: 'https://www.citigroup.com/global/news/press-release',
    baseUrl: 'https://www.citigroup.com',
    linkPatterns: ['a[href*="/press-release/"]', 'a[href*="/news/2"]'],
    skipPatterns: ['/press-release$', '/news/$']
  },
  WellsFargo: {
    name: 'Wells Fargo',
    url: 'https://newsroom.wf.com/',
    baseUrl: 'https://newsroom.wf.com',
    linkPatterns: ['a[href*="news-details"]', 'a[href*="/news-releases/"]'],
    skipPatterns: ['/news-releases/$', '/news-releases/default.aspx$']
  },
  Goldman: {
    name: 'Goldman Sachs',
    url: 'https://www.goldmansachs.com/pressroom',
    baseUrl: 'https://www.goldmansachs.com',
    linkPatterns: ['a[href*="/pressroom/press-releases/"]', 'a[href*="/insights/"]'],
    skipPatterns: ['/pressroom/$', '/press-releases/$']
  },
  MorganStanley: {
    name: 'Morgan Stanley',
    url: 'https://www.morganstanley.com/about-us-newsroom',
    baseUrl: 'https://www.morganstanley.com',
    linkPatterns: ['a[href*="/press-releases/"]', 'a[href*="/articles/"]'],
    skipPatterns: ['/press-releases$', '/press-releases/$', '/about-us-newsroom$', '/about-us-newsroom/$']
  },
  HSBC: {
    name: 'HSBC',
    url: 'https://www.hsbc.com/news-and-views/news',
    baseUrl: 'https://www.hsbc.com',
    linkPatterns: ['a[href*="/news-and-views/news/"]'],
    skipPatterns: ['/hsbc-news-archive$', '/news-and-views/news$']
  },
  Barclays: {
    name: 'Barclays',
    url: 'https://home.barclays/news/press-releases/',
    baseUrl: 'https://home.barclays',
    linkPatterns: ['a[href*="/news/press-releases/2"]', 'a[href*="/news/2"]'],
    skipPatterns: ['/news/$', '/press-releases/$']
  },
  DeutscheBank: {
    name: 'Deutsche Bank',
    url: 'https://www.db.com/news',
    baseUrl: 'https://www.db.com',
    linkPatterns: ['a[href*="/news/"]', '.news-stream-entry a'],
    skipPatterns: ['/news$', '/news/$']
  },
  UBS: {
    name: 'UBS',
    url: 'https://www.ubs.com/global/en/media.html',
    baseUrl: 'https://www.ubs.com',
    linkPatterns: ['a[href*="/media/"][href$=".html"]', 'a[href*="media-releases"]'],
    skipPatterns: ['/media.html$', '/media/$']
  },
  Lloyds: {
    name: 'Lloyds Banking Group',
    url: 'https://www.lloydsbankinggroup.com/media/press-releases.html',
    baseUrl: 'https://www.lloydsbankinggroup.com',
    linkPatterns: ['a[href*="/media/press-releases/"]'],
    skipPatterns: ['/press-releases.html$', '/press-releases/$']
  },
  NatWest: {
    name: 'NatWest Group',
    url: 'https://www.natwestgroup.com/news-and-insights/news-room/press-releases.html',
    baseUrl: 'https://www.natwestgroup.com',
    linkPatterns: ['a[href*="/news-room/"]', 'a[href*="/press-releases/"]'],
    skipPatterns: ['/press-releases.html$', '/news-room.html$']
  },
  SantanderUK: {
    name: 'Santander UK',
    url: 'https://www.santander.co.uk/about-santander/media-centre/press-releases',
    baseUrl: 'https://www.santander.co.uk',
    linkPatterns: ['a[href*="/media-centre/press-releases/"]'],
    skipPatterns: ['/press-releases$', '/press-releases/$']
  },
  Nationwide: {
    name: 'Nationwide Building Society',
    url: 'https://www.nationwide.co.uk/media/news/',
    baseUrl: 'https://www.nationwide.co.uk',
    linkPatterns: ['a[href*="/media/news/"]'],
    skipPatterns: ['/news/$', '/news$']
  },
  TSB: {
    name: 'TSB',
    url: 'https://www.tsb.co.uk/news-releases.html',
    baseUrl: 'https://www.tsb.co.uk',
    linkPatterns: ['a[href*="/news-releases/"]'],
    skipPatterns: ['/news-releases.html$', '/news-releases/$']
  },
  Monzo: {
    name: 'Monzo',
    url: 'https://monzo.com/blog',
    baseUrl: 'https://monzo.com',
    linkPatterns: ['a[href*="/blog/"]'],
    skipPatterns: ['^https://monzo\\.com/blog/?$']
  },
  Starling: {
    name: 'Starling Bank',
    url: 'https://www.starlingbank.com/news/',
    baseUrl: 'https://www.starlingbank.com',
    linkPatterns: ['a[href*="/news/"]'],
    skipPatterns: ['/news/$', '/news$']
  },
  Revolut: {
    name: 'Revolut',
    url: 'https://www.revolut.com/news/',
    baseUrl: 'https://www.revolut.com',
    linkPatterns: ['a[href*="/news/"]', 'a[href*="/blog/"]'],
    skipPatterns: ['/news/$', '/news$']
  },
  MetroBank: {
    name: 'Metro Bank',
    url: 'https://www.metrobankonline.co.uk/about-us/press-releases/',
    baseUrl: 'https://www.metrobankonline.co.uk',
    linkPatterns: ['a[href*="/press-releases/"]'],
    skipPatterns: ['/press-releases/$', '/press-releases$']
  },
  VirginMoney: {
    name: 'Virgin Money',
    url: 'https://www.virginmoneyukplc.com/newsroom/all-news-and-releases/',
    baseUrl: 'https://www.virginmoneyukplc.com',
    linkPatterns: ['a[href*="/newsroom/"]'],
    skipPatterns: ['/newsroom/$', '/all-news-and-releases/$']
  }
}

/**
 * Scrape a bank's press releases using cheerio (no browser needed)
 */
async function scrapeBankCheerio(bankKey) {
  const config = BANK_CONFIGS[bankKey]
  if (!config) {
    console.log(`[cheerio-banks] Unknown bank key: ${bankKey}`)
    return []
  }

  try {
    console.log(`[cheerio-banks] Fetching ${config.name} from ${config.url}`)

    const response = await axios.get(config.url, {
      timeout: 15000,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      maxRedirects: 5
    })

    const $ = cheerio.load(response.data)
    const items = []
    const seen = new Set()

    for (const pattern of config.linkPatterns) {
      $(pattern).each((i, el) => {
        if (items.length >= 15) return false

        let url = $(el).attr('href') || ''
        if (!url) return

        // Resolve relative URLs
        if (url.startsWith('/')) {
          url = config.baseUrl + url
        } else if (!url.startsWith('http')) {
          return
        }

        // Skip index/listing pages
        const shouldSkip = config.skipPatterns.some(p => new RegExp(p).test(url))
        if (shouldSkip) return

        if (seen.has(url)) return
        seen.add(url)

        // Extract title from the link or its container
        const container = $(el).closest('article, [class*="card"], [class*="item"], [class*="teaser"], li')
        let title = ''
        if (container.length) {
          title = container.find('h2, h3, h4, [class*="title"], [class*="headline"]').first().text().trim()
        }
        if (!title) {
          title = $(el).text().trim()
        }

        // Clean up title
        title = title.replace(/\s+/g, ' ').trim()

        if (!title || title.length < 15) return
        // Skip navigation-like links
        if (/^(view all|see more|read more|learn more|press releases|news)$/i.test(title)) return

        // Try to extract date from nearby elements
        let date = ''
        if (container.length) {
          const dateEl = container.find('time, [class*="date"], [datetime]').first()
          date = dateEl.attr('datetime') || dateEl.text().trim() || ''
        }

        items.push({
          title,
          url,
          date,
          summary: '',
          authority: bankKey
        })
      })
    }

    // If link-pattern selectors found nothing, try a generic approach
    if (items.length === 0) {
      $('a[href]').each((i, el) => {
        if (items.length >= 15) return false

        let url = $(el).attr('href') || ''
        if (!url) return
        if (url.startsWith('/')) url = config.baseUrl + url
        if (!url.startsWith('http')) return

        // Must contain news-like path segments
        if (!/\/(news|press|release|blog|article|insight|stories|newsroom)\//i.test(url)) return
        // Must not be the index page
        if (url === config.url || url === config.url + '/') return

        if (seen.has(url)) return
        seen.add(url)

        const container = $(el).closest('article, li, [class*="card"], [class*="item"], div')
        let title = ''
        if (container.length) {
          title = container.find('h2, h3, h4').first().text().trim()
        }
        if (!title) title = $(el).text().trim()
        title = title.replace(/\s+/g, ' ').trim()

        if (!title || title.length < 15) return
        if (/^(view all|see more|read more|learn more|press releases|news)$/i.test(title)) return

        items.push({
          title,
          url,
          date: '',
          summary: '',
          authority: bankKey
        })
      })
    }

    console.log(`[cheerio-banks] ${config.name}: found ${items.length} items`)
    return items
  } catch (error) {
    console.error(`[cheerio-banks] Failed to scrape ${config.name}:`, error.message)
    return []
  }
}

// Export individual scrape functions matching the puppeteer interface
const bankScrapers = {}
for (const key of Object.keys(BANK_CONFIGS)) {
  bankScrapers[`scrape${key}`] = () => scrapeBankCheerio(key)
}

module.exports = {
  scrapeBankCheerio,
  BANK_CONFIGS,
  ...bankScrapers
}
