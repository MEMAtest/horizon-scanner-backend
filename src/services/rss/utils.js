function applyUtilityMethods(ServiceClass) {
  ServiceClass.prototype.cleanText = function cleanText(text) {
    if (!text) return ''

    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim()
      .substring(0, 1000)
  }

  ServiceClass.prototype.normalizeUrl = function normalizeUrl(url, baseUrl) {
    if (!url) return ''

    try {
      if (url.startsWith('/')) {
        const base = new URL(baseUrl)
        return `${base.protocol}//${base.host}${url}`
      }

      if (!url.startsWith('http')) {
        return `https://${url}`
      }

      return url
    } catch (error) {
      console.warn(`⚠️ Failed to normalize URL: ${url}`)
      return url
    }
  }

  ServiceClass.prototype.parseDate = function parseDate(dateString) {
    if (!dateString) return new Date()

    try {
      const cleanDate = dateString
        .replace(/\s+/g, ' ')
        .replace(/(\d+)(st|nd|rd|th)/, '$1')
        .trim()

      const parsedDate = new Date(cleanDate)

      if (isNaN(parsedDate.getTime()) || parsedDate > new Date(Date.now() + 24 * 60 * 60 * 1000)) {
        return new Date()
      }

      return parsedDate
    } catch (error) {
      console.warn(`⚠️ Failed to parse date: ${dateString}`)
      return new Date()
    }
  }

  ServiceClass.prototype.isRecent = function isRecent(date, maxDays = 7) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return false
    }

    const cutoffDate = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000)
    return date >= cutoffDate
  }

  ServiceClass.prototype.delay = async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = applyUtilityMethods
