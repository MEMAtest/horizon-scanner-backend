module.exports = function applyAnalyticsMethods(EnhancedDBService) {
  const isBankNewsUpdate = (update) => (update.source_category || update.sourceCategory) === 'bank_news'
  const excludeBankNewsUpdates = (updates) => (Array.isArray(updates) ? updates.filter(update => !isBankNewsUpdate(update)) : [])
  const bankNewsFilterSql = "source_category IS DISTINCT FROM 'bank_news'"

  Object.assign(EnhancedDBService.prototype, {
    async getSystemStatistics() {
      try {
        if (this.fallbackMode) {
          return await this.getSystemStatisticsJSON()
        } else {
          return await this.getSystemStatisticsPG()
        }
      } catch (error) {
        console.error('❌ Error getting system statistics:', error)
        return { totalUpdates: 0, activeAuthorities: 0, aiAnalyzed: 0, highImpact: 0 }
      }
    },

    async getSystemStatisticsPG() {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                  SELECT 
                      COUNT(*) as total_updates,
                      COUNT(DISTINCT authority) as active_authorities,
                      COUNT(*) FILTER (WHERE ai_summary IS NOT NULL) as ai_analyzed,
                      COUNT(*) FILTER (WHERE impact_level = 'Significant' OR business_impact_score >= 7) as high_impact
                  FROM regulatory_updates
                  WHERE ${bankNewsFilterSql}
              `)

        const stats = result.rows[0]
        return {
          totalUpdates: parseInt(stats.total_updates),
          activeAuthorities: parseInt(stats.active_authorities),
          aiAnalyzed: parseInt(stats.ai_analyzed),
          highImpact: parseInt(stats.high_impact)
        }
      } finally {
        client.release()
      }
    },

    async getSystemStatisticsJSON() {
      const updates = excludeBankNewsUpdates(await this.loadJSONData(this.updatesFile))

      const totalUpdates = updates.length
      const activeAuthorities = new Set(updates.map(u => u.authority)).size
      const aiAnalyzed = updates.filter(u => u.ai_summary || u.businessImpactScore || u.business_impact_score).length
      const highImpact = updates.filter(u =>
        u.impactLevel === 'Significant' ||
              u.impact_level === 'Significant' ||
              (u.business_impact_score || u.businessImpactScore || 0) >= 7
      ).length

      return { totalUpdates, activeAuthorities, aiAnalyzed, highImpact }
    },

    async getDashboardStatistics() {
      try {
        if (this.fallbackMode) {
          return await this.getDashboardStatisticsJSON()
        } else {
          return await this.getDashboardStatisticsPG()
        }
      } catch (error) {
        console.error('❌ Error getting dashboard statistics:', error)
        return {
          totalUpdates: 0,
          highImpact: 0,
          aiAnalyzed: 0,
          activeAuthorities: 0,
          newToday: 0,
          newAuthorities: 0,
          impactTrend: 'stable',
          impactChange: 0,
          totalUpdatesDelta: 0,
          totalUpdatesDeltaPercent: 0,
          highImpactDelta: 0,
          highImpactDeltaPercent: 0,
          aiAnalyzedDelta: 0,
          aiAnalyzedDeltaPercent: 0,
          activeAuthoritiesDelta: 0,
          activeAuthoritiesDeltaPercent: 0
        }
      }
    },

    async getDashboardStatisticsPG() {
      const client = await this.pool.connect()
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const startOfPrevWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000)

        const result = await client.query(`
                  SELECT 
                      COUNT(*) as total_updates,
                      COUNT(*) FILTER (WHERE impact_level = 'Significant' OR business_impact_score >= 7) as high_impact,
                      COUNT(*) FILTER (WHERE ai_summary IS NOT NULL) as ai_analyzed,
                      COUNT(DISTINCT authority) as active_authorities,
                      COUNT(*) FILTER (WHERE published_date >= $1) as new_today,
                      COUNT(*) FILTER (WHERE published_date >= $2) as total_last_week,
                      COUNT(*) FILTER (WHERE published_date >= $3 AND published_date < $2) as total_prev_week,
                      COUNT(*) FILTER (WHERE (impact_level = 'Significant' OR business_impact_score >= 7) AND published_date >= $2) as high_impact_last_week,
                      COUNT(*) FILTER (WHERE (impact_level = 'Significant' OR business_impact_score >= 7) AND published_date >= $3 AND published_date < $2) as high_impact_prev_week,
                      COUNT(*) FILTER (WHERE ai_summary IS NOT NULL AND published_date >= $2) as ai_analyzed_last_week,
                      COUNT(*) FILTER (WHERE ai_summary IS NOT NULL AND published_date >= $3 AND published_date < $2) as ai_analyzed_prev_week,
                      COUNT(DISTINCT CASE WHEN published_date >= $2 THEN authority END) as authorities_last_week,
                      COUNT(DISTINCT CASE WHEN published_date >= $3 AND published_date < $2 THEN authority END) as authorities_prev_week
                  FROM regulatory_updates
                  WHERE ${bankNewsFilterSql}
              `, [today, startOfWeek, startOfPrevWeek])

        const stats = result.rows[0]

        const calcDelta = (current, previous) => {
          const currentValue = Number(current || 0)
          const previousValue = Number(previous || 0)
          const delta = currentValue - previousValue
          const percent = previousValue > 0 ? Math.round((delta / previousValue) * 100) : (currentValue > 0 ? 100 : 0)
          return { delta, percent }
        }

        const totalChange = calcDelta(stats.total_last_week, stats.total_prev_week)
        const highImpactChange = calcDelta(stats.high_impact_last_week, stats.high_impact_prev_week)
        const aiAnalyzedChange = calcDelta(stats.ai_analyzed_last_week, stats.ai_analyzed_prev_week)
        const authorityChange = calcDelta(stats.authorities_last_week, stats.authorities_prev_week)

        return {
          totalUpdates: parseInt(stats.total_updates),
          highImpact: parseInt(stats.high_impact),
          aiAnalyzed: parseInt(stats.ai_analyzed),
          activeAuthorities: parseInt(stats.active_authorities),
          newToday: parseInt(stats.new_today),
          newAuthorities: Math.max(authorityChange.delta, 0),
          impactTrend: highImpactChange.delta > 0 ? 'up' : highImpactChange.delta < 0 ? 'down' : 'stable',
          impactChange: highImpactChange.percent,
          totalUpdatesDelta: totalChange.delta,
          totalUpdatesDeltaPercent: totalChange.percent,
          highImpactDelta: highImpactChange.delta,
          highImpactDeltaPercent: highImpactChange.percent,
          aiAnalyzedDelta: aiAnalyzedChange.delta,
          aiAnalyzedDeltaPercent: aiAnalyzedChange.percent,
          activeAuthoritiesDelta: authorityChange.delta,
          activeAuthoritiesDeltaPercent: authorityChange.percent
        }
      } finally {
        client.release()
      }
    },

    async getDashboardStatisticsJSON() {
      const updates = excludeBankNewsUpdates(await this.loadJSONData(this.updatesFile))
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const totalUpdates = updates.length
      const highImpact = updates.filter(u =>
        u.impactLevel === 'Significant' ||
              u.impact_level === 'Significant' ||
              (u.business_impact_score || u.businessImpactScore || 0) >= 7
      ).length
      const aiAnalyzed = updates.filter(u => u.ai_summary || u.businessImpactScore || u.business_impact_score).length
      const activeAuthorities = new Set(updates.map(u => u.authority)).size
      const newToday = updates.filter(u => {
        const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
        return updateDate >= today
      }).length

      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const startOfPrevWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000)

      const withinRange = (start, end) => (update) => {
        const date = new Date(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
        if (isNaN(date)) return false
        if (end) {
          return date >= start && date < end
        }
        return date >= start
      }

      const isHighImpact = update => (
        update.impactLevel === 'Significant' ||
        update.impact_level === 'Significant' ||
        (update.business_impact_score || update.businessImpactScore || 0) >= 7
      )

      const lastWeekUpdates = updates.filter(withinRange(startOfWeek))
      const previousWeekUpdates = updates.filter(withinRange(startOfPrevWeek, startOfWeek))

      const countHighImpact = arr => arr.filter(isHighImpact).length
      const countAiAnalyzed = arr => arr.filter(u => u.ai_summary || u.businessImpactScore || u.business_impact_score).length
      const countAuthorities = arr => new Set(arr.map(u => u.authority).filter(Boolean)).size

      const calcDelta = (current, previous) => {
        const delta = current - previous
        const percent = previous > 0 ? Math.round((delta / previous) * 100) : (current > 0 ? 100 : 0)
        return { delta, percent }
      }

      const totalChange = calcDelta(lastWeekUpdates.length, previousWeekUpdates.length)
      const highImpactChange = calcDelta(countHighImpact(lastWeekUpdates), countHighImpact(previousWeekUpdates))
      const aiAnalyzedChange = calcDelta(countAiAnalyzed(lastWeekUpdates), countAiAnalyzed(previousWeekUpdates))
      const authorityChange = calcDelta(countAuthorities(lastWeekUpdates), countAuthorities(previousWeekUpdates))
      const impactTrend = highImpactChange.delta > 0 ? 'up' : highImpactChange.delta < 0 ? 'down' : 'stable'

      return {
        totalUpdates,
        highImpact,
        aiAnalyzed,
        activeAuthorities,
        newToday,
        newAuthorities: Math.max(authorityChange.delta, 0),
        impactTrend,
        impactChange: highImpactChange.percent,
        totalUpdatesDelta: totalChange.delta,
        totalUpdatesDeltaPercent: totalChange.percent,
        highImpactDelta: highImpactChange.delta,
        highImpactDeltaPercent: highImpactChange.percent,
        aiAnalyzedDelta: aiAnalyzedChange.delta,
        aiAnalyzedDeltaPercent: aiAnalyzedChange.percent,
        activeAuthoritiesDelta: authorityChange.delta,
        activeAuthoritiesDeltaPercent: authorityChange.percent
      }
    },

    async getUpdateCounts() {
      try {
        if (this.fallbackMode) {
          return await this.getUpdateCountsJSON()
        } else {
          return await this.getUpdateCountsPG()
        }
      } catch (error) {
        console.error('❌ Error getting update counts:', error)
        return { total: 0, highImpact: 0, today: 0, thisWeek: 0, authorities: {}, sectors: {} }
      }
    },

    async getUpdateCountsPG() {
      const client = await this.pool.connect()
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Get basic counts
        const countsResult = await client.query(`
                  SELECT 
                      COUNT(*) as total,
                      COUNT(*) FILTER (WHERE impact_level = 'Significant' OR business_impact_score >= 7) as high_impact,
                      COUNT(*) FILTER (WHERE published_date >= $1) as today,
                      COUNT(*) FILTER (WHERE published_date >= $2) as this_week
                  FROM regulatory_updates
                  WHERE ${bankNewsFilterSql}
              `, [today, weekAgo])

        // Get authority counts
        const authoritiesResult = await client.query(`
                  SELECT authority, COUNT(*) as count
                  FROM regulatory_updates
                  WHERE published_date >= $1
                    AND ${bankNewsFilterSql}
                  GROUP BY authority
                  ORDER BY count DESC
              `, [weekAgo])

        const authorities = {}
        authoritiesResult.rows.forEach(row => {
          authorities[row.authority] = parseInt(row.count)
        })

        const counts = countsResult.rows[0]
        return {
          total: parseInt(counts.total),
          highImpact: parseInt(counts.high_impact),
          today: parseInt(counts.today),
          thisWeek: parseInt(counts.this_week),
          unread: 0, // TODO: Implement user-specific unread tracking
          authorities,
          sectors: {}, // TODO: Implement sector counting
          activeSources: 12, // TODO: Get from RSS fetcher
          dbStatus: 'online'
        }
      } finally {
        client.release()
      }
    },

    async getUpdateCountsJSON() {
      const updates = excludeBankNewsUpdates(await this.loadJSONData(this.updatesFile))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      const total = updates.length
      const highImpact = updates.filter(u =>
        u.impactLevel === 'Significant' ||
              u.impact_level === 'Significant' ||
              (u.business_impact_score || u.businessImpactScore || 0) >= 7
      ).length

      const todayUpdates = updates.filter(u => {
        const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
        return updateDate >= today
      }).length

      const weekUpdates = updates.filter(u => {
        const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
        return updateDate >= weekAgo
      }).length

      const authorities = {}
      updates.forEach(u => {
        if (u.authority) {
          authorities[u.authority] = (authorities[u.authority] || 0) + 1
        }
      })

      return {
        total,
        highImpact,
        today: todayUpdates,
        thisWeek: weekUpdates,
        unread: 0,
        authorities,
        sectors: {},
        activeSources: 8,
        dbStatus: 'json-mode'
      }
    },

    async getFilterOptions() {
      try {
        if (this.fallbackMode) {
          return await this.getFilterOptionsJSON()
        } else {
          return await this.getFilterOptionsPG()
        }
      } catch (error) {
        console.error('❌ Error getting filter options:', error)
        return { authorities: [], sectors: [] }
      }
    },

    async getFilterOptionsPG() {
      const client = await this.pool.connect()
      try {
        const authoritiesResult = await client.query(`
                  SELECT authority as name, COUNT(*) as count
                  FROM regulatory_updates
                  WHERE ${bankNewsFilterSql}
                  GROUP BY authority
                  ORDER BY count DESC
              `)

        // TODO: Implement sector extraction from firm_types_affected JSONB
        const sectorsResult = await client.query(`
                  SELECT DISTINCT sector as name, COUNT(*) as count
                  FROM regulatory_updates
                  WHERE sector IS NOT NULL
                    AND ${bankNewsFilterSql}
                  GROUP BY sector
                  ORDER BY count DESC
              `)

        return {
          authorities: authoritiesResult.rows,
          sectors: sectorsResult.rows
        }
      } finally {
        client.release()
      }
    },

    async getFilterOptionsJSON() {
      const updates = excludeBankNewsUpdates(await this.loadJSONData(this.updatesFile))

      const authorityCounts = {}
      const sectorCounts = {}

      updates.forEach(u => {
        if (u.authority) {
          authorityCounts[u.authority] = (authorityCounts[u.authority] || 0) + 1
        }

        if (u.sector) {
          sectorCounts[u.sector] = (sectorCounts[u.sector] || 0) + 1
        }

        // Count sectors from firm_types_affected
        if (u.firm_types_affected) {
          u.firm_types_affected.forEach(sector => {
            sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
          })
        }

        // Count sectors from primarySectors
        if (u.primarySectors) {
          u.primarySectors.forEach(sector => {
            sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
          })
        }
      })

      const authorities = Object.entries(authorityCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      const sectors = Object.entries(sectorCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      return { authorities, sectors }
    },

    async getSystemStats() {
      await this.initialize()

      try {
        const updates = await this.getRecentUpdates(1000, 0)
        const today = new Date()
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Basic counts
        const stats = {
          totalUpdates: updates.length,
          todayUpdates: updates.filter(u => new Date(u.fetchedDate || u.createdAt) >= yesterday).length,
          weekUpdates: updates.filter(u => new Date(u.fetchedDate || u.createdAt) >= weekAgo).length,
          authorities: [...new Set(updates.map(u => u.authority).filter(Boolean))].length,
          sectors: [...new Set(updates.map(u => u.sector).filter(Boolean))].length
        }

        // Add workspace stats
        try {
          const pinnedItems = await this.getPinnedItems()
          const savedSearches = await this.getSavedSearches()
          const customAlerts = await this.getCustomAlerts()
          const firmProfile = await this.getFirmProfile()

          stats.workspace = {
            pinnedItems: pinnedItems.length,
            savedSearches: savedSearches.length,
            customAlerts: customAlerts.length,
            activeAlerts: customAlerts.filter(alert => alert.isActive).length,
            hasFirmProfile: !!firmProfile
          }
        } catch (error) {
          console.log('📊 Workspace stats not available yet')
          stats.workspace = {
            pinnedItems: 0,
            savedSearches: 0,
            customAlerts: 0,
            activeAlerts: 0,
            hasFirmProfile: false
          }
        }

        // Authority breakdown
        const authorityBreakdown = {}
        updates.forEach(update => {
          if (update.authority) {
            authorityBreakdown[update.authority] = (authorityBreakdown[update.authority] || 0) + 1
          }
        })
        stats.authorityBreakdown = authorityBreakdown

        // Recent activity (last 24 hours)
        const recentUpdates = updates.filter(u => new Date(u.fetchedDate || u.createdAt) >= yesterday)
        stats.recentActivity = recentUpdates.slice(0, 5).map(update => ({
          headline: update.headline.substring(0, 80) + '...',
          authority: update.authority,
          fetchedDate: update.fetchedDate || update.createdAt
        }))

        return stats
      } catch (error) {
        console.error('Error getting system stats:', error)
        throw new Error(`Failed to get system statistics: ${error.message}`)
      }
    }
  })
}
