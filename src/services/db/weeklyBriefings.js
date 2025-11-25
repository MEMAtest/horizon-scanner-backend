function applyWeeklyBriefingsMethods(ServiceClass) {
  ServiceClass.prototype.saveWeeklyBriefing = async function(briefing) {
    if (!this.pool) {
      console.warn('[DB] Pool not available, cannot save weekly briefing')
      return false
    }

    try {
      const query = `
        INSERT INTO weekly_briefings (
          id, generated_at, date_range_start, date_range_end,
          briefing_data, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          briefing_data = EXCLUDED.briefing_data,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `

      const values = [
        briefing.id,
        briefing.generatedAt || new Date().toISOString(),
        briefing.dateRange?.start || null,
        briefing.dateRange?.end || null,
        JSON.stringify(briefing),
        JSON.stringify(briefing.metadata || {})
      ]

      await this.pool.query(query, values)
      console.log('[DB] ✅ Saved weekly briefing:', briefing.id)
      return true
    } catch (error) {
      console.error('[DB] Failed to save weekly briefing:', error)
      return false
    }
  }

  ServiceClass.prototype.getWeeklyBriefing = async function(briefingId) {
    if (!this.pool) {
      console.warn('[DB] Pool not available')
      return null
    }

    try {
      const query = `
        SELECT briefing_data
        FROM weekly_briefings
        WHERE id = $1
      `

      const result = await this.pool.query(query, [briefingId])

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0].briefing_data
    } catch (error) {
      console.error('[DB] Failed to get weekly briefing:', error)
      return null
    }
  }

  ServiceClass.prototype.getLatestWeeklyBriefing = async function() {
    if (!this.pool) {
      console.warn('[DB] Pool not available')
      return null
    }

    try {
      const query = `
        SELECT briefing_data
        FROM weekly_briefings
        ORDER BY generated_at DESC
        LIMIT 1
      `

      const result = await this.pool.query(query)

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0].briefing_data
    } catch (error) {
      console.error('[DB] Failed to get latest weekly briefing:', error)
      return null
    }
  }

  ServiceClass.prototype.listWeeklyBriefings = async function(limit = 10) {
    if (!this.pool) {
      console.warn('[DB] Pool not available')
      return []
    }

    try {
      const query = `
        SELECT
          id,
          generated_at,
          date_range_start,
          date_range_end,
          metadata
        FROM weekly_briefings
        ORDER BY generated_at DESC
        LIMIT $1
      `

      const result = await this.pool.query(query, [limit])

      return result.rows.map(row => ({
        id: row.id,
        generatedAt: row.generated_at,
        dateRange: {
          start: row.date_range_start,
          end: row.date_range_end
        },
        metadata: row.metadata || {}
      }))
    } catch (error) {
      console.error('[DB] Failed to list weekly briefings:', error)
      return []
    }
  }
}

module.exports = applyWeeklyBriefingsMethods
