/**
 * Cheerio-based Regulatory Scrapers
 *
 * Lightweight alternative to Puppeteer for serverless environments.
 * Each function scrapes a regulatory website using axios + cheerio.
 *
 * Batch A: UK Core (FCA Papers, FCA Dear CEO, PRA Supervisory, FSCS, Ofcom)
 * Batch C: US (CFTC, CNBV)
 * Batch D: Asia-Pacific (APRA, AUSTRAC, RBI, CIMA, CBE)
 * Batch E: Africa + Others (SARB, FSCA, FIC_SA, Wolfsberg, Egmont, NCA)
 * Batch F: Special (LSE, Aquis, Pay.UK, OFAC)
 * Middle East: DFSA, CBUAE, SAMA
 */

const axios = require('axios')
const cheerio = require('cheerio')

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive'
}

function resolveUrl(href, baseUrl) {
  if (!href) return ''
  if (href.startsWith('http')) return href
  if (href.startsWith('/')) return baseUrl + href
  return ''
}

function parseDate(text) {
  if (!text) return null
  try {
    const d = new Date(text)
    if (!isNaN(d.getTime())) return d.toISOString()
  } catch {}
  return null
}

// ============================================
// BATCH A — UK CORE
// ============================================

/**
 * FCA Consultation/Discussion Papers
 * URL structure: /publications/search-results?category=...&sort_by=dmetaZ
 * Selectors: ol li with h3 > a, date in "Published: DD Month YYYY" text
 */
async function scrapeFCAPapers(paperType = 'consultation') {
  const isCP = paperType === 'consultation'
  const authority = isCP ? 'FCA_CP' : 'FCA_DP'
  const typeName = isCP ? 'Consultation Papers' : 'Discussion Papers'
  const category = isCP
    ? 'policy%20and%20guidance-consultation%20papers'
    : 'policy%20and%20guidance-discussion%20papers'
  const url = `https://www.fca.org.uk/publications/search-results?category=${category}&sort_by=dmetaZ`
  const baseUrl = 'https://www.fca.org.uk'

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('ol li, .search-item, article').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('h3 a, h2 a, a[href*="/publications/"]').first()
    let href = linkEl.attr('href')
    if (!href) return

    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href) || href.includes('#') || href.includes('javascript:')) return
    if (!href.includes('/publications/') && !href.includes('fca.org.uk')) return

    const title = linkEl.text().trim().replace(/\s+/g, ' ')
    if (!title || title.length < 10) return

    // Extract date from "Published: DD Month YYYY" pattern
    let dateText = ''
    const text = $(el).text()
    const dateMatch = text.match(/Published:\s*(\d{1,2}\s+\w+\s+\d{4}|\d{4}-\d{2}-\d{2})/)
    if (dateMatch) dateText = dateMatch[1]

    // Get summary from p tag
    const summary = $(el).find('p').first().text().trim().substring(0, 300)

    seen.add(href)
    items.push({
      title,
      url: href,
      authority,
      publishedDate: parseDate(dateText),
      summary: summary || title,
      area: typeName,
      sectors: ['Multi-sector', 'Banking', 'Investment Management', 'Consumer Credit']
    })
  })

  console.log(`[cheerio] FCA ${typeName}: found ${items.length} items`)
  return items
}

async function scrapeFCAConsultationPapers() {
  return scrapeFCAPapers('consultation')
}

async function scrapeFCADiscussionPapers() {
  return scrapeFCAPapers('discussion')
}

/**
 * FCA Dear CEO Letters
 * Selectors: li.search-item with h3 a, date in "Published: DD/MM/YYYY" text
 */
async function scrapeFCADearCeo() {
  const baseUrl = 'https://www.fca.org.uk'
  const url = `${baseUrl}/publications/search-results?category=dear-ceo-letters&sort_by=dmetaZ`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('li.search-item, .search-item, ol li, article').each((i, el) => {
    if (items.length >= 30) return false

    const linkEl = $(el).find('h3 a, .search-item__clickthrough, a[href*="dear-ceo"], a[href*="correspondence"]').first()
    let href = linkEl.attr('href')
    if (!href) return

    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = linkEl.text().trim().replace(/\s+/g, ' ')
    if (!title || title.length < 10) return

    // Extract date - FCA uses "Published: DD/MM/YYYY" or "DD Month YYYY"
    let publishedDate = null
    const fullText = $(el).text()

    const ddmmyyyyMatch = fullText.match(/Published[:\s]+(\d{1,2})\/(\d{1,2})\/(\d{4})/i)
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch
      publishedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    if (!publishedDate) {
      const longDateMatch = fullText.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i)
      if (longDateMatch) {
        publishedDate = parseDate(`${longDateMatch[1]} ${longDateMatch[2]} ${longDateMatch[3]}`)
      }
    }

    const descEl = $(el).find('.search-item__body, p, .summary').first()
    const description = descEl.text().trim().substring(0, 500)

    seen.add(href)
    items.push({
      title,
      url: href,
      authority: 'FCA',
      publishedDate: publishedDate ? parseDate(publishedDate) || publishedDate : null,
      summary: description || title,
      area: 'Dear CEO Letter',
      sectors: ['Multi-sector', 'Banking', 'Investment Management', 'Consumer Credit', 'Insurance', 'Payments']
    })
  })

  console.log(`[cheerio] FCA Dear CEO: found ${items.length} items`)
  return items
}

/**
 * PRA Supervisory Statements
 * Multiple search URLs, extracts SS/PS/CP documents
 */
async function scrapePRASupervisory() {
  const baseUrl = 'https://www.bankofengland.co.uk'
  const urls = [
    `${baseUrl}/search?SearchTerms=supervisory+statement&Taxonomies=0829ed0c-5fdc-42a1-8c6f-4fe14d92de77`,
    `${baseUrl}/search?SearchTerms=policy+statement&Taxonomies=0829ed0c-5fdc-42a1-8c6f-4fe14d92de77`
  ]

  const allItems = []
  const seen = new Set()

  for (const url of urls) {
    try {
      const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
      const $ = cheerio.load(response.data)

      $('.results-list li, .search-results li, article, .card').each((i, el) => {
        if (allItems.length >= 30) return false

        const linkEl = $(el).find('a[href]').first()
        let href = linkEl.attr('href')
        if (!href) return

        href = resolveUrl(href, baseUrl)
        if (!href || seen.has(href) || href.includes('#')) return

        const title = linkEl.text().trim() || $(el).find('h2, h3, h4, .title').first().text().trim()
        if (!title || title.length < 10) return

        // Filter for PRA supervisory content
        const text = `${title} ${href}`.toLowerCase()
        const isPRADoc = /\b(ss|ps|cp)\d+\/\d+\b/i.test(title) ||
          /supervisory\s*statement/i.test(text) ||
          /policy\s*statement/i.test(text) ||
          /consultation\s*paper/i.test(text) ||
          /dear\s*(ceo|cro|cfo)/i.test(text) ||
          /prudential\s*regulation/i.test(text)

        if (!isPRADoc) return

        const dateEl = $(el).find('time, .date, [datetime]').first()
        const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

        const descEl = $(el).find('p, .summary, .description').first()
        const description = descEl.text().trim().substring(0, 500)

        seen.add(href)
        allItems.push({
          title: title.replace(/\s+/g, ' '),
          url: href,
          authority: 'PRA',
          publishedDate: parseDate(dateText),
          summary: description || title,
          area: 'Supervisory Statement',
          sectors: ['Banking', 'Insurance', 'Investment Firms', 'Capital Requirements']
        })
      })
    } catch (error) {
      console.error(`[cheerio] PRA search page failed:`, error.message)
    }
  }

  console.log(`[cheerio] PRA Supervisory: found ${allItems.length} items`)
  return allItems
}

/**
 * FSCS News
 * Selectors: a[href*="/news/"] with h3 inside
 */
async function scrapeFSCS() {
  const baseUrl = 'https://www.fscs.org.uk'
  const url = `${baseUrl}/news/`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('a[href*="/news/"]').each((i, el) => {
    if (items.length >= 25) return false

    let href = $(el).attr('href')
    if (!href) return

    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    // Skip section links
    if (href === baseUrl + '/news/' ||
        href.endsWith('/news/fscs-news/') ||
        href.endsWith('/news/podcasts/') ||
        href.endsWith('/news/fraud-scams/') ||
        href.includes('#')) return

    const titleEl = $(el).find('h3, h2, h4, .title').first()
    const title = titleEl.text().trim() || $(el).text().trim()

    if (!title || title.length < 10 || title === 'See all') return

    const descEl = $(el).find('p').first()
    const description = descEl.text().trim().substring(0, 300)

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'FSCS',
      publishedDate: null,
      summary: description || title,
      area: 'News',
      sectors: ['Consumer Protection', 'Banking', 'Insurance', 'Investment Management']
    })
  })

  console.log(`[cheerio] FSCS: found ${items.length} items`)
  return items
}

/**
 * Ofcom News
 * Selectors: article/card containers with h3 a links
 */
async function scrapeOfcom() {
  const baseUrl = 'https://www.ofcom.org.uk'
  const url = `${baseUrl}/news-and-updates`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .card, .content-item, .listing-item').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('h3 a, h2 a, a[href*="/news/"], a[href*="/publications/"]').first()
    let href = linkEl.attr('href')
    if (!href) return

    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href) || href.includes('#')) return
    if (href.includes('/research') || href.includes('/advice') || href.includes('/consultations')) return

    const title = linkEl.text().trim()
    if (!title || title.length < 15) return
    if (/^(read more|view all|show more)$/i.test(title)) return

    // Date extraction
    let dateText = ''
    $(el).find('p').each((_, p) => {
      const text = $(p).text()
      const match = text.match(/(\d{1,2}\s+\w+\s+\d{4})/)
      if (match) dateText = match[1]
    })
    if (!dateText) {
      const timeEl = $(el).find('time').first()
      dateText = timeEl.attr('datetime') || timeEl.text().trim() || ''
    }

    // Summary
    let summary = ''
    $(el).find('p').each((_, p) => {
      const text = $(p).text().trim()
      if (!text.includes('Published:') && text.length > 50) {
        summary = text.substring(0, 300)
        return false
      }
    })

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'OFCOM',
      publishedDate: parseDate(dateText),
      summary: summary || title,
      area: 'News',
      sectors: ['Telecommunications', 'Broadcasting', 'Digital']
    })
  })

  // Fallback: look for news links directly
  if (items.length < 3) {
    $('a[href*="/news/"]').each((i, el) => {
      if (items.length >= 20) return false

      let href = $(el).attr('href')
      if (!href) return
      href = resolveUrl(href, baseUrl)
      if (!href || seen.has(href)) return
      if (href.endsWith('/news/') || href.endsWith('/news-and-updates')) return

      const title = $(el).text().trim()
      if (!title || title.length < 20) return
      if (/^(read more|view all)$/i.test(title)) return

      seen.add(href)
      items.push({
        title: title.replace(/\s+/g, ' '),
        url: href,
        authority: 'OFCOM',
        publishedDate: null,
        summary: title,
        area: 'News',
        sectors: ['Telecommunications', 'Broadcasting', 'Digital']
      })
    })
  }

  console.log(`[cheerio] Ofcom: found ${items.length} items`)
  return items
}

// ============================================
// BATCH C — US + AMERICAS
// ============================================

/**
 * CFTC Press Releases
 * Selectors: a[href*="/PressRoom/PressReleases/"]
 */
async function scrapeCFTC() {
  const baseUrl = 'https://www.cftc.gov'
  const url = `${baseUrl}/PressRoom/PressReleases`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('a[href*="/PressRoom/PressReleases/"]').each((i, el) => {
    if (items.length >= 20) return false

    let href = $(el).attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return
    // Skip the index page itself
    if (href.endsWith('/PressReleases') || href.endsWith('/PressReleases/')) return

    const title = $(el).text().trim().replace(/\s+/g, ' ')
    if (!title || title.length < 15) return

    // Try to extract date from nearby elements
    const container = $(el).closest('tr, li, article, div')
    let dateText = ''
    if (container.length) {
      const dateEl = container.find('time, .date, td').first()
      const text = dateEl.text().trim()
      if (/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(text) || /\w+\s+\d{1,2},?\s+\d{4}/.test(text)) {
        dateText = text
      }
    }

    seen.add(href)
    items.push({
      title,
      url: href,
      authority: 'CFTC',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'Press Release',
      sectors: ['Derivatives', 'Capital Markets', 'Trading', 'Cryptocurrency']
    })
  })

  console.log(`[cheerio] CFTC: found ${items.length} items`)
  return items
}

/**
 * CNBV Mexico News
 * Slow server - needs extended timeout
 */
async function scrapeCNBV() {
  const baseUrl = 'https://www.gob.mx'
  const url = `${baseUrl}/cnbv/prensa`

  const response = await axios.get(url, { timeout: 30000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .press-item, .node, li').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'CNBV',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'Press Release',
      sectors: ['Banking', 'Capital Markets', 'AML & Financial Crime', 'Fintech']
    })
  })

  console.log(`[cheerio] CNBV: found ${items.length} items`)
  return items
}

// ============================================
// BATCH D — ASIA-PACIFIC
// ============================================

/**
 * APRA Media Releases (Australia)
 */
async function scrapeAPRA() {
  const baseUrl = 'https://www.apra.gov.au'
  const url = `${baseUrl}/news-and-publications`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .media-release, .news-item, .card, .views-row').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href) || href.includes('#')) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'APRA',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['Banking', 'Insurance', 'Superannuation', 'Prudential Regulation']
    })
  })

  console.log(`[cheerio] APRA: found ${items.length} items`)
  return items
}

/**
 * AUSTRAC Media Releases (Australia)
 */
async function scrapeAUSTRAC() {
  const baseUrl = 'https://www.austrac.gov.au'
  const url = `${baseUrl}/news-and-media/media-release`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .media-release, .news-item, .views-row, .node').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'AUSTRAC',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'Media Release',
      sectors: ['AML & Financial Crime', 'Banking', 'Remittances', 'Cryptocurrency']
    })
  })

  console.log(`[cheerio] AUSTRAC: found ${items.length} items`)
  return items
}

/**
 * RBI Press Releases (India)
 */
async function scrapeRBI() {
  const baseUrl = 'https://rbi.org.in'
  const url = `${baseUrl}/Scripts/BS_PressreleaseDisplay.aspx`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  // RBI uses table-based layout or list
  $('table tr, .tablebg tr, article, li').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = linkEl.text().trim()
    if (!title || title.length < 10) return

    // Date from cells
    const cells = $(el).find('td')
    let dateText = ''
    cells.each((_, td) => {
      const text = $(td).text().trim()
      if (/\w+\s+\d{1,2},?\s+\d{4}/.test(text) || /\d{2}[\/-]\d{2}[\/-]\d{4}/.test(text)) {
        dateText = text
        return false
      }
    })

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'RBI',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'Press Release',
      sectors: ['Banking', 'Payment Services', 'AML & Financial Crime', 'Fintech']
    })
  })

  console.log(`[cheerio] RBI: found ${items.length} items`)
  return items
}

/**
 * CIMA Industry Notices (Cayman Islands)
 */
async function scrapeCIMA() {
  const baseUrl = 'https://www.cima.ky'
  const url = `${baseUrl}/general-industry-notices`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .notice-item, .views-row, li, tr').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'CIMA',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'Industry Notice',
      sectors: ['Banking', 'Investment Management', 'Insurance', 'AML & Financial Crime']
    })
  })

  console.log(`[cheerio] CIMA: found ${items.length} items`)
  return items
}

/**
 * CBE Egypt News
 */
async function scrapeCBE() {
  const baseUrl = 'https://www.cbe.org.eg'
  const url = `${baseUrl}/en/news-publications/news`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .card, .list-item, li').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'CBE',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['Banking', 'Monetary Policy', 'AML & Financial Crime', 'Payment Services']
    })
  })

  console.log(`[cheerio] CBE: found ${items.length} items`)
  return items
}

// ============================================
// BATCH E — AFRICA + OTHERS
// ============================================

/**
 * FSCA Media Releases (South Africa)
 */
async function scrapeFSCA() {
  const baseUrl = 'https://www.fsca.co.za'
  const url = `${baseUrl}/Latest-News/`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .accordion-item, .card, li').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title, .accordion-header').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'FSCA',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['Capital Markets', 'Insurance', 'Consumer Protection', 'Cryptocurrency']
    })
  })

  console.log(`[cheerio] FSCA: found ${items.length} items`)
  return items
}

/**
 * FIC South Africa - Financial Intelligence Centre
 */
async function scrapeFICSA() {
  const baseUrl = 'https://www.fic.gov.za'

  const response = await axios.get(baseUrl, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  // FIC uses news/media sections on homepage
  $('article, .news-item, .card, a[href*="news"], a[href*="media"]').each((i, el) => {
    if (items.length >= 20) return false

    let href, title
    if (el.tagName === 'a') {
      href = $(el).attr('href')
      title = $(el).text().trim()
    } else {
      const linkEl = $(el).find('a[href]').first()
      href = linkEl.attr('href')
      title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    }

    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return
    if (!title || title.length < 10) return

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'FIC_SA',
      publishedDate: null,
      summary: title,
      area: 'News',
      sectors: ['AML & Financial Crime', 'Banking', 'Compliance', 'Terrorism Financing']
    })
  })

  console.log(`[cheerio] FIC SA: found ${items.length} items`)
  return items
}

/**
 * Wolfsberg Group - News and Resources
 * Note: keeps per-path try/catch since one path failing shouldn't block the other
 */
async function scrapeWolfsberg() {
  const items = []
  const seen = new Set()
  let lastError = null

  for (const path of ['/news', '/resources']) {
    try {
      const url = `https://wolfsberg-group.org${path}`
      const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
      const $ = cheerio.load(response.data)

      $('article, .news-item, .resource-item, .card, li').each((i, el) => {
        if (items.length >= 20) return false

        const linkEl = $(el).find('a[href]').first()
        let href = linkEl.attr('href')
        if (!href) return
        href = resolveUrl(href, 'https://wolfsberg-group.org')
        if (!href || seen.has(href)) return

        const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
        if (!title || title.length < 10) return

        const dateEl = $(el).find('time, .date, [datetime]').first()
        const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

        seen.add(href)
        items.push({
          title: title.replace(/\s+/g, ' '),
          url: href,
          authority: 'WOLFSBERG',
          publishedDate: parseDate(dateText),
          summary: title,
          area: path === '/news' ? 'News' : 'Resources',
          sectors: ['AML & Financial Crime', 'KYC', 'Banking', 'Correspondent Banking']
        })
      })
    } catch (error) {
      console.error(`[cheerio] Wolfsberg ${path} failed:`, error.message)
      lastError = error
    }
  }

  // If ALL paths failed, throw so orchestrator records error
  if (items.length === 0 && lastError) {
    throw lastError
  }

  console.log(`[cheerio] Wolfsberg: found ${items.length} items`)
  return items
}

/**
 * Egmont Group - Try WordPress REST API first, fall back to HTML
 * If both fail, throws so orchestrator records error
 */
async function scrapeEgmont() {
  // Try WordPress REST API first (more reliable)
  try {
    const apiUrl = 'https://egmontgroup.org/wp-json/wp/v2/posts?per_page=20'
    const response = await axios.get(apiUrl, { timeout: 15000, headers: { 'User-Agent': UA } })

    if (Array.isArray(response.data) && response.data.length > 0) {
      const items = response.data.map(post => ({
        title: (post.title?.rendered || '').replace(/<[^>]*>/g, '').trim(),
        url: post.link,
        authority: 'EGMONT',
        publishedDate: parseDate(post.date),
        summary: (post.excerpt?.rendered || '').replace(/<[^>]*>/g, '').trim().substring(0, 300),
        area: 'News',
        sectors: ['AML & Financial Crime', 'FIU', 'Information Sharing', 'SAR']
      })).filter(item => item.title && item.url)

      console.log(`[cheerio] Egmont (WP API): found ${items.length} items`)
      return items
    }
  } catch (apiErr) {
    console.log(`[cheerio] Egmont WP API unavailable, trying HTML: ${apiErr.message}`)
  }

  // Fallback: HTML scraping — let errors propagate
  const response = await axios.get('https://egmontgroup.org/news-and-events/', { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .post, .card').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    if (!href.startsWith('http')) href = 'https://egmontgroup.org' + href
    if (seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'EGMONT',
      publishedDate: null,
      summary: title,
      area: 'News',
      sectors: ['AML & Financial Crime', 'FIU', 'Information Sharing', 'SAR']
    })
  })

  console.log(`[cheerio] Egmont (HTML): found ${items.length} items`)
  return items
}

/**
 * NCA - National Crime Agency
 * Schema.org microdata with standard article selectors
 */
async function scrapeNCA() {
  const baseUrl = 'https://www.nationalcrimeagency.gov.uk'
  const url = `${baseUrl}/news`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .views-row, .card, li').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href) || href === `${baseUrl}/news`) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'NCA',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['AML & Financial Crime', 'Banking', 'Compliance', 'Law Enforcement']
    })
  })

  console.log(`[cheerio] NCA: found ${items.length} items`)
  return items
}

// ============================================
// BATCH F — SPECIAL CASES
// ============================================

/**
 * LSE News
 */
async function scrapeLSE() {
  const baseUrl = 'https://www.londonstockexchange.com'

  const response = await axios.get(`${baseUrl}/discover/news-and-insights?tab=latest`, {
    timeout: 20000,
    headers: HEADERS
  })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .card, .news-item, a[href*="/news/"]').each((i, el) => {
    if (items.length >= 20) return false

    let href, title
    if (el.tagName === 'a') {
      href = $(el).attr('href')
      title = $(el).text().trim()
    } else {
      const linkEl = $(el).find('a[href]').first()
      href = linkEl.attr('href')
      title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    }

    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href) || href.includes('#')) return
    if (!title || title.length < 10) return

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'LSE',
      publishedDate: null,
      summary: title,
      area: 'News',
      sectors: ['Capital Markets', 'Market News', 'Investment']
    })
  })

  console.log(`[cheerio] LSE: found ${items.length} items`)
  return items
}

/**
 * Aquis Exchange Announcements
 * Table + detail page structure
 */
async function scrapeAquis() {
  const baseUrl = 'https://www.aquis.eu'
  const url = `${baseUrl}/stock-exchange/announcements`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('table tbody tr, article, .announcement-item, .card').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    // Get title from cells or headings
    const title = $(el).find('h2, h3, td a').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 5) return

    const cells = $(el).find('td')
    let dateText = ''
    cells.each((_, td) => {
      const text = $(td).text().trim()
      if (/\d{2}[\/-]\d{2}[\/-]\d{4}/.test(text) || /\w+\s+\d{1,2},?\s+\d{4}/.test(text)) {
        dateText = text
        return false
      }
    })

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'AQUIS',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'Announcement',
      sectors: ['Capital Markets', 'Listed Companies', 'Market News']
    })
  })

  console.log(`[cheerio] Aquis: found ${items.length} items`)
  return items
}

/**
 * Pay.UK Latest Updates
 */
async function scrapePayUK() {
  const baseUrl = 'https://www.wearepay.uk'
  const url = `${baseUrl}/news-and-insight/latest-updates/`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .card, .post-item, li').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'Pay.UK',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['Payments', 'Fintech', 'Banking', 'Financial Market Infrastructure']
    })
  })

  console.log(`[cheerio] Pay.UK: found ${items.length} items`)
  return items
}

/**
 * OFAC Sanctions Updates
 */
async function scrapeOFAC() {
  const baseUrl = 'https://ofac.treasury.gov'
  const url = `${baseUrl}/recent-actions`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .views-row, .card, li, tr').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'OFAC',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'Sanctions',
      sectors: ['Sanctions', 'AML & Financial Crime', 'Banking', 'Compliance']
    })
  })

  console.log(`[cheerio] OFAC: found ${items.length} items`)
  return items
}

// ============================================
// MIDDLE EAST
// ============================================

/**
 * DFSA Announcements (Dubai)
 */
async function scrapeDFSA() {
  const baseUrl = 'https://www.dfsa.ae'
  const url = `${baseUrl}/news`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .card, .views-row, li').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime], .news-date').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'DFSA',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['Banking', 'Capital Markets', 'Insurance', 'AML & Financial Crime']
    })
  })

  console.log(`[cheerio] DFSA: found ${items.length} items`)
  return items
}

/**
 * CBUAE News (Central Bank of UAE)
 */
async function scrapeCBUAE() {
  const baseUrl = 'https://www.centralbank.ae'
  const url = `${baseUrl}/en/news-and-publications/news-and-insights/`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .card, li, .item').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'CBUAE',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['Banking', 'AML & Financial Crime', 'Payment Services', 'Licensing']
    })
  })

  console.log(`[cheerio] CBUAE: found ${items.length} items`)
  return items
}

/**
 * SAMA News (Saudi Arabia)
 */
async function scrapeSAMA() {
  const baseUrl = 'https://www.sama.gov.sa'
  const url = `${baseUrl}/en-US/News/Pages/AllNews.aspx`

  const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
  const $ = cheerio.load(response.data)
  const items = []
  const seen = new Set()

  $('article, .news-item, .card, li, tr, .ms-vb2').each((i, el) => {
    if (items.length >= 20) return false

    const linkEl = $(el).find('a[href]').first()
    let href = linkEl.attr('href')
    if (!href) return
    href = resolveUrl(href, baseUrl)
    if (!href || seen.has(href)) return

    const title = $(el).find('h2, h3, h4, .title').first().text().trim() || linkEl.text().trim()
    if (!title || title.length < 10) return

    const dateEl = $(el).find('time, .date, [datetime]').first()
    const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

    seen.add(href)
    items.push({
      title: title.replace(/\s+/g, ' '),
      url: href,
      authority: 'SAMA',
      publishedDate: parseDate(dateText),
      summary: title,
      area: 'News',
      sectors: ['Banking', 'Insurance', 'AML & Financial Crime', 'Payment Services']
    })
  })

  console.log(`[cheerio] SAMA: found ${items.length} items`)
  return items
}

module.exports = {
  // Batch A — UK Core
  scrapeFCAConsultationPapers,
  scrapeFCADiscussionPapers,
  scrapeFCADearCeo,
  scrapePRASupervisory,
  scrapeFSCS,
  scrapeOfcom,
  // Batch C — US/Americas
  scrapeCFTC,
  scrapeCNBV,
  // Batch D — Asia-Pacific
  scrapeAPRA,
  scrapeAUSTRAC,
  scrapeRBI,
  scrapeCIMA,
  scrapeCBE,
  // Batch E — Africa + Others
  scrapeFSCA,
  scrapeFICSA,
  scrapeWolfsberg,
  scrapeEgmont,
  scrapeNCA,
  // Batch F — Special
  scrapeLSE,
  scrapeAquis,
  scrapePayUK,
  scrapeOFAC,
  // Middle East
  scrapeDFSA,
  scrapeCBUAE,
  scrapeSAMA
}
