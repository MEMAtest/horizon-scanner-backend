const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── The Pensions Regulator (TPR) ───────── */
async function scrapePensionRegulator() {
  const listingUrl = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases'
  const base = 'https://www.thepensionsregulator.gov.uk'

  const extractSummary = async (url) => {
    try {
      const $ = await fetchHtml(url)
      let summary = ''

      // Try multiple selectors for summary extraction
      const summarySelectors = [
        'article.left-column p',
        '.govuk-body-l',
        '.govuk-body',
        'main p',
        '.content p'
      ]

      for (const sel of summarySelectors) {
        if (summary) break
        $(sel).each((_, el) => {
          if (summary) return
          const text = cleanText($(el).text())
          if (!text || text.length < 30) return
          if (/browser|javascript|cookies|page not useful|skip to|menu|navigation/i.test(text)) return
          summary = text
        })
      }

      return summary
    } catch (error) {
      console.warn('TPR summary fetch failed:', error.message)
      return ''
    }
  }

  try {
    const $ = await fetchHtml(listingUrl)
    const candidates = []

    // Updated selector: TPR now uses .tpr-mediahub-item structure
    // With dt containing the link and .item-date-time span containing the date
    $('.tpr-mediahub-item').each((_, el) => {
      const $el = $(el)
      const anchor = $el.find('dt a.govuk-link').first()
      const title = cleanText(anchor.text())
      if (!title || title.length < 10) return

      let href = anchor.attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      // Date is in .item-date-time span
      const dateText = cleanText($el.find('.item-date-time span').text())
      const date = parseDate(dateText)
      if (!href) return

      candidates.push({ title, href, date })
    })

    // Fallback to old selectors if new ones don't work
    if (candidates.length === 0) {
      $('.newsLanding .newsitem, .news-item, article.press-release').each((_, el) => {
        const $el = $(el)
        const anchor = $el.find('a').first()
        const title = cleanText(anchor.text())
        if (!title || title.length < 10) return

        let href = anchor.attr('href') || ''
        if (href && !href.startsWith('http')) {
          href = `${base}${href}`
        }

        const dateText = cleanText($el.find('.calendar, .date, time').text())
        const date = parseDate(dateText)
        if (!href) return

        candidates.push({ title, href, date })
      })
    }

    // Filter by recency
    const recentCandidates = candidates.filter(c => isRecent(c.date, 90))

    const enriched = []
    for (const item of recentCandidates.slice(0, 15)) {
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

    if (results.length === 0) {
      console.warn('TPR scraper: No items found with current selectors')
    }

    return results.slice(0, 6)
  } catch (error) {
    console.error('TPR error:', error.message)
    return []
  }
}

module.exports = { scrapePensionRegulator }
