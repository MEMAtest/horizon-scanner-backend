module.exports = function applyInsightsMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async saveAIInsight(insightData) {
      try {
        if (this.fallbackMode) {
          return await this.saveAIInsightJSON(insightData)
        } else {
          return await this.saveAIInsightPG(insightData)
        }
      } catch (error) {
        console.error('❌ Error saving AI insight:', error)
        throw error
      }
    },

    async saveAIInsightPG(insightData) {
      const client = await this.pool.connect()
      try {
        const query = `
                  INSERT INTO ai_insights (
                      update_id, insight_type, title, summary, impact_score,
                      urgency_level, affected_firm_types, affected_firm_sizes,
                      probability_score, evidence_sources, recommendations
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                  RETURNING id
              `

        const values = [
          insightData.update_id,
          insightData.insight_type,
          insightData.title,
          insightData.summary,
          insightData.impact_score,
          insightData.urgency_level,
          JSON.stringify(insightData.affected_firm_types || []),
          JSON.stringify(insightData.affected_firm_sizes || []),
          insightData.probability_score,
          JSON.stringify(insightData.evidence_sources || []),
          JSON.stringify(insightData.recommendations || [])
        ]

        const result = await client.query(query, values)
        return result.rows[0].id
      } finally {
        client.release()
      }
    },

    async saveAIInsightJSON(insightData) {
      const insights = await this.loadJSONData(this.insightsFile)
      const newId = Math.max(0, ...insights.map(i => i.id || 0)) + 1

      const insight = {
        id: newId,
        ...insightData,
        created_at: new Date().toISOString(),
        is_active: true
      }

      insights.push(insight)
      await this.saveJSONData(this.insightsFile, insights)
      return newId
    },

    async getRecentAIInsights(limit = 10) {
      try {
        if (this.fallbackMode) {
          const insights = await this.loadJSONData(this.insightsFile)
          return insights
            .filter(i => i.is_active !== false)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit)
        } else {
          const client = await this.pool.connect()
          try {
            const result = await client.query(`
                          SELECT * FROM ai_insights 
                          WHERE is_active = true 
                          ORDER BY created_at DESC 
                          LIMIT $1
                      `, [limit])
            return result.rows
          } finally {
            client.release()
          }
        }
      } catch (error) {
        console.error('❌ Error getting AI insights:', error)
        return []
      }
    },

    async storeAIInsight(insightData) {
      // Alias for saveAIInsight to maintain compatibility
      return await this.saveAIInsight(insightData)
    }
  })
}
