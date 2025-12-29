const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Ofcom ───────── */
async function scrapeOfcom() {
  const results = []
  const maxPages = 3
  const base = 'https://www.ofcom.org.uk'

  try {
    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1
        ? 'https://www.ofcom.org.uk/news-and-updates'
        : `https://www.ofcom.org.uk/news-and-updates?page=${page}`

      console.log(`   Ofcom: Fetching page ${page}...`)

      try {
        const $ = await fetchHtml(url)

        // Ofcom uses anchor tags containing h3 for article titles
        // Pattern: <a href="..."><img/><h3>Title</h3><p>Published: date</p><p>Category</p></a>
        $('a').each((i, el) => {
          const $el = $(el)
          const h3 = $el.find('h3')

          if (h3.length === 0) return

          const title = cleanText(h3.text())
          if (!title || title.length < 15) return

          // Get href
          let href = $el.attr('href') || ''
          if (!href) return
          if (!href.startsWith('http')) {
            href = `${base}${href}`
          }

          // Skip navigation and non-content links
          if (href.includes('/about-ofcom') ||
              href.includes('/sitemap') ||
              href.includes('/accessibility') ||
              href.includes('/contact') ||
              href.endsWith('/news-and-updates') ||
              href.endsWith('/news-and-updates/')) {
            return
          }

          // Find date - Ofcom uses "Published: DD Month YYYY" format in a p tag
          let dateText = ''
          const fullText = $el.text()
          const publishedMatch = fullText.match(/Published:\s*(\d{1,2}\s+\w+\s+\d{4})/i)
          if (publishedMatch) {
            dateText = publishedMatch[1]
          }

          const date = parseDate(dateText)

          // Find category/summary from other p tags
          let summary = ''
          $el.find('p').each((j, pEl) => {
            const pText = cleanText($(pEl).text())
            if (!pText.includes('Published:') && pText.length > 5 && pText.length < 100) {
              summary = pText
            }
          })
          summary = summary || `Ofcom: ${title}`

          if (href && isRecent(date, 60)) {
            results.push({
              title,
              link: href,
              pubDate: date ? date.toISOString() : new Date().toISOString(),
              authority: 'OFCOM',
              summary
            })
          }
        })

        if (results.length >= 20) break

        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (pageError) {
        console.warn(`Ofcom page ${page} error:`, pageError.message)
        break
      }
    }

    console.log(`✅ Ofcom: Found ${results.length} items`)
    return results.slice(0, 15)
  } catch (error) {
    console.error('Ofcom error:', error.message)
    return []
  }
}

module.exports = { scrapeOfcom }
