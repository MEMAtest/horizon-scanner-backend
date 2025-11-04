function applyCacheMethods(ServiceClass) {
  ServiceClass.prototype.getFromCache = function(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Cache hit: ${key}`)
      return cached.data
    }
    return null
  }

  ServiceClass.prototype.setCache = function(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    if (this.cache.size > 50) {
      const entries = Array.from(this.cache.entries())
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)

      const toRemove = Math.floor(entries.length * 0.25)
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0])
      }
    }

    console.log(`💾 Cache updated: ${key}`)
  }

  ServiceClass.prototype.clearCache = function() {
    this.cache.clear()
    console.log('🧹 Enhanced analytics cache cleared')
  }
}

module.exports = applyCacheMethods
