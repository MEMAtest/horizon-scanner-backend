module.exports = function applyUpdatesMethods(EnhancedDBService) {
  const normalizeHeadlineText = (value) => {
    if (value == null) return ''
    return String(value).replace(/\s+/g, ' ').trim()
  }

  const deriveHeadlineFromUrl = (url) => {
    if (!url) return ''
    try {
      const parsed = new URL(String(url))
      const host = parsed.hostname.replace(/^www\./, '')
      const path = parsed.pathname.split('/').filter(Boolean).slice(0, 3).join(' / ')
      return normalizeHeadlineText(path ? `${host} — ${path}` : host)
    } catch (error) {
      return ''
    }
  }

  const ensureUpdateHeadline = (updateData) => {
    if (!updateData || typeof updateData !== 'object') return updateData
    const existing = normalizeHeadlineText(updateData.headline)
    if (existing) return updateData

    const fallbackText = normalizeHeadlineText(
      updateData.title ||
      updateData.ai_headline ||
      updateData.aiHeadline ||
      updateData.summary ||
      updateData.ai_summary ||
      updateData.impact
    ).replace(/^RegCanary Analysis:\s*/i, '')

    let headline = normalizeHeadlineText(fallbackText)
    if (headline) {
      headline = headline.split(/[.?!]/)[0].trim().slice(0, 140)
    } else {
      headline = deriveHeadlineFromUrl(updateData.url) || 'Regulatory update'
    }

    return { ...updateData, headline }
  }

  Object.assign(EnhancedDBService.prototype, {
    async checkUpdateExists(url) {
      try {
        if (this.fallbackMode) {
          const updates = await this.loadJSONData(this.updatesFile)
          return updates.some(u => u.url === url)
        } else {
          const client = await this.pool.connect()
          try {
            const result = await client.query(
              'SELECT EXISTS(SELECT 1 FROM regulatory_updates WHERE url = $1) as exists',
              [url]
            )
            return result.rows[0].exists
          } finally {
            client.release()
          }
        }
      } catch (error) {
        console.warn('⚠️ Error checking if update exists:', error.message)
        return false // Assume doesn't exist on error to allow saving
      }
    },

    async saveUpdate(updateData) {
      try {
        const preparedUpdate = ensureUpdateHeadline(updateData)
        if (this.fallbackMode) {
          return await this.saveUpdateJSON(preparedUpdate)
        } else {
          return await this.saveUpdatePG(preparedUpdate)
        }
      } catch (error) {
        console.error('❌ Error saving update:', error)
        throw error
      }
    },

    async saveUpdatePG(updateData) {
      const client = await this.pool.connect()
      try {
        const query = `
                  INSERT INTO regulatory_updates (
                      headline, summary, url, authority, published_date,
                      impact_level, urgency, sector, area,
                      ai_summary, business_impact_score, ai_tags,
                      firm_types_affected, compliance_deadline, ai_confidence_score,
                      sector_relevance_scores, implementation_phases, required_resources,
                      country, region, content_type, source_category
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                  RETURNING id
              `

        const values = [
          updateData.headline,
          updateData.summary || updateData.impact,
          updateData.url,
          updateData.authority,
          updateData.publishedDate || updateData.published_date || updateData.fetchedDate || new Date(),
          updateData.impactLevel,
          updateData.urgency,
          updateData.sector,
          updateData.area,
          updateData.ai_summary || updateData.impact,
          updateData.businessImpactScore || updateData.business_impact_score || 0,
          JSON.stringify(updateData.aiTags || updateData.ai_tags || []),
          JSON.stringify(updateData.firmTypesAffected || updateData.firm_types_affected || []),
          updateData.complianceDeadline || updateData.compliance_deadline,
          updateData.aiConfidenceScore || updateData.ai_confidence_score || 0.0,
          JSON.stringify(updateData.sectorRelevanceScores || updateData.sector_relevance_scores || {}),
          JSON.stringify(updateData.implementationPhases || updateData.implementation_phases || []),
          JSON.stringify(updateData.requiredResources || updateData.required_resources || {}),
          updateData.country || updateData.raw_data?.country || updateData.raw_data?.international?.sourceCountry || 'UK',
          updateData.region || updateData.raw_data?.region || 'UK',
          updateData.content_type || updateData.contentType || null,
          updateData.source_category || updateData.sourceCategory || null
        ]

        const result = await client.query(query, values)
        const updateId = result.rows[0].id
        console.log(`✅ Update saved to PostgreSQL with ID: ${updateId}`)

        // Auto-match newly saved updates against watch lists (non-blocking)
        try {
          if (typeof this.matchUpdateAgainstWatchLists === 'function') {
            const matchPayload = {
              ...updateData,
              summary: updateData.summary || updateData.impact,
              ai_summary: updateData.ai_summary || updateData.impact
            }
            setImmediate(() => {
              this.matchUpdateAgainstWatchLists(updateId, matchPayload)
                .catch(error => console.warn('⚠️ Watch list auto-match failed:', error.message))
            })
          }
        } catch (error) {
          console.warn('⚠️ Watch list auto-match setup failed:', error.message)
        }

        return updateId
      } finally {
        client.release()
      }
    },

    async saveUpdateJSON(updateData) {
      try {
        // Ensure we always get an array from loadJSONData
        let updates = await this.loadJSONData(this.updatesFile)

        // Critical fix: ensure updates is always an array
        if (!Array.isArray(updates)) {
          console.log('⚠️ Updates was not an array, initializing as empty array')
          updates = []
        }

        // Generate new ID
        const newId = updates.length > 0
          ? Math.max(...updates.map(u => u.id || 0)) + 1
          : 1

        const update = {
          id: newId,
          ...updateData,
          fetchedDate: updateData.fetchedDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          ai_summary: updateData.ai_summary || updateData.impact,
          business_impact_score: updateData.businessImpactScore || updateData.business_impact_score || 0,
          ai_tags: updateData.aiTags || updateData.ai_tags || [],
          firm_types_affected: updateData.firmTypesAffected || updateData.firm_types_affected || [],
          compliance_deadline: updateData.complianceDeadline || updateData.compliance_deadline,
          ai_confidence_score: updateData.aiConfidenceScore || updateData.ai_confidence_score || 0.0,
          sector_relevance_scores: updateData.sectorRelevanceScores || updateData.sector_relevance_scores || {},
          implementation_phases: updateData.implementationPhases || updateData.implementation_phases || [],
          required_resources: updateData.requiredResources || updateData.required_resources || {}
        }

        updates.push(update)
        await this.saveJSONData(this.updatesFile, updates)
        console.log(`✅ Update saved to JSON with ID: ${newId}`)

        // Auto-match newly saved updates against watch lists (non-blocking)
        try {
          if (typeof this.matchUpdateAgainstWatchLists === 'function') {
            setImmediate(() => {
              this.matchUpdateAgainstWatchLists(newId, update)
                .catch(error => console.warn('⚠️ Watch list auto-match failed:', error.message))
            })
          }
        } catch (error) {
          console.warn('⚠️ Watch list auto-match setup failed:', error.message)
        }

        return newId
      } catch (error) {
        console.error('❌ Error in saveUpdateJSON:', error)
        throw error
      }
    },

    async getEnhancedUpdates(filters = {}) {
      try {
        if (this.fallbackMode) {
          return await this.getEnhancedUpdatesJSON(filters)
        } else {
          return await this.getEnhancedUpdatesPG(filters)
        }
      } catch (error) {
        console.error('❌ Error getting enhanced updates:', error)
        return []
      }
    },

    async getEnhancedUpdatesPG(filters) {
      const client = await this.pool.connect()
      try {
        let query = `
                  SELECT
                      id, headline, summary, url, authority,
                      published_date, created_at,
                      impact_level, urgency, sector, area,
                      ai_summary, content_type, business_impact_score, ai_tags,
                      firm_types_affected, compliance_deadline, ai_confidence_score,
                      sector_relevance_scores, implementation_phases, required_resources,
                      country, region, source_category
                  FROM regulatory_updates
                  WHERE 1=1
              `

        const params = []
        let paramCount = 0

        // Apply filters with array support
        if (filters.authority) {
          if (Array.isArray(filters.authority)) {
            query += ` AND authority = ANY($${++paramCount})`
            params.push(filters.authority)
          } else {
            query += ` AND authority = $${++paramCount}`
            params.push(filters.authority)
          }
        }

        if (filters.sector) {
          if (Array.isArray(filters.sector)) {
            paramCount++
            const sectorParam = paramCount
            paramCount++
            const firmTypesParam = paramCount
            query += ` AND (sector = ANY($${sectorParam}) OR firm_types_affected && $${firmTypesParam})`
            params.push(filters.sector, JSON.stringify(filters.sector))
          } else {
            paramCount++
            const sectorParam = paramCount
            paramCount++
            const firmTypesParam = paramCount
            query += ` AND (sector = $${sectorParam} OR firm_types_affected @> $${firmTypesParam})`
            params.push(filters.sector, JSON.stringify([filters.sector]))
          }
        }

        if (filters.impact) {
          if (Array.isArray(filters.impact)) {
            query += ` AND impact_level = ANY($${++paramCount})`
            params.push(filters.impact)
          } else {
            query += ` AND impact_level = $${++paramCount}`
            params.push(filters.impact)
          }
        }

        if (filters.urgency) {
          if (Array.isArray(filters.urgency)) {
            query += ` AND urgency = ANY($${++paramCount})`
            params.push(filters.urgency)
          } else {
            query += ` AND urgency = $${++paramCount}`
            params.push(filters.urgency)
          }
        }

        if (filters.search) {
          query += ` AND (headline ILIKE $${++paramCount} OR summary ILIKE $${paramCount} OR ai_summary ILIKE $${paramCount})`
          const searchTerm = `%${filters.search}%`
          params.push(searchTerm)
        }

        if (filters.startDate) {
          query += ` AND published_date >= $${++paramCount}`
          params.push(filters.startDate)
        }

        if (filters.endDate) {
          query += ` AND published_date <= $${++paramCount}`
          params.push(filters.endDate)
        }

        // Date range filter
        if (filters.range) {
          const dateFilter = this.getDateRangeFilter(filters.range)
          if (dateFilter) {
            query += ` AND published_date >= $${++paramCount}`
            params.push(dateFilter)
          }
        }

        // Country filter (for international page)
        if (filters.country) {
          if (Array.isArray(filters.country)) {
            query += ` AND country = ANY($${++paramCount})`
            params.push(filters.country)
          } else {
            query += ` AND country = $${++paramCount}`
            params.push(filters.country)
          }
        }

        // Region filter (for international page)
        if (filters.region) {
          if (Array.isArray(filters.region)) {
            query += ` AND region = ANY($${++paramCount})`
            params.push(filters.region)
          } else {
            query += ` AND region = $${++paramCount}`
            params.push(filters.region)
          }
        }

        const hasSourceCategoryFilter = Boolean(filters.sourceCategory)
        const excludeBankNews = !filters.includeBankNews && !hasSourceCategoryFilter

        if (excludeBankNews) {
          query += " AND source_category IS DISTINCT FROM 'bank_news'"
        }

        // Source category filter (for bank news page)
        if (filters.sourceCategory) {
          query += ` AND source_category = $${++paramCount}`
          params.push(filters.sourceCategory)
        }

        // Category-specific filters - FIXED VERSION
        if (filters.category && filters.category !== 'all') {
          const categoryFilter = this.getCategoryFilter(filters.category)
          if (categoryFilter.sql) {
            query += ` AND ${categoryFilter.sql}`
            // No need to add params or increment paramCount for most category filters
          }
        }

        query += ' ORDER BY published_date DESC'

        const limit = Number.parseInt(filters.limit, 10)
        if (Number.isFinite(limit)) {
          query += ` LIMIT $${++paramCount}`
          params.push(limit)
        }

        const offset = Number.parseInt(filters.offset, 10)
        if (Number.isFinite(offset) && offset > 0) {
          query += ` OFFSET $${++paramCount}`
          params.push(offset)
        }

        const result = await client.query(query, params)

        // Transform the data for client use
        return result.rows.map(row => this.normalizeUpdateFields({
          ...row,
          fetchedDate: row.published_date || row.created_at,
          publishedDate: row.published_date,
          createdAt: row.created_at,
          impactLevel: row.impact_level,
          ai_tags: row.ai_tags || [],
          primarySectors: row.firm_types_affected || [],
          sectorRelevanceScores: row.sector_relevance_scores || {},
          implementationPhases: row.implementation_phases || [],
          requiredResources: row.required_resources || {}
        }))
      } finally {
        client.release()
      }
    },

    async getEnhancedUpdatesJSON(filters) {
      const updates = await this.loadJSONData(this.updatesFile)
      let filtered = [...updates]

      // Apply filters with array support
      if (filters.authority) {
        if (Array.isArray(filters.authority)) {
          filtered = filtered.filter(u => filters.authority.includes(u.authority))
        } else {
          filtered = filtered.filter(u => u.authority === filters.authority)
        }
      }

      if (filters.sector) {
        if (Array.isArray(filters.sector)) {
          filtered = filtered.filter(u =>
            filters.sector.includes(u.sector) ||
            (u.firm_types_affected && u.firm_types_affected.some(s => filters.sector.includes(s))) ||
            (u.primarySectors && u.primarySectors.some(s => filters.sector.includes(s)))
          )
        } else {
          filtered = filtered.filter(u =>
            u.sector === filters.sector ||
            (u.firm_types_affected && u.firm_types_affected.includes(filters.sector)) ||
            (u.primarySectors && u.primarySectors.includes(filters.sector))
          )
        }
      }

      if (filters.impact) {
        if (Array.isArray(filters.impact)) {
          filtered = filtered.filter(u =>
            filters.impact.includes(u.impactLevel) ||
            filters.impact.includes(u.impact_level)
          )
        } else {
          filtered = filtered.filter(u => u.impactLevel === filters.impact || u.impact_level === filters.impact)
        }
      }

      if (filters.urgency) {
        if (Array.isArray(filters.urgency)) {
          filtered = filtered.filter(u => filters.urgency.includes(u.urgency))
        } else {
          filtered = filtered.filter(u => u.urgency === filters.urgency)
        }
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filtered = filtered.filter(u =>
          (u.headline && u.headline.toLowerCase().includes(searchTerm)) ||
                  (u.summary && u.summary.toLowerCase().includes(searchTerm)) ||
                  (u.ai_summary && u.ai_summary.toLowerCase().includes(searchTerm))
        )
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        filtered = filtered.filter(u => {
          const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
          return !isNaN(updateDate) && updateDate >= startDate
        })
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        filtered = filtered.filter(u => {
          const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
          return !isNaN(updateDate) && updateDate <= endDate
        })
      }

      // Date range filter
      if (filters.range) {
        const dateFilter = this.getDateRangeFilter(filters.range)
        if (dateFilter) {
          filtered = filtered.filter(u => {
            const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
            return updateDate >= dateFilter
          })
        }
      }

      // Country filter (for international page)
      if (filters.country) {
        if (Array.isArray(filters.country)) {
          filtered = filtered.filter(u => filters.country.includes(u.country))
        } else {
          filtered = filtered.filter(u => u.country === filters.country)
        }
      }

      // Region filter (for international page)
      if (filters.region) {
        if (Array.isArray(filters.region)) {
          filtered = filtered.filter(u => filters.region.includes(u.region))
        } else {
          filtered = filtered.filter(u => u.region === filters.region)
        }
      }

      const hasSourceCategoryFilter = Boolean(filters.sourceCategory)
      const excludeBankNews = !filters.includeBankNews && !hasSourceCategoryFilter

      if (excludeBankNews) {
        filtered = filtered.filter(u => (u.source_category || u.sourceCategory) !== 'bank_news')
      }

      // Source category filter (for bank news page)
      if (filters.sourceCategory) {
        filtered = filtered.filter(u => (u.source_category || u.sourceCategory) === filters.sourceCategory)
      }

      // Category filter - FIXED VERSION
      if (filters.category && filters.category !== 'all') {
        filtered = this.applyCategoryFilterJSON(filtered, filters.category)
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.publishedDate || a.published_date || a.fetchedDate || a.createdAt)
        const dateB = new Date(b.publishedDate || b.published_date || b.fetchedDate || b.createdAt)
        return dateB - dateA
      })

      const offset = Number.parseInt(filters.offset, 10)
      const limit = Number.parseInt(filters.limit, 10)
      const normalizedOffset = Number.isFinite(offset) && offset > 0 ? offset : 0
      const normalizedLimit = Number.isFinite(limit) && limit > 0 ? limit : null

      // Apply offset + limit
      if (normalizedOffset || normalizedLimit) {
        filtered = filtered.slice(
          normalizedOffset,
          normalizedLimit ? normalizedOffset + normalizedLimit : undefined
        )
      }

      return filtered.map(update => this.normalizeUpdateFields(update))
    },

    async updateRegulatoryUpdate(url, aiAnalysisData) {
      console.log(`🔄 Updating regulatory update with AI analysis: ${url}`)

      try {
        if (this.fallbackMode) {
          return await this.updateRegulatoryUpdateJSON(url, aiAnalysisData)
        } else {
          return await this.updateRegulatoryUpdatePG(url, aiAnalysisData)
        }
      } catch (error) {
        console.error('❌ Error updating regulatory update with AI data:', error)
        throw error
      }
    },

    async updateRegulatoryUpdatePG(url, aiAnalysisData) {
      const client = await this.pool.connect()
      try {
        const query = `
                  UPDATE regulatory_updates
                  SET
                      ai_summary = $2,
                      content_type = $3,
                      impact_level = $4,
                      urgency = $5,
                      sector = $6,
                      area = $7,
                      business_impact_score = $8,
                      ai_tags = $9,
                      firm_types_affected = $10,
                      compliance_deadline = $11,
                      ai_confidence_score = $12,
                      sector_relevance_scores = $13,
                      implementation_phases = $14,
                      required_resources = $15,
                      updated_at = NOW()
                  WHERE url = $1
                  RETURNING id
              `

        const values = [
          url,
          aiAnalysisData.ai_summary || aiAnalysisData.analysis,
          aiAnalysisData.content_type || 'OTHER',
          aiAnalysisData.impactLevel,
          aiAnalysisData.urgency,
          aiAnalysisData.sector,
          aiAnalysisData.area || 'General Regulation',
          aiAnalysisData.businessImpactScore,
          JSON.stringify(aiAnalysisData.ai_tags || []),
          JSON.stringify(aiAnalysisData.firmTypesAffected || aiAnalysisData.firm_types_affected || []),
          aiAnalysisData.complianceDeadline || aiAnalysisData.compliance_deadline,
          aiAnalysisData.confidence || aiAnalysisData.ai_confidence_score || 0.75,
          JSON.stringify(aiAnalysisData.sectorRelevanceScores || {}),
          JSON.stringify(aiAnalysisData.implementationPhases || aiAnalysisData.implementation_phases || []),
          JSON.stringify(aiAnalysisData.requiredResources || aiAnalysisData.required_resources || {})
        ]

        const result = await client.query(query, values)

        if (result.rows.length > 0) {
          console.log(`✅ Updated regulatory update ${url} with AI analysis`)
          return { success: true, id: result.rows[0].id }
        } else {
          console.warn(`⚠️ No regulatory update found with URL: ${url}`)
          return { success: false, error: 'Update not found' }
        }
      } finally {
        client.release()
      }
    },

    async updateRegulatoryUpdateJSON(url, aiAnalysisData) {
      try {
        let updates = await this.loadJSONData(this.updatesFile)

        if (!Array.isArray(updates)) {
          updates = []
        }

        const updateIndex = updates.findIndex(u => u.url === url)

        if (updateIndex !== -1) {
          // Update the existing update with AI analysis
          updates[updateIndex] = {
            ...updates[updateIndex],
            ai_summary: aiAnalysisData.ai_summary || aiAnalysisData.analysis,
            impactLevel: aiAnalysisData.impactLevel,
            impact_level: aiAnalysisData.impactLevel,
            urgency: aiAnalysisData.urgency,
            sector: aiAnalysisData.sector,
            area: aiAnalysisData.area || 'General Regulation',
            businessImpactScore: aiAnalysisData.businessImpactScore,
            business_impact_score: aiAnalysisData.businessImpactScore,
            ai_tags: aiAnalysisData.ai_tags || [],
            aiTags: aiAnalysisData.aiTags || aiAnalysisData.ai_tags || [],
            primarySectors: aiAnalysisData.primarySectors || [],
            primary_sectors: aiAnalysisData.primary_sectors || aiAnalysisData.primarySectors || [],
            firmTypesAffected: aiAnalysisData.firmTypesAffected || aiAnalysisData.firm_types_affected || [],
            firm_types_affected: aiAnalysisData.firmTypesAffected || aiAnalysisData.firm_types_affected || [],
            complianceDeadline: aiAnalysisData.complianceDeadline || aiAnalysisData.compliance_deadline,
            compliance_deadline: aiAnalysisData.complianceDeadline || aiAnalysisData.compliance_deadline,
            ai_confidence_score: aiAnalysisData.confidence || aiAnalysisData.ai_confidence_score || 0.75,
            sectorRelevanceScores: aiAnalysisData.sectorRelevanceScores || {},
            sector_relevance_scores: aiAnalysisData.sector_relevance_scores || aiAnalysisData.sectorRelevanceScores || {},
            implementationPhases: aiAnalysisData.implementationPhases || aiAnalysisData.implementation_phases || [],
            implementation_phases: aiAnalysisData.implementation_phases || aiAnalysisData.implementationPhases || [],
            requiredResources: aiAnalysisData.requiredResources || aiAnalysisData.required_resources || {},
            required_resources: aiAnalysisData.required_resources || aiAnalysisData.requiredResources || {},
            aiModelUsed: aiAnalysisData.aiModelUsed || updates[updateIndex].aiModelUsed,
            enhancedAt: aiAnalysisData.enhancedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          await this.saveJSONData(this.updatesFile, updates)
          console.log(`✅ Updated regulatory update ${url} with AI analysis (JSON)`)
          return { success: true, id: updates[updateIndex].id }
        } else {
          console.warn(`⚠️ No regulatory update found with URL: ${url}`)
          return { success: false, error: 'Update not found' }
        }
      } catch (error) {
        console.error('❌ Error updating regulatory update in JSON:', error)
        throw error
      }
    },

    async getRecentUpdates(limit = 10, offset = 0) {
      return await this.getEnhancedUpdates({ limit, offset })
    },

    async getAllUpdates() {
      return await this.getEnhancedUpdates({})
    },

    async getUpdateByUrl(url) {
      try {
        const updates = await this.getEnhancedUpdates({})
        return updates.find(u => u.url === url) || null
      } catch (error) {
        console.error('Error getting update by URL:', error)
        return null
      }
    },

    async getUpdateById(id) {
      try {
        const updates = await this.getEnhancedUpdates({})
        return updates.find(u => u.id === parseInt(id) || u.id === id) || null
      } catch (error) {
        console.error('Error getting update by ID:', error)
        return null
      }
    },

    async getUpdatesByAuthority(authority) {
      return await this.getEnhancedUpdates({ authority })
    },

    async deleteUpdate(id) {
      if (this.fallbackMode) {
        // JSON mode - use the actual methods from your dbService
        const updates = await this.loadJSONData(this.updatesFile)
        const index = updates.findIndex(u => u.id === id)
        if (index !== -1) {
          updates.splice(index, 1)
          await this.saveJSONData(this.updatesFile, updates)
          console.log(`✅ Deleted update with ID ${id} from JSON`)
          return true
        }
        return false
      } else {
        // PostgreSQL mode
        const client = await this.pool.connect()
        try {
          const query = 'DELETE FROM regulatory_updates WHERE id = $1'
          await client.query(query, [id])
          console.log(`✅ Deleted update with ID ${id} from PostgreSQL`)
          return true
        } finally {
          client.release()
        }
      }
    },

    async getTotalUpdatesCount() {
      try {
        if (this.fallbackMode) {
          const updates = await this.loadJSONData(this.updatesFile)
          return updates.length
        } else {
          const client = await this.pool.connect()
          try {
            const result = await client.query('SELECT COUNT(*) as count FROM regulatory_updates')
            return parseInt(result.rows[0].count)
          } finally {
            client.release()
          }
        }
      } catch (error) {
        console.error('❌ Error getting total updates count:', error)
        return 0
      }
    },

    async getAnalyzedUpdatesCount() {
      try {
        if (this.fallbackMode) {
          const updates = await this.loadJSONData(this.updatesFile)
          return updates.filter(u =>
            u.ai_summary ||
            u.businessImpactScore ||
            u.business_impact_score ||
            u.aiTags?.length > 0 ||
            u.ai_tags?.length > 0
          ).length
        } else {
          const client = await this.pool.connect()
          try {
            const result = await client.query(`
              SELECT COUNT(*) as count
              FROM regulatory_updates
              WHERE ai_summary IS NOT NULL
                 OR business_impact_score > 0
                 OR jsonb_array_length(ai_tags) > 0
            `)
            return parseInt(result.rows[0].count)
          } finally {
            client.release()
          }
        }
      } catch (error) {
        console.error('❌ Error getting analyzed updates count:', error)
        return 0
      }
    },

    async getUnanalyzedUpdates(limit = 50) {
      try {
        if (this.fallbackMode) {
          const updates = await this.loadJSONData(this.updatesFile)
          return updates.filter(u =>
            !u.ai_summary &&
            !u.businessImpactScore &&
            !u.business_impact_score
          ).slice(0, limit)
        } else {
          const client = await this.pool.connect()
          try {
            const result = await client.query(`
              SELECT * FROM regulatory_updates
              WHERE ai_summary IS NULL
                AND (business_impact_score IS NULL OR business_impact_score = 0)
              ORDER BY published_date DESC
              LIMIT $1
            `, [limit])
            return result.rows
          } finally {
            client.release()
          }
        }
      } catch (error) {
        console.error('❌ Error getting unanalyzed updates:', error)
        return []
      }
    },

    getDateRangeFilter(range) {
      const now = new Date()
      switch (range) {
        case 'today':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate())
        case 'week':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'month':
          return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        case 'quarter':
          return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        default:
          return null
      }
    },

    getCategoryFilter(category) {
      switch (category) {
        case 'high-impact':
          return { sql: "(impact_level = 'Significant' OR business_impact_score >= 7 OR urgency = 'High')" }
        case 'today':
          return { sql: 'DATE(published_date) = CURRENT_DATE' }
        case 'this-week':
          return { sql: "published_date >= CURRENT_DATE - INTERVAL '7 days'" }
        case 'consultations':
          return { sql: "(headline ILIKE '%consultation%' OR area ILIKE '%consultation%' OR ai_tags @> '[\"type:consultation\"]'::jsonb)" }
        case 'enforcement':
          return { sql: "(headline ILIKE '%enforcement%' OR headline ILIKE '%fine%' OR ai_tags @> '[\"type:enforcement\"]'::jsonb)" }
        case 'deadlines':
          return { sql: "(compliance_deadline IS NOT NULL OR headline ILIKE '%deadline%' OR ai_tags @> '[\"has:deadline\"]'::jsonb)" }
        default:
          return { sql: null }
      }
    },

    applyCategoryFilterJSON(updates, category) {
      const now = new Date()
      now.setHours(23, 59, 59, 999) // Include all of today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      todayStart.setHours(0, 0, 0, 0) // Start of today
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      switch (category) {
        case 'high-impact':
          return updates.filter(u =>
            u.impactLevel === 'Significant' ||
                      u.impact_level === 'Significant' ||
                      (u.business_impact_score || 0) >= 7 ||
                      (u.businessImpactScore || 0) >= 7 ||
                      u.urgency === 'High'
          )

        case 'today':
          return updates.filter(u => {
            const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
            return updateDate >= todayStart && updateDate <= now
          })

        case 'this-week':
          return updates.filter(u => {
            const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
            return updateDate >= weekAgo
          })

        case 'consultations':
          return updates.filter(u =>
            (u.headline && u.headline.toLowerCase().includes('consultation')) ||
                      (u.area && u.area.toLowerCase().includes('consultation')) ||
                      (u.ai_tags && Array.isArray(u.ai_tags) && u.ai_tags.includes('type:consultation'))
          )

        case 'enforcement':
          return updates.filter(u =>
            (u.headline && (u.headline.toLowerCase().includes('enforcement') || u.headline.toLowerCase().includes('fine'))) ||
                      (u.ai_tags && Array.isArray(u.ai_tags) && u.ai_tags.includes('type:enforcement'))
          )

        case 'deadlines':
          return updates.filter(u =>
            u.compliance_deadline ||
                      u.complianceDeadline ||
                      (u.headline && u.headline.toLowerCase().includes('deadline')) ||
                      (u.ai_tags && Array.isArray(u.ai_tags) && u.ai_tags.includes('has:deadline'))
          )

        default:
          return updates
      }
    }
  })
}
