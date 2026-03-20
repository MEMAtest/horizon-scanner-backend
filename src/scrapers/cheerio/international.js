/**
 * Cheerio-based International Regulatory Scrapers
 *
 * Batch B: FATF, JMLSG, EIOPA, IOSCO, BCBS, EU Council
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

/**
 * FATF News & Publications
 * Selectors: .cmp-contentfragmentlist__item, a[href*="/publications/"]
 */
async function scrapeFATFCheerio() {
  const baseUrl = 'https://www.fatf-gafi.org'
  const url = `${baseUrl}/en/the-fatf/news.html`

  try {
    const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
    const $ = cheerio.load(response.data)
    const items = []
    const seen = new Set()

    // FATF uses content fragment list items
    $('.cmp-contentfragmentlist__item, article, .news-item, .card, li').each((i, el) => {
      if (items.length >= 20) return false

      const linkEl = $(el).find('a[href]').first()
      let href = linkEl.attr('href')
      if (!href) return
      href = resolveUrl(href, baseUrl)
      if (!href || seen.has(href)) return

      const title = $(el).find('h2, h3, h4, .title, .sub_heading').first().text().trim() || linkEl.text().trim()
      if (!title || title.length < 10) return

      // FATF uses p.date for dates
      const dateEl = $(el).find('p.date, time, .date, [datetime]').first()
      const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

      const descEl = $(el).find('p:not(.date)').first()
      const description = descEl.text().trim().substring(0, 300)

      seen.add(href)
      items.push({
        title: title.replace(/\s+/g, ' '),
        url: href,
        authority: 'FATF',
        publishedDate: parseDate(dateText),
        summary: description || title,
        area: 'News',
        sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
      })
    })

    // Fallback: search for publication links
    if (items.length < 3) {
      $('a[href*="/publications/"]').each((i, el) => {
        if (items.length >= 20) return false

        let href = $(el).attr('href')
        if (!href) return
        href = resolveUrl(href, baseUrl)
        if (!href || seen.has(href)) return
        if (href.endsWith('/publications/') || href.endsWith('/publications')) return

        const title = $(el).text().trim()
        if (!title || title.length < 10) return

        seen.add(href)
        items.push({
          title: title.replace(/\s+/g, ' '),
          url: href,
          authority: 'FATF',
          publishedDate: null,
          summary: title,
          area: 'Publication',
          sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
        })
      })
    }

    console.log(`[cheerio] FATF: found ${items.length} items`)
    return items
  } catch (error) {
    console.error(`[cheerio] FATF failed:`, error.message)
    return []
  }
}

/**
 * JMLSG News
 * Selectors: .news-item, article with h2/h3 links
 */
async function scrapeJMLSGCheerio() {
  const baseUrl = 'https://www.jmlsg.org.uk'
  const url = `${baseUrl}/latest-news/`

  try {
    const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
    const $ = cheerio.load(response.data)
    const items = []
    const seen = new Set()

    $('.news-item, article, .post, .card, li').each((i, el) => {
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
        authority: 'JMLSG',
        publishedDate: parseDate(dateText),
        summary: title,
        area: 'News',
        sectors: ['AML & Financial Crime', 'Banking', 'Compliance']
      })
    })

    console.log(`[cheerio] JMLSG: found ${items.length} items`)
    return items
  } catch (error) {
    console.error(`[cheerio] JMLSG failed:`, error.message)
    return []
  }
}

/**
 * EIOPA News
 * Selectors: article with .ecl-content-item__title a, .ecl-content-item__date
 */
async function scrapeEIOPACheerio() {
  const baseUrl = 'https://www.eiopa.europa.eu'
  const url = `${baseUrl}/media/news_en`

  try {
    const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
    const $ = cheerio.load(response.data)
    const items = []
    const seen = new Set()

    $('article, .ecl-content-item, .views-row, .card, li').each((i, el) => {
      if (items.length >= 20) return false

      const linkEl = $(el).find('.ecl-content-item__title a, h2 a, h3 a, a[href]').first()
      let href = linkEl.attr('href')
      if (!href) return
      href = resolveUrl(href, baseUrl)
      if (!href || seen.has(href)) return

      const title = linkEl.text().trim() || $(el).find('h2, h3, .title').first().text().trim()
      if (!title || title.length < 10) return

      const dateEl = $(el).find('.ecl-content-item__date, time, .date, [datetime]').first()
      const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

      seen.add(href)
      items.push({
        title: title.replace(/\s+/g, ' '),
        url: href,
        authority: 'EIOPA',
        publishedDate: parseDate(dateText),
        summary: title,
        area: 'News',
        sectors: ['Insurance', 'Pension Funds', 'Consumer Protection']
      })
    })

    console.log(`[cheerio] EIOPA: found ${items.length} items`)
    return items
  } catch (error) {
    console.error(`[cheerio] EIOPA failed:`, error.message)
    return []
  }
}

/**
 * IOSCO Media Releases
 * Selectors: .card-body with .sub_heading, p.card-text-heading a
 */
async function scrapeIOSCOCheerio() {
  const baseUrl = 'https://www.iosco.org'

  try {
    const response = await axios.get(baseUrl, { timeout: 20000, headers: HEADERS })
    const $ = cheerio.load(response.data)
    const items = []
    const seen = new Set()

    // IOSCO uses card-body layout
    $('.card-body, article, .news-item, .media-release').each((i, el) => {
      if (items.length >= 20) return false

      const linkEl = $(el).find('p.card-text-heading a, .sub_heading a, h2 a, h3 a, a[href]').first()
      let href = linkEl.attr('href')
      if (!href) return
      href = resolveUrl(href, baseUrl)
      if (!href || seen.has(href)) return

      const title = $(el).find('.sub_heading, h2, h3, .title').first().text().trim() || linkEl.text().trim()
      if (!title || title.length < 10) return

      const dateEl = $(el).find('.date, time, [datetime], p.card-text').first()
      let dateText = dateEl.attr('datetime') || ''
      if (!dateText) {
        const text = dateEl.text().trim()
        if (/\d{1,2}\s+\w+\s+\d{4}/.test(text) || /\w+\s+\d{1,2},?\s+\d{4}/.test(text)) {
          dateText = text
        }
      }

      seen.add(href)
      items.push({
        title: title.replace(/\s+/g, ' '),
        url: href,
        authority: 'IOSCO',
        publishedDate: parseDate(dateText),
        summary: title,
        area: 'Media Release',
        sectors: ['Capital Markets', 'Securities Regulation', 'Investment Management']
      })
    })

    // Fallback: look for media release links
    if (items.length < 3) {
      $('a[href*="media-release"], a[href*="news"]').each((i, el) => {
        if (items.length >= 20) return false

        let href = $(el).attr('href')
        if (!href) return
        href = resolveUrl(href, baseUrl)
        if (!href || seen.has(href)) return

        const title = $(el).text().trim()
        if (!title || title.length < 10) return

        seen.add(href)
        items.push({
          title: title.replace(/\s+/g, ' '),
          url: href,
          authority: 'IOSCO',
          publishedDate: null,
          summary: title,
          area: 'Media Release',
          sectors: ['Capital Markets', 'Securities Regulation', 'Investment Management']
        })
      })
    }

    console.log(`[cheerio] IOSCO: found ${items.length} items`)
    return items
  } catch (error) {
    console.error(`[cheerio] IOSCO failed:`, error.message)
    return []
  }
}

/**
 * BCBS Publications
 * Table-based: table tbody tr with td cells
 * Already type: 'web_scraping' in config but uses generic parser — provide dedicated one
 */
async function scrapeBCBSCheerio() {
  const baseUrl = 'https://www.bis.org'
  const url = `${baseUrl}/bcbs/publications.htm`

  try {
    const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
    const $ = cheerio.load(response.data)
    const items = []
    const seen = new Set()

    // BCBS uses table layout
    $('table tbody tr').each((i, el) => {
      if (items.length >= 20) return false

      const linkEl = $(el).find('a[href]').first()
      let href = linkEl.attr('href')
      if (!href) return
      href = resolveUrl(href, baseUrl)
      if (!href || seen.has(href)) return

      const title = linkEl.text().trim()
      if (!title || title.length < 10) return

      // Date is typically in the first or last td
      const cells = $(el).find('td')
      let dateText = ''
      cells.each((_, td) => {
        const text = $(td).text().trim()
        if (/\d{2}\s+\w+\s+\d{4}/.test(text) || /\w+\s+\d{4}/.test(text)) {
          dateText = text
          return false
        }
      })

      seen.add(href)
      items.push({
        title: title.replace(/\s+/g, ' '),
        url: href,
        authority: 'BCBS',
        publishedDate: parseDate(dateText),
        summary: title,
        area: 'Publication',
        sectors: ['Banking', 'Capital Requirements', 'Prudential Regulation']
      })
    })

    // Fallback: non-table layout
    if (items.length < 3) {
      $('article, .publication-item, .views-row, li').each((i, el) => {
        if (items.length >= 20) return false

        const linkEl = $(el).find('a[href]').first()
        let href = linkEl.attr('href')
        if (!href) return
        href = resolveUrl(href, baseUrl)
        if (!href || seen.has(href)) return

        const title = $(el).find('h2, h3, .title').first().text().trim() || linkEl.text().trim()
        if (!title || title.length < 10) return

        seen.add(href)
        items.push({
          title: title.replace(/\s+/g, ' '),
          url: href,
          authority: 'BCBS',
          publishedDate: null,
          summary: title,
          area: 'Publication',
          sectors: ['Banking', 'Capital Requirements', 'Prudential Regulation']
        })
      })
    }

    console.log(`[cheerio] BCBS: found ${items.length} items`)
    return items
  } catch (error) {
    console.error(`[cheerio] BCBS failed:`, error.message)
    return []
  }
}

/**
 * EU Council Press Releases
 * Selectors: article, .news-item with h2/h3 links
 */
async function scrapeEUCouncilCheerio() {
  const baseUrl = 'https://www.consilium.europa.eu'
  const url = `${baseUrl}/en/press/press-releases/`

  try {
    const response = await axios.get(url, { timeout: 20000, headers: HEADERS })
    const $ = cheerio.load(response.data)
    const items = []
    const seen = new Set()

    $('article, .news-item, .card, .listing-item, li').each((i, el) => {
      if (items.length >= 20) return false

      const linkEl = $(el).find('h2 a, h3 a, a[href*="/press/press-releases/"]').first()
      let href = linkEl.attr('href')
      if (!href) return
      href = resolveUrl(href, baseUrl)
      if (!href || seen.has(href)) return
      // Skip index pages
      if (href.endsWith('/press-releases/') || href.endsWith('/press-releases')) return

      const title = linkEl.text().trim() || $(el).find('h2, h3, .title').first().text().trim()
      if (!title || title.length < 10) return

      const dateEl = $(el).find('time, .date, [datetime]').first()
      const dateText = dateEl.attr('datetime') || dateEl.text().trim() || ''

      seen.add(href)
      items.push({
        title: title.replace(/\s+/g, ' '),
        url: href,
        authority: 'EU_COUNCIL',
        publishedDate: parseDate(dateText),
        summary: title,
        area: 'Press Release',
        sectors: ['Sanctions', 'AML & Financial Crime', 'Compliance']
      })
    })

    console.log(`[cheerio] EU Council: found ${items.length} items`)
    return items
  } catch (error) {
    console.error(`[cheerio] EU Council failed:`, error.message)
    return []
  }
}

module.exports = {
  scrapeFATFCheerio,
  scrapeJMLSGCheerio,
  scrapeEIOPACheerio,
  scrapeIOSCOCheerio,
  scrapeBCBSCheerio,
  scrapeEUCouncilCheerio
}
