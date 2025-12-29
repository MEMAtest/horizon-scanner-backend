const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Health and Safety Executive (HSE) ───────── */
async function scrapeHSE() {
  const results = []
  const maxPages = 5

  try {
    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1
        ? 'https://press.hse.gov.uk/'
        : `https://press.hse.gov.uk/page/${page}/`

      console.log(`   HSE: Fetching page ${page}...`)

      try {
        const $ = await fetchHtml(url)

        // HSE uses WordPress-style article structure
        $('article, .post, .hentry').each((i, el) => {
          const $el = $(el)

          // Find title
          const titleEl = $el.find('.entry-title a, h2 a, h3 a').first()
          const title = cleanText(titleEl.text())
          if (!title || title.length < 15) return

          // Find link
          let href = titleEl.attr('href') || ''

          // Find date - HSE uses format like "23rd December 2025"
          let dateText = ''
          const dateEl = $el.find('time, .entry-date, .posted-on, [class*="date"]')
          if (dateEl.length) {
            dateText = cleanText(dateEl.text()) || dateEl.attr('datetime') || ''
          }

          // Clean ordinal suffixes from date
          dateText = dateText.replace(/(\d+)(st|nd|rd|th)/gi, '$1')
          const date = parseDate(dateText)

          // Find summary
          const summary = cleanText($el.find('.entry-summary p, .entry-content p, .excerpt').first().text()) || `HSE: ${title}`

          if (href && isRecent(date, 90)) {
            results.push({
              title,
              link: href,
              pubDate: date ? date.toISOString() : new Date().toISOString(),
              authority: 'HSE',
              summary
            })
          }
        })

        // Check if we have enough results
        if (results.length >= 20) break

        // Rate limit between pages
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (pageError) {
        console.warn(`HSE page ${page} error:`, pageError.message)
        break
      }
    }

    console.log(`✅ HSE: Found ${results.length} items`)
    return results.slice(0, 15)
  } catch (error) {
    console.error('HSE error:', error.message)
    return []
  }
}

module.exports = { scrapeHSE }
