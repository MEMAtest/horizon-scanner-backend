const dbService = require('../dbService')

function applyContentMethods(ServiceClass) {
  ServiceClass.prototype.getContentTypeDistribution = async function() {
    const cacheKey = 'content_distribution'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('📑 Analyzing content type distribution...')

      const updates = await dbService.getAllUpdates()
      const total = updates.length

      const contentTypes = {}
      const sourceTypes = {}

      updates.forEach(update => {
        const contentType = this.determineContentType(update)
        contentTypes[contentType] = (contentTypes[contentType] || 0) + 1

        const sourceType = this.determineSourceType(update)
        sourceTypes[sourceType] = (sourceTypes[sourceType] || 0) + 1
      })

      const contentDistribution = {
        totalDocuments: total,
        contentTypes,
        sourceTypes,
        topContentType: Object.entries(contentTypes).sort(([, a], [, b]) => b - a)[0] || null,
        topSourceType: Object.entries(sourceTypes).sort(([, a], [, b]) => b - a)[0] || null,
        diversityScore: Object.keys(contentTypes).length,
        insights: this.generateContentDistributionInsights(contentTypes, sourceTypes, total),
        calculatedAt: new Date().toISOString()
      }

      this.setCache(cacheKey, contentDistribution)
      return contentDistribution
    } catch (error) {
      console.error('❌ Error analyzing content distribution:', error)
      throw error
    }
  }

  ServiceClass.prototype.generateContentDistributionInsights = function(contentTypes, sourceTypes, total) {
    const topContentType = Object.entries(contentTypes).sort(([, a], [, b]) => b - a)[0]
    const topSourceType = Object.entries(sourceTypes).sort(([, a], [, b]) => b - a)[0]

    const insights = []

    if (topContentType && topContentType[1] / total > 0.3) {
      insights.push(`${topContentType[0]} documents dominate (${Math.round(topContentType[1] / total * 100)}%)`)
    }

    if (topSourceType && topSourceType[1] / total > 0.5) {
      insights.push(`${topSourceType[0]} is the primary source (${Math.round(topSourceType[1] / total * 100)}%)`)
    }

    const diversityScore = Object.keys(contentTypes).length
    if (diversityScore >= 8) {
      insights.push('High content diversity detected across document types')
    } else if (diversityScore <= 4) {
      insights.push('Limited content diversity - consider expanding monitoring scope')
    }

    return insights
  }
}

module.exports = applyContentMethods
