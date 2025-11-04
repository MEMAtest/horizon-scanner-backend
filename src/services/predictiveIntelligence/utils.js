const { STOP_WORDS, STAGE_PRIORITY } = require('./constants')

function applyUtilityMethods(ServiceClass) {
  ServiceClass.prototype.startOfDay = function(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  ServiceClass.prototype.startOfWeek = function(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const diff = (day + 6) % 7
    d.setDate(d.getDate() - diff)
    return d
  }

  ServiceClass.prototype.daysBetween = function(a, b) {
    return Math.round((this.startOfDay(a) - this.startOfDay(b)) / (1000 * 60 * 60 * 24))
  }

  ServiceClass.prototype.tokenize = function(text = '') {
    if (!text) return []
    return (text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])
      .filter(word => !STOP_WORDS.has(word))
  }

  ServiceClass.prototype.collectSectors = function(update) {
    const sectors = new Set()
    ;[update.primarySectors, update.primary_sectors, update.firm_types_affected]
      .filter(Boolean)
      .forEach(list => {
        if (Array.isArray(list)) {
          list.forEach(sector => sector && sectors.add(String(sector)))
        }
      })

    if (update.sector) sectors.add(String(update.sector))
    if (update.category) sectors.add(String(update.category))
    if (update.area) sectors.add(String(update.area))
    return Array.from(sectors)
  }

  ServiceClass.prototype.detectStage = function(update) {
    const haystack = [
      update.content_type,
      update.contentType,
      update.category,
      update.ai_summary,
      update.summary,
      update.headline,
      update.keyDates
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (haystack.includes('final rule') || haystack.includes('policy statement') || haystack.includes('final guidance')) {
      return 'final'
    }
    if (haystack.includes('consultation') || haystack.includes('request for comment')) {
      return 'consultation'
    }
    if (haystack.includes('enforcement') || haystack.includes('penalty') || haystack.includes('fine')) {
      return 'enforcement'
    }
    if (haystack.includes('speech') || haystack.includes('remarks') || haystack.includes('roundtable')) {
      return 'informal'
    }
    if (haystack.includes('draft') || haystack.includes('proposal')) {
      return 'proposal'
    }
    return 'update'
  }

  ServiceClass.prototype.getDeadline = function(update) {
    const deadline = update.compliance_deadline || update.complianceDeadline || update.deadline
    if (!deadline) return null
    const parsed = new Date(deadline)
    return isNaN(parsed) ? null : parsed
  }

  ServiceClass.prototype.pickTopEntries = function(map, limit = 3) {
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([entry]) => entry)
  }

  ServiceClass.prototype.pickTopAuthorities = function(stats) {
    return Array.from(stats.authorities.entries())
      .sort(([, a], [, b]) => b.recent - a.recent)
      .slice(0, 3)
      .map(([authority]) => authority)
  }

  ServiceClass.prototype.pickTopUpdate = function(stats) {
    if (!stats || !Array.isArray(stats.mentions) || !stats.mentions.length) return null
    return stats.mentions
      .map(mention => ({
        mention,
        score: STAGE_PRIORITY[(mention.stage || '').toLowerCase()] || 10
      }))
      .sort((a, b) => a.score - b.score)
      .map(entry => entry.mention)[0]
  }

  ServiceClass.prototype.limitWords = function(text, maxWords = 8) {
    const words = text.trim().split(/\s+/)
    if (words.length <= maxWords) return words.join(' ')
    return words.slice(0, maxWords).join(' ')
  }

  ServiceClass.prototype.toTitleCase = function(text) {
    return text
      .split(/\s+/)
      .map(word => {
        if (!word) return word
        if (word === word.toUpperCase()) return word
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }

  ServiceClass.prototype.formatSectorSummary = function(sectors = []) {
    if (!sectors || !sectors.length) return ''
    if (sectors.length === 1) return sectors[0]
    if (sectors.length === 2) return sectors.join(' & ')
    return `${sectors[0]}, ${sectors[1]} & others`
  }

  ServiceClass.prototype.formatAuthorityGroup = function(authorities = []) {
    if (!authorities || !authorities.length) return 'leading regulators'
    if (authorities.length === 1) return authorities[0]
    if (authorities.length === 2) return `${authorities[0]} & ${authorities[1]}`
    return `${authorities[0]}, ${authorities[1]} & others`
  }
}

module.exports = applyUtilityMethods
