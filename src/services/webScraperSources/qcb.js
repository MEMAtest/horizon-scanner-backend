const { axios, USER_AGENT, parseDate, isRecent, cleanText } = require('./utils')

/* ───────── Qatar Central Bank (QCB) ───────── */
async function scrapeQCB() {
  const results = []
  const baseUrl = 'https://www.qcb.gov.qa'
  const apiUrl = `${baseUrl}/en/news/_api/web/lists/getbytitle('Pages')/items` +
    '?$select=Title,File/ServerRelativeUrl,ArticleStartDate,Modified' +
    '&$expand=File&$orderby=ArticleStartDate desc&$top=20'

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json;odata=verbose'
      },
      timeout: 20000
    })

    const items = response.data?.d?.results || []

    items.forEach((item) => {
      const title = cleanText(item.Title || '')
      const relativeUrl = item.File?.ServerRelativeUrl || ''
      if (!title || !relativeUrl) return

      const link = new URL(relativeUrl, baseUrl).href
      const dateText = item.ArticleStartDate || item.Modified
      const parsedDate = parseDate(dateText)

      if (isRecent(parsedDate, 120) || !parsedDate) {
        results.push({
          title,
          link,
          pubDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
          authority: 'QCB',
          summary: `QCB: ${title}`,
          country: 'Qatar',
          region: 'Middle East',
          sectors: ['Banking', 'AML & Financial Crime', 'Financial Stability']
        })
      }
    })

    console.log(`✅ QCB: scraped ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    console.error('QCB scraper error:', error.message)
    return []
  }
}

module.exports = { scrapeQCB }
