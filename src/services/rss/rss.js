function applyRssMethods(ServiceClass, { axios, cheerio }) {
  ServiceClass.prototype.fetchRSSFeed = async function fetchRSSFeed(source) {
    try {
      const response = await axios.get(source.url, {
        timeout: this.fetchTimeout || 15000,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*'
        }
      })

      const $ = cheerio.load(response.data, { xmlMode: true })
      const updates = []
      const items = $('item, entry')

      items.each((index, element) => {
        try {
          if (index >= 20) return false

          const $item = $(element)
          const title = $item.find('title').text().trim()
          const link = $item.find('link').text().trim() ||
            $item.find('link').attr('href') ||
            $item.find('id').text().trim()

          const description = $item.find('description, summary, content').text().trim()
          const pubDate = $item.find('pubDate, published, updated').text().trim()

          const categories = []
          $item.find('category').each((i, cat) => {
            const catText = $(cat).text().trim() || $(cat).attr('term')
            if (catText) categories.push(catText)
          })

          if (title && link) {
            if (source.titlePrefix) {
              const prefixes = Array.isArray(source.titlePrefix)
                ? source.titlePrefix
                : [source.titlePrefix]
              const normalizedTitle = title.toLowerCase()
              const matchesPrefix = prefixes.some(prefix =>
                normalizedTitle.startsWith(String(prefix).toLowerCase())
              )
              if (!matchesPrefix) return
            }

            const parsedDate = this.parseDate(pubDate)

            if (this.isRecent(parsedDate, source.recencyDays || 30)) {
              updates.push({
                headline: this.cleanText(title),
                summary: this.cleanText(description),
                url: this.normalizeUrl(link, source.url),
                authority: source.authority,
                publishedDate: parsedDate,
                source: source.name,
                feedType: 'rss',
                categories,
                sectors: source.sectors || []
              })
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error parsing RSS item from ${source.name}:`, error.message)
        }
      })

      return updates
    } catch (error) {
      console.error(`❌ RSS fetch failed for ${source.name}:`, error.message)
      throw error
    }
  }
}

module.exports = applyRssMethods
