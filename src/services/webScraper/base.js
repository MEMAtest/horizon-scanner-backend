const { URL } = require('url')

function applyBaseMethods(ServiceClass) {
  ServiceClass.prototype.setupAxiosInterceptors = function() {
    this.httpClient.interceptors.request.use(async config => {
      const domain = new URL(config.url).hostname
      await this.respectRateLimit(domain)
      this.activeRequests.add(config.url)
      return config
    })

    this.httpClient.interceptors.response.use(
      response => {
        this.activeRequests.delete(response.config.url)
        return response
      },
      error => {
        this.activeRequests.delete(error.config?.url)
        return Promise.reject(error)
      }
    )
  }

  ServiceClass.prototype.respectRateLimit = async function(domain) {
    const now = Date.now()
    const lastRequest = this.rateLimiters.get(domain) || 0
    const timeSinceLastRequest = now - lastRequest

    let rateLimit = 2000

    if (domain.includes('fatf-gafi.org')) rateLimit = 4000
    else if (domain.includes('europa.eu')) rateLimit = 3000
    else if (domain.includes('bis.org')) rateLimit = 4000

    if (timeSinceLastRequest < rateLimit) {
      const waitTime = rateLimit - timeSinceLastRequest
      await this.wait(waitTime)
    }

    this.rateLimiters.set(domain, Date.now())
  }

  ServiceClass.prototype.makeRequest = async function(url, options = {}) {
    const maxRetries = options.retries || 3
    const baseDelay = options.baseDelay || 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.get(url, {
          timeout: options.timeout || 30000,
          headers: {
            ...options.headers,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache'
          }
        })

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        if (!response.data || response.data.length < 100) {
          throw new Error('Response too short or empty')
        }

        return response
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`)
        }

        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        await this.wait(delay)
      }
    }
  }

  ServiceClass.prototype.wait = async function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  ServiceClass.prototype.extractText = function(item, selector, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      return element.first().text()?.trim() || null
    } catch (error) {
      return null
    }
  }

  ServiceClass.prototype.extractUrl = function(item, selector, baseUrl, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      let href = element.first().attr('href')

      if (!href) return null

      if (href.startsWith('/')) {
        href = baseUrl + href
      } else if (!href.startsWith('http')) {
        href = baseUrl + '/' + href
      }

      return href
    } catch (error) {
      return null
    }
  }

  ServiceClass.prototype.extractInternationalUrl = function(item, selector, baseUrl, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      let href = element.first().attr('href')

      if (!href) return null

      if (href.startsWith('/')) {
        href = baseUrl + href
      } else if (!href.startsWith('http') && !href.includes('://')) {
        href = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + href
      }

      return href
    } catch (error) {
      return null
    }
  }

  ServiceClass.prototype.extractDate = function(item, selector, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      const dateText = element.first().text()?.trim() || element.first().attr('datetime')
      return dateText
    } catch (error) {
      return null
    }
  }

  ServiceClass.prototype.parseDate = function(dateText) {
    if (!dateText) return null
    try {
      const date = new Date(dateText)
      return Number.isNaN(date.getTime()) ? null : date.toISOString()
    } catch (error) {
      return null
    }
  }

  ServiceClass.prototype.isRecent = function(dateStr, days) {
    if (!dateStr) return false
    try {
      const date = new Date(dateStr)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return date >= cutoff
    } catch (error) {
      return false
    }
  }

  ServiceClass.prototype.normalizeUrl = function(url) {
    try {
      const urlObj = new URL(url)
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign']
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param))
      return urlObj.toString()
    } catch (error) {
      return url
    }
  }

  ServiceClass.prototype.buildPageUrl = function(baseUrl, pageNumber) {
    if (pageNumber <= 1) return baseUrl

    try {
      const url = new URL(baseUrl)
      url.searchParams.set('page', pageNumber.toString())
      return url.toString()
    } catch (error) {
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}page=${pageNumber}`
    }
  }

  ServiceClass.prototype.buildPaginationUrl = function(baseUrl, pageNumber, pagination = {}) {
    if (pageNumber <= 1) return baseUrl

    if (pagination.param) {
      try {
        const url = new URL(baseUrl)
        url.searchParams.set(pagination.param, pageNumber.toString())
        return url.toString()
      } catch (error) {
        const separator = baseUrl.includes('?') ? '&' : '?'
        return `${baseUrl}${separator}${pagination.param}=${pageNumber}`
      }
    }

    if (pagination.pattern) {
      return pagination.pattern.replace('{page}', pageNumber)
    }

    return this.buildPageUrl(baseUrl, pageNumber)
  }
}

module.exports = applyBaseMethods
