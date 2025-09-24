// src/services/webScraper.js
// COMPLETE REPLACEMENT - All scrapers with proper summary extraction

const axios = require('axios')
const cheerio = require('cheerio')
const Parser = require('rss-parser')
const rss = new Parser()

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/* ───────── Helper Functions ───────── */
const parseDate = (s) => {
  const d = new Date(s)
  return isNaN(d) ? null : d
}

const isRecent = (d, days = 30) => {
  return d && d >= new Date(Date.now() - days * 864e5)
}

const fetchHtml = async (url) => {
  return axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000
  }).then(r => cheerio.load(r.data))
}

const cleanText = (text = '') => text.replace(/\s+/g, ' ').trim()

const stripListPrefixes = (text = '') => text.replace(/^(\d+\.\d+|\d+|[•\-*])\s+/, '').trim()

async function fetchBoeListing({ newsTypes, pageSize = 20 }) {
  const endpoint = 'https://www.bankofengland.co.uk/_api/News/RefreshPagedNewsList'
  const payload = {
    SearchTerm: '',
    Id: '{CE377CC8-BFBC-418B-B4D9-DBC1C64774A8}',
    PageSize: pageSize,
    NewsTypes: newsTypes,
    NewsTypesAvailable: newsTypes,
    Taxonomies: [],
    TaxonomiesAvailable: [],
    Page: 1,
    Direction: 1,
    DateFrom: null,
    DateTo: null,
    Grid: false,
    InfiniteScrolling: false
  }

  const { data } = await axios.post(endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT
    },
    timeout: 10000
  })

  return data?.Results || ''
}

const extractBoeSummary = async (url) => {
  try {
    const $ = await fetchHtml(url)
    let summary = ''

    $('.page-section .page-content p').each((_, el) => {
      if (summary) return
      const text = stripListPrefixes(cleanText($(el).text()))
      if (!text || /privacy statement/i.test(text) || text.length < 60) return
      summary = text
    })

    return summary
  } catch (error) {
    console.warn('BoE summary fetch failed:', error.message)
    return ''
  }
}

const extractPraSummary = async (url) => {
  try {
    const $ = await fetchHtml(url)
    let summary = ''

    $('section[data-section]').each((_, section) => {
      if (summary) return false
      const heading = cleanText($(section).find('h2').first().text())
      if (/privacy/i.test(heading)) return

      $(section).find('p').each((__, el) => {
        const text = stripListPrefixes(cleanText($(el).text()))
        if (text.length < 60) return
        summary = text
        return false
      })

      if (summary) return false
    })

    return summary || await extractBoeSummary(url)
  } catch (error) {
    console.warn('PRA summary fetch failed:', error.message)
    return ''
  }
}

/* ───────── Authority Normalization ───────── */
const normalizeAuthority = (authority) => {
  const mapping = {
    'Bank of England': 'BoE',
    'Bank of England (BoE)': 'BoE',
    'Prudential Regulation Authority (PRA)': 'PRA',
    'Prudential Regulation Authority': 'PRA',
    'European Banking Authority (EBA)': 'EBA',
    'European Banking Authority': 'EBA',
    'EBA (European Banking Authority)': 'EBA',
    'The Pensions Regulator': 'TPR',
    'Serious Fraud Office': 'SFO',
    'Information Commissioner\'s Office': 'ICO',
    'Information Commissioner Office': 'ICO',
    'Financial Reporting Council': 'FRC',
    'Financial Ombudsman Service': 'FOS',
    'Financial Action Task Force': 'FATF',
    'HM Treasury, Office of Financial Sanctions Implementation': 'HM Treasury'
  }
  return mapping[authority] || authority
}

/* ───────── The Pensions Regulator (TPR) ───────── */
async function scrapePensionRegulator() {
  const listingUrl = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases'
  const base = 'https://www.thepensionsregulator.gov.uk'

  const extractSummary = async (url) => {
    try {
      const $ = await fetchHtml(url)
      let summary = ''

      $('article.left-column p').each((_, el) => {
        if (summary) return
        const text = cleanText($(el).text())
        if (!text) return
        if (/browser|javascript|cookies|page not useful/i.test(text)) return
        summary = text
      })

      return summary
    } catch (error) {
      console.warn('TPR summary fetch failed:', error.message)
      return ''
    }
  }

  try {
    const $ = await fetchHtml(listingUrl)
    const candidates = []

    $('.newsLanding .newsitem').each((_, el) => {
      const $el = $(el)
      const anchor = $el.find('a').first()
      const title = cleanText(anchor.text())
      if (!title) return

      let href = anchor.attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      const dateText = cleanText($el.find('.calendar').text())
      const date = parseDate(dateText)
      if (!href || !isRecent(date, 31)) return

      candidates.push({ title, href, date })
    })

    const enriched = []
    for (const item of candidates.slice(0, 15)) {
      let summary = await extractSummary(item.href)
      if (!summary) summary = `TPR update: ${item.title}`

      enriched.push({ ...item, summary })
    }

    const build = (windowDays) => {
      return enriched
        .filter(entry => isRecent(entry.date, windowDays))
        .map(entry => ({
          title: entry.title,
          link: entry.href,
          pubDate: entry.date ? entry.date.toISOString() : new Date().toISOString(),
          authority: normalizeAuthority('The Pensions Regulator'),
          summary: entry.summary
        }))
    }

    let results = build(31)
    if (results.length < 3) {
      results = build(90)
    }

    return results.slice(0, 6)
  } catch (error) {
    console.error('TPR error:', error.message)
    return []
  }
}

/* ───────── Serious Fraud Office (SFO) ───────── */
async function scrapeSFO() {
  // Try GOV.UK Atom feed first
  const FEED = 'https://www.gov.uk/government/organisations/serious-fraud-office.atom'
  try {
    const feed = await rss.parseURL(FEED)
    const recent = feed.items.filter(i => isRecent(parseDate(i.pubDate)))

    if (recent.length) {
      return recent.map(i => ({
        title: i.title,
        link: i.link,
        pubDate: i.pubDate,
        authority: normalizeAuthority('Serious Fraud Office'),
        summary: i.contentSnippet || i.content || `SFO: ${i.title}`
      }))
    }
  } catch (_) {
    /* fall through to HTML */
  }

  // HTML fallback - GOV.UK search results
  try {
    const base = 'https://www.gov.uk/search/all?organisations[]=serious-fraud-office&order=updated-newest'
    const $ = await fetchHtml(base)
    const out = []

    $('.gem-c-document-list__item').each((_, el) => {
      const $el = $(el)
      const a = $el.find('a').first()
      const title = cleanText(a.text())
      const href = a.attr('href')
      const summary = cleanText($el.find('.gem-c-document-list__item-description').text()) ||
                           `SFO: ${title}`
      const date = parseDate($el.find('time').attr('datetime'))

      if (title && href && isRecent(date)) {
        out.push({
          title,
          link: new URL(href, 'https://www.gov.uk').href,
          pubDate: date ? date.toISOString() : new Date().toISOString(),
          authority: normalizeAuthority('Serious Fraud Office'),
          summary
        })
      }
    })

    return out
  } catch (e) {
    console.error('SFO error:', e.message)
    return []
  }
}

/* ───────── Information Commissioner's Office (ICO) ───────── */
async function scrapeICO() {
  const endpoint = 'https://ico.org.uk/api/search'
  const base = 'https://ico.org.uk'

  const extractSummary = async (url) => {
    try {
      const $ = await fetchHtml(url)
      let summary = ''

      $('.rich-text p').each((_, el) => {
        if (summary) return
        const text = cleanText($(el).text())
        if (text.length < 40) return
        summary = text
      })

      return summary
    } catch (error) {
      console.warn('ICO summary fetch failed:', error.message)
      return ''
    }
  }

  try {
    const payload = {
      filters: [
        { key: 'entype', values: ['news', 'blog', 'speech', 'statement'] }
      ],
      pageNumber: 1,
      order: 'newest',
      rootPageId: 2816
    }

    const { data } = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT
      },
      timeout: 10000
    })

    const items = data?.results || []
    const fresh = []
    const older = []

    for (const item of items) {
      const title = cleanText(item.title)
      if (!title) continue

      const link = item.url.startsWith('http') ? item.url : `${base}${item.url}`
      const metaDate = cleanText((item.filterItemMetaData || '').split(',')[0])
      const date = parseDate(metaDate || item.createdDateTime)

      let summary = cleanText(item.description || '')
      if (!summary) {
        summary = await extractSummary(link)
      }
      if (!summary) summary = `ICO update: ${title}`

      const record = {
        title,
        link,
        pubDate: date ? date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('ICO'),
        summary,
        __date: date
      }

      if (isRecent(date)) {
        fresh.push(record)
      } else {
        older.push(record)
      }
    }

    while (fresh.length < 3 && older.length) {
      fresh.push(older.shift())
    }

    return fresh.slice(0, 15).map(({ __date, ...rest }) => rest)
  } catch (error) {
    console.error('ICO error:', error.message)
    return []
  }
}

/* ───────── Financial Reporting Council (FRC) ───────── */
async function scrapeFRC() {
  const listingUrl = 'https://www.frc.org.uk/news-and-events/news/'
  const base = 'https://www.frc.org.uk'

  try {
    const $ = await fetchHtml(listingUrl)
    const out = []

    $('.search__results-item').each((_, el) => {
      const $el = $(el)
      const anchor = $el.find('.search__results-item-title').first()
      const title = cleanText(anchor.text())
      if (!title) return

      let href = anchor.attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      const summary = cleanText($el.find('.search__results-item-description').text()) || `FRC: ${title}`
      const dateText = cleanText($el.find('.search__results-item-metadata').text())
      const date = parseDate(dateText)

      if (!isRecent(date)) return

      out.push({
        title,
        link: href,
        pubDate: date ? date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('FRC'),
        summary
      })
    })

    return out
  } catch (error) {
    console.error('FRC error:', error.message)
    return []
  }
}

/* ───────── Financial Ombudsman Service (FOS) ───────── */
async function scrapeFOS() {
  const listingUrl = 'https://www.financial-ombudsman.org.uk/news'
  const base = 'https://www.financial-ombudsman.org.uk'

  try {
    const $ = await fetchHtml(listingUrl)
    const enriched = []

    $('.card.card-grey').each((_, el) => {
      const $el = $(el)
      const title = cleanText($el.find('.card-title').first().text())
      if (!title) return

      let href = $el.find('a.lnk').attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      const summary = cleanText($el.find('.card-desc > p').not('.card-date').first().text()) || `FOS update: ${title}`
      const dateText = cleanText($el.find('.card-date').text())
      const date = parseDate(dateText)

      const tags = $el.find('.card-tags .tag').map((_, tag) => cleanText($(tag).text())).get().filter(Boolean)
      enriched.push({ title, href, date, summary, tags })
    })

    const build = (windowDays) => enriched
      .filter(entry => isRecent(entry.date, windowDays))
      .map(entry => ({
        title: entry.title,
        link: entry.href,
        pubDate: entry.date ? entry.date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('FOS'),
        summary: entry.summary,
        tags: entry.tags?.length ? entry.tags : undefined
      }))

    let results = build(31)
    if (results.length < 3) {
      results = build(90)
    }

    return results.slice(0, 6)
  } catch (error) {
    console.error('FOS error:', error.message)
    return []
  }
}

/* ───────── Joint Money Laundering Steering Group (JMLSG) - Enhanced with Puppeteer ───────── */
async function scrapeJMLSG() {
  const puppeteer = require('puppeteer')
  let browser

  try {
    console.log('🌍 JMLSG: Starting Puppeteer scraping...')

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    console.log('   📰 Scraping JMLSG news...')
    await page.goto('https://www.jmlsg.org.uk/latest-news/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    const newsItems = await page.evaluate(() => {
      const items = []
      const base = 'https://www.jmlsg.org.uk'

      // Try multiple selectors for JMLSG news items
      const selectors = [
        '.news-item',
        '.post',
        'article',
        '.entry',
        '.content-item',
        '.news-list .item',
        '[class*="news"]',
        'a[href*="/news/"]',
        'a[href*="/latest-news/"]'
      ]

      let elements = []
      for (const selector of selectors) {
        const found = document.querySelectorAll(selector)
        if (found.length > 0) {
          elements = Array.from(found)
          break
        }
      }

      // If no specific elements found, try to find links in main content
      if (elements.length === 0) {
        const mainContent = document.querySelector('main, .main, .content, #content') || document.body
        const links = mainContent.querySelectorAll('a[href]')
        elements = Array.from(links).filter(link => {
          const href = link.href || ''
          const text = link.textContent.trim()
          return (href.includes('/news/') || href.includes('/latest-news/') ||
                           href.includes('/publications/') || text.length > 20) && text.length < 200
        })
      }

      for (const element of elements.slice(0, 10)) {
        let title = ''
        let link = ''
        let dateText = ''
        let summary = ''

        if (element.tagName === 'A') {
          title = element.textContent?.trim() || ''
          link = element.href || ''
        } else {
          const linkEl = element.querySelector('a')
          if (linkEl) {
            title = linkEl.textContent?.trim() || element.textContent?.trim() || ''
            link = linkEl.href || ''
          } else {
            // Try to find title in headings
            const heading = element.querySelector('h1, h2, h3, h4, h5, .title, .headline')
            if (heading) {
              title = heading.textContent?.trim() || ''
            }
          }
        }

        if (!title || title.length < 10) continue

        // Try to find date
        const dateEl = element.querySelector('[class*="date"], time, .published, .pub-date, .meta-date')
        if (dateEl) {
          dateText = dateEl.textContent?.trim() || ''
        }

        // Try to find summary
        const summaryEl = element.querySelector('p, .summary, .description, .excerpt, .intro')
        if (summaryEl) {
          summary = summaryEl.textContent?.trim() || ''
        }

        // Ensure absolute URL
        if (link && !link.startsWith('http')) {
          link = link.startsWith('/') ? `${base}${link}` : `${base}/${link}`
        }

        if (title && link) {
          items.push({
            title,
            link,
            dateText,
            summary: summary || `JMLSG news: ${title.substring(0, 100)}`
          })
        }
      }

      return items
    })

    const results = newsItems.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: parseDate(item.dateText)?.toISOString() || new Date().toISOString(),
      authority: normalizeAuthority('JMLSG'),
      summary: item.summary,
      description: item.summary
    }))

    console.log(`   ✅ JMLSG: Found ${results.length} items via Puppeteer`)
    return results.slice(0, 6)
  } catch (error) {
    console.error('JMLSG Puppeteer scraping failed:', error.message)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/* ───────── FCA (with RSS and HTML fallback) ───────── */
async function scrapeFCA() {
  // Try RSS first
  const FEED = 'https://www.fca.org.uk/news/rss.xml'
  try {
    const feed = await rss.parseURL(FEED)
    const recent = feed.items.filter(i => isRecent(parseDate(i.pubDate)))

    if (recent.length) {
      return recent.map(i => ({
        title: i.title,
        link: i.link,
        pubDate: i.pubDate,
        authority: normalizeAuthority('FCA'),
        summary: i.contentSnippet || i.content || `FCA: ${i.title}`
      }))
    }
  } catch (_) {}

  // HTML fallback
  try {
    const base = 'https://www.fca.org.uk/news'
    const $ = await fetchHtml(base)
    const out = []

    $('.latest-news li, .news-item, article').each((_, el) => {
      const $el = $(el)
      const a = $el.find('a').first()
      const title = a.text().trim()
      let href = a.attr('href') || ''

      if (href && !href.startsWith('http')) {
        href = new URL(href, base).href
      }

      const summary = $el.find('.summary, .excerpt, p').first().text().trim() ||
                           `FCA: ${title}`
      const date = parseDate($el.find('time').attr('datetime') || $el.text())

      if (title && href && isRecent(date)) {
        out.push({
          title,
          link: href,
          pubDate: date ? date.toISOString() : new Date().toISOString(),
          authority: normalizeAuthority('FCA'),
          summary
        })
      }
    })

    return out
  } catch (e) {
    console.error('FCA error:', e.message)
    return []
  }
}

/* ───────── FATF (Enhanced with Puppeteer for 403 bypass) ───────── */
async function scrapeFATF() {
  const puppeteer = require('puppeteer')
  let browser

  try {
    console.log('🌍 FATF: Starting Puppeteer scraping...')

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    console.log('   📰 Scraping FATF news...')
    await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    const newsItems = await page.evaluate(() => {
      const items = []

      // Look for news items in various selectors
      const selectors = [
        'article',
        '.news-item',
        '.publication-item',
        '.content-item',
        'a[href*="/news/"]',
        'a[href*="/publication"]'
      ]

      let elements = []
      for (const selector of selectors) {
        const found = document.querySelectorAll(selector)
        if (found.length > 0) {
          elements = Array.from(found)
          break
        }
      }

      // If no specific elements found, try to find links in the main content
      if (elements.length === 0) {
        const mainContent = document.querySelector('main') || document.body
        const links = mainContent.querySelectorAll('a[href]')
        elements = Array.from(links).filter(link => {
          const href = link.href || ''
          return href.includes('/news/') || href.includes('/publication') ||
                           link.textContent.trim().length > 20
        })
      }

      for (const element of elements.slice(0, 10)) {
        let title = ''
        let link = ''
        let dateText = ''
        let summary = ''

        if (element.tagName === 'A') {
          title = element.textContent?.trim() || ''
          link = element.href || ''
        } else {
          const linkEl = element.querySelector('a')
          if (linkEl) {
            title = linkEl.textContent?.trim() || element.textContent?.trim() || ''
            link = linkEl.href || ''
          }
        }

        // Try to find date
        const dateEl = element.querySelector('[class*="date"], time, .published, .pub-date')
        if (dateEl) {
          dateText = dateEl.textContent?.trim() || ''
        }

        // Try to find summary
        const summaryEl = element.querySelector('p, .summary, .description, .excerpt')
        if (summaryEl) {
          summary = summaryEl.textContent?.trim() || ''
        }

        if (title && link && title.length > 10) {
          items.push({
            title,
            link: link.startsWith('http') ? link : `https://www.fatf-gafi.org${link}`,
            dateText,
            summary: summary || `FATF news: ${title.substring(0, 100)}`
          })
        }
      }

      return items
    })

    const results = newsItems.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: parseDate(item.dateText)?.toISOString() || new Date().toISOString(),
      authority: normalizeAuthority('FATF'),
      summary: item.summary,
      description: item.summary
    }))

    console.log(`   ✅ FATF: Found ${results.length} items via Puppeteer`)
    return results
  } catch (error) {
    console.error('FATF Puppeteer scraping failed:', error.message)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function fatfJson(pages = 2, size = 20, maxDays = 30) {
  const endpoint = 'https://www.fatf-gafi.org/en/publications/_jcr_content.results.json'
  const list = []

  for (let p = 0; p < pages; p++) {
    try {
      const { data } = await axios.get(
                `${endpoint}?page=${p}&size=${size}&sort=Publication%20date%20descending`,
                { timeout: 10000 }
      )

      if (!data?.items?.length) break

      for (const it of data.items) {
        const date = parseDate(it.publicationDate)
        if (!isRecent(date, maxDays)) return list

        // Extract summary from JSON response
        const summary = it.description || it.summary || it.excerpt ||
                              `FATF publication: ${it.title}`

        list.push({
          title: it.title.trim(),
          link: it.detailsPage?.absoluteUrl || it.url ||
                          `https://www.fatf-gafi.org${it.path}`,
          pubDate: date.toISOString(),
          authority: normalizeAuthority('FATF'),
          summary: summary.trim()
        })
      }
    } catch (e) {
      console.error(`FATF JSON page ${p} error:`, e.message)
      break
    }
  }

  return list
}

async function fatfHtml(maxDays = 30) {
  const base = 'https://www.fatf-gafi.org/en/the-fatf/news.html'
  const $ = await fetchHtml(base)
  const out = []

  // Look for news items in various possible containers
  $('.publication-item,.teaser,.news-item,article,tr').each((_, el) => {
    const $el = $(el)
    const a = $el.find('a').first()
    const title = a.text().trim()
    let href = a.attr('href') || ''

    if (href && !href.startsWith('http')) {
      href = new URL(href, 'https://www.fatf-gafi.org').href
    }

    // Try to extract summary from various possible locations
    const summary = $el.find('.summary,.excerpt,.description,p').first().text().trim() ||
                       $el.next('p').text().trim() ||
                       `FATF: ${title}`

    const date = parseDate($el.find('time,.date,td:first-child').text())

    if (title && isRecent(date, maxDays)) {
      out.push({
        title,
        link: href,
        pubDate: date ? date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('FATF'),
        summary
      })
    }
  })

  return out
}

/* ───────── Bank of England / PRA (Replacement for dead RSS) ───────── */
async function scrapeBoE(targetAuthority = 'BoE') {
  const base = 'https://www.bankofengland.co.uk'
  const normalized = normalizeAuthority(targetAuthority)
  const PRA_TYPE = '65d34b0d42784c6bb1dd302c1ed63653'
  const GENERAL_TYPES = [
    'd10a561861b94c2ea06d82cfeda25c57',
    'e170e31a926f48d1a863ad8161ea771c',
    'f995a39ef2b8400d8ae5454926879e22',
    '09f8960ebc384e3589da5349744916ae',
    'ce90163e489841e0b66d06243d35d5cb',
    'f949c64a4c88448b9e269d10080b0987',
    '571948d14c6943f7b5b7748ad80bef29'
  ]

  const newsTypes = normalized === 'PRA' ? [PRA_TYPE] : GENERAL_TYPES

  try {
    const html = await fetchBoeListing({ newsTypes })
    const $ = cheerio.load(html)
    const out = []

    $('.col3 > a.release').each((_, el) => {
      const $el = $(el)
      const title = cleanText($el.find('h3.list').text())
      if (!title) return

      let href = $el.attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      const authority = href.includes('/prudential-regulation/') ? 'PRA' : 'BoE'
      if (normalized === 'PRA' && authority !== 'PRA') return
      if (normalized === 'BoE' && authority !== 'BoE') return

      const date = parseDate($el.find('time').attr('datetime'))

      out.push({
        title,
        link: href,
        date,
        authority: normalizeAuthority(authority)
      })
    })

    const enriched = []
    for (const item of out.slice(0, 25)) {
      const summaryFetcher = item.authority === 'PRA' ? extractPraSummary : extractBoeSummary
      let summary = await summaryFetcher(item.link)
      if (!summary) summary = `${item.authority}: ${item.title}`

      enriched.push({
        ...item,
        summary
      })
    }

    const build = (windowDays) => enriched
      .filter(entry => isRecent(entry.date, windowDays))
      .map(entry => ({
        title: entry.title,
        link: entry.link,
        pubDate: entry.date.toISOString(),
        authority: entry.authority,
        summary: entry.summary
      }))

    let results = build(31)
    if (results.length < 3) {
      results = build(90)
    }

    return results.slice(0, normalized === 'PRA' ? 10 : 20)
  } catch (error) {
    console.error('BoE error:', error.message)
    return []
  }
}

async function scrapePRA() {
  return scrapeBoE('PRA')
}

/* ───────── European Banking Authority (EBA) ───────── */
async function scrapeEBA() {
  const FEED = 'https://www.eba.europa.eu/news-press/news/rss.xml'

  try {
    const feed = await rss.parseURL(FEED)
    const out = []

    for (const item of feed.items || []) {
      const title = cleanText(item.title)
      if (!title) continue

      const link = item.link
      const date = parseDate(item.isoDate || item.pubDate)
      if (!isRecent(date)) continue

      const summary = cleanText(item.contentSnippet || item.content || `EBA: ${title}`)

      out.push({
        title,
        link,
        pubDate: date ? date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('EBA'),
        summary
      })

      if (out.length >= 20) break
    }

    return out
  } catch (error) {
    console.error('EBA error:', error.message)
    return []
  }
}

/* ───────── Exports ───────── */
module.exports = {
  // Core scrapers
  scrapePensionRegulator,
  scrapeSFO,
  scrapeFCA,
  scrapeFATF,
  scrapeICO,
  scrapeFRC,
  scrapeFOS,
  scrapeJMLSG,
  scrapeBoE,
  scrapePRA,
  scrapeEBA,

  // Utility function
  normalizeAuthority
}
