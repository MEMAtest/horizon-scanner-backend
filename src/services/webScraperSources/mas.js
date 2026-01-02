const { axios, parseDate, isRecent, cleanText } = require('./utils')

/* ───────── MAS Singapore ───────── */
async function scrapeMAS() {
  const results = []
  const baseUrl = 'https://www.mas.gov.sg'
  const apiUrl = `${baseUrl}/api/v1/search?content_type=Media%20Releases&sort=date&dir=desc&rows=20&start=0&wt=json`

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json'
      },
      timeout: 20000
    })

    const payload = response.data
    if (typeof payload === 'string') {
      if (payload.includes('Maintenance') || payload.includes('Back to Home')) {
        console.log('⚠️ MAS Singapore site is in maintenance mode')
      } else {
        console.log('⚠️ MAS Singapore returned non-JSON response')
      }
      return []
    }

    const docs = payload?.response?.docs || payload?.docs || payload?.items || []

    docs.forEach((doc) => {
      const title = cleanText(doc.title || doc.name || '')
      let link = doc.url || doc.link || doc.path || ''
      if (!title || !link) return

      if (!link.startsWith('http')) {
        link = new URL(link, baseUrl).href
      }

      const dateText = doc.date || doc.publishedDate || doc.createdDate || doc.last_modified || doc.lastModified
      const parsedDate = parseDate(dateText)
      const summary = cleanText(doc.summary || doc.description || doc.teaser || '') || `MAS: ${title}`

      if (isRecent(parsedDate, 120) || !parsedDate) {
        results.push({
          title,
          link,
          pubDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
          authority: 'MAS',
          summary,
          country: 'Singapore',
          region: 'Asia-Pacific',
          sectors: ['Banking', 'Insurance', 'Capital Markets', 'Payment Services', 'Fintech']
        })
      }
    })

    console.log(`✅ MAS Singapore: scraped ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    if (error.response?.status === 503 || error.code === 'ECONNREFUSED') {
      console.log('⚠️ MAS Singapore site is unavailable (maintenance or offline)')
    } else {
      console.error('MAS scraper error:', error.message)
    }
    return []
  }
}

module.exports = { scrapeMAS }
