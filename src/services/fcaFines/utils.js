function applyUtilityMethods(ServiceClass) {
  ServiceClass.prototype.isFineRelated = function(title, description = '') {
    const text = (title + ' ' + description).toLowerCase()
    const fineKeywords = [
      'fine', 'fined', 'penalty', 'penalised', 'penalized',
      'enforcement', 'breach', 'violation', 'sanctions',
      'disciplinary', 'misconduct', 'censure', 'action against'
    ]

    return fineKeywords.some(keyword => text.includes(keyword))
  }

  ServiceClass.prototype.parseAmount = function(amountText) {
    if (!amountText) return null

    const cleanAmount = amountText.replace(/,/g, '')
    const amount = parseFloat(cleanAmount)

    if (amountText.toLowerCase().includes('million') || amountText.toLowerCase().includes('m')) {
      return amount * 1000000
    }

    return amount
  }

  ServiceClass.prototype.parseDate = function(dateText, fallbackYear) {
    // Use the improved parseDateFromText function instead
    return this.parseDateFromText(dateText, fallbackYear)
  }

  ServiceClass.prototype.extractBreachType = function(text) {
    const lowerText = text.toLowerCase()

    for (const [keyword, breachCode] of this.breachTypeMap) {
      if (lowerText.includes(keyword)) {
        return breachCode
      }
    }

    return 'UNKNOWN'
  }

  ServiceClass.prototype.categorizeFirm = function(firmName, fullText) {
    if (!firmName && !fullText) return 'Unknown'

    const text = (firmName + ' ' + fullText).toLowerCase()

    if (text.includes('bank') || text.includes('banking')) return 'Banking'
    if (text.includes('insurance') || text.includes('insurer')) return 'Insurance'
    if (text.includes('asset management') || text.includes('fund')) return 'Asset Management'
    if (text.includes('broker') || text.includes('trading')) return 'Brokerage'
    if (text.includes('pension') || text.includes('retirement')) return 'Pensions'
    if (text.includes('mortgage') || text.includes('lending')) return 'Lending'
    if (text.includes('adviser') || text.includes('advisor')) return 'Financial Advisory'
    if (text.includes('payment') || text.includes('fintech')) return 'Fintech'

    return 'Other'
  }

  ServiceClass.prototype.extractSummary = function(text, maxLength = 200) {
    if (!text) return ''

    const sentences = text.split(/[.!?]+/)
    const summaryParts = []

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase()
      if (lower.includes('fine') || lower.includes('penalty') || lower.includes('breach')) {
        summaryParts.push(sentence.trim())
        if (summaryParts.join('. ').length > maxLength) break
      }
      if (summaryParts.length >= 2) break
    }

    let summary = summaryParts.join('. ')
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...'
    }

    return summary || text.substring(0, maxLength) + '...'
  }

  ServiceClass.prototype.generateFineReference = function(firmName, date, amount) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const firmCode = firmName ? firmName.substring(0, 3).toUpperCase() : 'UNK'
    const amountCode = amount ? String(Math.floor(amount / 1000)) : '0'

    return `FCA-${year}${month}-${firmCode}-${amountCode}`
  }

  ServiceClass.prototype.parseAmountFromText = function(amountText) {
    if (!amountText) return null

    let mainAmount = amountText

    const parenIndex = mainAmount.indexOf('(')
    if (parenIndex !== -1) {
      mainAmount = mainAmount.substring(0, parenIndex).trim()
    }

    const andIndex = mainAmount.toLowerCase().indexOf(' and ')
    if (andIndex !== -1) {
      mainAmount = mainAmount.substring(0, andIndex).trim()
    }

    const currencyMatch = mainAmount.match(/([£$€])([\d,]+(?:\.\d{2})?)/)
    if (currencyMatch) {
      const amount = currencyMatch[2].replace(/,/g, '')
      return parseFloat(amount)
    }

    const millionMatch = mainAmount.match(/([£$€]?)([\d,.]+)\s*million/i)
    if (millionMatch) {
      const amount = millionMatch[2].replace(/,/g, '')
      return parseFloat(amount) * 1000000
    }

    const thousandMatch = mainAmount.match(/([£$€]?)([\d,.]+)\s*thousand/i)
    if (thousandMatch) {
      const amount = thousandMatch[2].replace(/,/g, '')
      return parseFloat(amount) * 1000
    }

    const numberMatch = mainAmount.match(/([£$€])([\d,]+(?:\.\d{2})?)/)
    if (numberMatch) {
      const amount = numberMatch[2].replace(/,/g, '')
      return parseFloat(amount)
    }

    const basicNumberMatch = mainAmount.match(/([\d,]+(?:\.\d{2})?)/)
    if (basicNumberMatch) {
      const amount = basicNumberMatch[1].replace(/,/g, '')
      return parseFloat(amount)
    }

    return null
  }

  ServiceClass.prototype.parseDateFromText = function(dateText, fallbackYear) {
    if (!dateText) {
      console.warn(`No date text provided, using fallback: ${fallbackYear}-01-01`)
      return null // Return null instead of arbitrary date
    }

    const cleanText = dateText.trim()

    // UK Format: DD/MM/YYYY or DD-MM-YYYY (FCA standard)
    const ukFormat = cleanText.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
    if (ukFormat) {
      const day = parseInt(ukFormat[1], 10)
      const month = parseInt(ukFormat[2], 10) - 1 // JS months are 0-indexed
      const year = parseInt(ukFormat[3], 10)

      // Validate date components
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000 && year <= 2030) {
        const date = new Date(Date.UTC(year, month, day, 0, 0, 0))  // Use UTC midnight
        // Verify the date is valid (handles invalid dates like Feb 30)
        const utcDay = date.getUTCDate()
        const utcMonth = date.getUTCMonth()
        const utcYear = date.getUTCFullYear()
        if (utcDay === day && utcMonth === month && utcYear === year) {
          console.log(`Parsed UK date: ${cleanText} → ${date.toISOString().split('T')[0]}`)
          return date
        }
      }
    }

    // Day Month Year: "2 July 2025" or "2nd July 2025"
    const dayMonthYear = cleanText.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i)
    if (dayMonthYear) {
      const day = parseInt(dayMonthYear[1], 10)
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
      const month = monthNames.indexOf(dayMonthYear[2].toLowerCase())
      const year = parseInt(dayMonthYear[3], 10)

      if (month !== -1 && day >= 1 && day <= 31 && year >= 2000 && year <= 2030) {
        const date = new Date(Date.UTC(year, month, day, 0, 0, 0))
        const utcDay = date.getUTCDate()
        const utcMonth = date.getUTCMonth()
        if (utcDay === day && utcMonth === month) {
          console.log(`Parsed day-month-year: ${cleanText} → ${date.toISOString().split('T')[0]}`)
          return date
        }
      }
    }

    // Month Day, Year: "July 2, 2025" or "July 2nd, 2025"
    const monthDayYear = cleanText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i)
    if (monthDayYear) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
      const month = monthNames.indexOf(monthDayYear[1].toLowerCase())
      const day = parseInt(monthDayYear[2], 10)
      const year = parseInt(monthDayYear[3], 10)

      if (month !== -1 && day >= 1 && day <= 31 && year >= 2000 && year <= 2030) {
        const date = new Date(Date.UTC(year, month, day, 0, 0, 0))
        const utcDay = date.getUTCDate()
        const utcMonth = date.getUTCMonth()
        if (utcDay === day && utcMonth === month) {
          console.log(`Parsed month-day-year: ${cleanText} → ${date.toISOString().split('T')[0]}`)
          return date
        }
      }
    }

    // ISO Format: YYYY-MM-DD or YYYY/MM/DD
    const isoFormat = cleanText.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
    if (isoFormat) {
      const year = parseInt(isoFormat[1], 10)
      const month = parseInt(isoFormat[2], 10) - 1
      const day = parseInt(isoFormat[3], 10)

      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000 && year <= 2030) {
        const date = new Date(Date.UTC(year, month, day, 0, 0, 0))
        const utcDay = date.getUTCDate()
        const utcMonth = date.getUTCMonth()
        if (utcDay === day && utcMonth === month) {
          console.log(`Parsed ISO date: ${cleanText} → ${date.toISOString().split('T')[0]}`)
          return date
        }
      }
    }

    // If we couldn't parse, log warning and return null
    console.warn(`Failed to parse date: "${cleanText}", returning null`)
    return null
  }

  ServiceClass.prototype.extractBreachCategories = function(reasonText) {
    if (!reasonText) return []

    const text = reasonText.toLowerCase()
    const categories = []

    const categoryKeywords = {
      'Anti-Money Laundering': ['aml', 'anti-money laundering', 'money laundering', 'suspicious transactions', 'customer due diligence'],
      'Market Abuse': ['market abuse', 'insider dealing', 'market manipulation', 'misleading statements'],
      'Customer Treatment': ['treating customers fairly', 'customer treatment', 'mis-selling', 'unfair treatment'],
      'Systems and Controls': ['systems and controls', 'systems failure', 'inadequate controls', 'operational risk'],
      'Prudential Requirements': ['capital requirements', 'liquidity', 'prudential', 'solvency'],
      'Conduct Risk': ['conduct risk', 'conduct failures', 'inappropriate conduct'],
      'Client Money': ['client money', 'client assets', 'segregation'],
      Governance: ['governance', 'management failure', 'oversight'],
      'Reporting and Disclosure': ['reporting', 'disclosure', 'transaction reporting', 'regulatory reporting'],
      'Financial Crime': ['financial crime', 'sanctions', 'terrorist financing', 'proceeds of crime']
    }

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          if (!categories.includes(category)) {
            categories.push(category)
          }
          break
        }
      }
    }

    if (categories.length === 0) {
      categories.push('Regulatory Breach')
    }

    return categories
  }

  ServiceClass.prototype.extractSectors = function(firmName) {
    if (!firmName) return []

    const text = firmName.toLowerCase()
    const sectors = []

    const sectorKeywords = {
      Banking: ['bank', 'banking', 'hsbc', 'barclays', 'natwest', 'rbs', 'lloyds', 'santander', 'building society'],
      Insurance: ['insurance', 'insurer', 'life', 'general insurance', 'underwriter', 'mutual'],
      'Asset Management': ['asset management', 'fund', 'investment', 'capital', 'wealth', 'portfolio'],
      'Investment Banking': ['investment bank', 'securities', 'corporate finance', 'merger', 'acquisition'],
      'Retail Banking': ['retail', 'personal banking', 'current account', 'savings', 'mortgage'],
      'Commercial Banking': ['commercial', 'business banking', 'corporate banking', 'trade finance'],
      Fintech: ['fintech', 'digital', 'online', 'app', 'technology', 'payments', 'crypto'],
      Brokerage: ['broker', 'brokerage', 'dealing', 'trading', 'execution'],
      'Financial Advisory': ['adviser', 'advisor', 'advisory', 'consultancy', 'financial planning'],
      Credit: ['credit', 'lending', 'loan', 'finance company', 'consumer credit'],
      Pensions: ['pension', 'retirement', 'superannuation', 'annuity']
    }

    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          if (!sectors.includes(sector)) {
            sectors.push(sector)
          }
          break
        }
      }
    }

    if (sectors.length === 0) {
      sectors.push('Financial Services')
    }

    return sectors
  }

  ServiceClass.prototype.assessImpactLevel = function(amount, reason = '') {
    if (!amount) return 'Low'

    const numericAmount = typeof amount === 'string' ? this.parseAmountFromText(amount) : amount
    const reasonLower = reason.toLowerCase()

    if (numericAmount >= 10000000 ||
        reasonLower.includes('systemic') ||
        reasonLower.includes('money laundering') ||
        reasonLower.includes('market manipulation') ||
        reasonLower.includes('customer detriment')) {
      return 'High'
    }

    if (numericAmount >= 1000000 ||
        reasonLower.includes('conduct') ||
        reasonLower.includes('mis-selling') ||
        reasonLower.includes('governance')) {
      return 'Medium'
    }

    return 'Low'
  }

  ServiceClass.prototype.calculateRiskScore = function(amount, reason = '') {
    let score = 30

    const numericAmount = typeof amount === 'string' ? this.parseAmountFromText(amount) : amount
    const reasonLower = reason.toLowerCase()

    if (numericAmount >= 100000000) score += 40
    else if (numericAmount >= 50000000) score += 35
    else if (numericAmount >= 10000000) score += 30
    else if (numericAmount >= 5000000) score += 25
    else if (numericAmount >= 1000000) score += 20
    else if (numericAmount >= 500000) score += 15
    else if (numericAmount >= 100000) score += 10

    if (reasonLower.includes('money laundering') || reasonLower.includes('aml')) score += 30
    else if (reasonLower.includes('market manipulation') || reasonLower.includes('insider dealing')) score += 25
    else if (reasonLower.includes('systemic') || reasonLower.includes('governance')) score += 20
    else if (reasonLower.includes('customer treatment') || reasonLower.includes('conduct')) score += 15
    else if (reasonLower.includes('reporting') || reasonLower.includes('disclosure')) score += 10

    return Math.min(100, score)
  }

  ServiceClass.prototype.assessSystemicRisk = function(amount, reason = '', firmName = '') {
    const numericAmount = typeof amount === 'string' ? this.parseAmountFromText(amount) : amount
    const reasonLower = reason.toLowerCase()
    const firmLower = firmName.toLowerCase()

    const systemicIndicators = [
      numericAmount >= 50000000,
      reasonLower.includes('systemic'),
      reasonLower.includes('money laundering'),
      reasonLower.includes('market manipulation'),
      reasonLower.includes('1mdb'),
      firmLower.includes('major bank') || firmLower.includes('systemically important')
    ]

    return systemicIndicators.some(Boolean)
  }

  ServiceClass.prototype.assessPrecedentSetting = function(reason = '', amount = 0) {
    const reasonLower = reason.toLowerCase()
    const numericAmount = typeof amount === 'string' ? this.parseAmountFromText(amount) : amount

    const precedentIndicators = [
      numericAmount >= 100000000,
      reasonLower.includes('first') || reasonLower.includes('unprecedented'),
      reasonLower.includes('landmark') || reasonLower.includes('significant'),
      reasonLower.includes('new type') || reasonLower.includes('novel'),
      reasonLower.includes('industry-wide')
    ]

    return precedentIndicators.some(Boolean)
  }
}

module.exports = applyUtilityMethods
