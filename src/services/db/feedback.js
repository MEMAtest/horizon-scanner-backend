const fs = require('fs').promises

function toIso(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeRow(row) {
  if (!row) return null
  return {
    id: row.id,
    profileId: row.profile_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    weight: Number(row.weight || 0),
    lastEventAt: toIso(row.last_event_at),
    windowCounts: row.window_counts && typeof row.window_counts === 'object' ? row.window_counts : {},
    updatedAt: toIso(row.updated_at)
  }
}

function sanitizeAdjustments(adjustments = []) {
  return adjustments
    .map(item => {
      if (!item || typeof item !== 'object') return null
      const entityType = String(item.entityType || '').trim().toLowerCase()
      const entityId = String(item.entityId || '').trim()
      if (!entityType || !entityId) return null
      const weightDelta = Number(item.weightDelta || 0)
      if (!Number.isFinite(weightDelta)) return null
      const occurrences = Number(item.occurrences || 0)
      const lastEventAt = toIso(item.lastEventAt || new Date())
      const windowCounts = item.windowCounts && typeof item.windowCounts === 'object'
        ? { ...item.windowCounts }
        : {}
      if (weightDelta === 0 && occurrences === 0) return null
      return {
        entityType,
        entityId,
        weightDelta,
        occurrences,
        lastEventAt,
        windowCounts
      }
    })
    .filter(Boolean)
}

function mergeWindowCounts(existing = {}, incoming = {}) {
  const output = { ...existing }
  Object.keys(incoming).forEach(key => {
    const value = Number(incoming[key] || 0)
    if (!Number.isFinite(value)) return
    output[key] = Number(output[key] || 0) + value
  })
  return output
}

module.exports = function applyFeedbackMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async applyFeedbackAdjustments(profileId, adjustments = []) {
      await this.initialize()
      const sanitizedAdjustments = sanitizeAdjustments(adjustments)
      if (!sanitizedAdjustments.length) return []
      const profileKey = String(profileId || '').trim()
      if (!profileKey) {
        throw new Error('Profile ID required for feedback adjustments')
      }

      if (this.usePostgres) {
        const client = await this.pool.connect()
        const updatedRows = []
        try {
          await client.query('BEGIN')
          for (const adjustment of sanitizedAdjustments) {
            const existingResult = await client.query(
              `
                SELECT id, weight, last_event_at, window_counts, updated_at
                FROM profile_feedback_scores
                WHERE profile_id = $1 AND entity_type = $2 AND entity_id = $3
                FOR UPDATE
              `,
              [profileKey, adjustment.entityType, adjustment.entityId]
            )

            const existing = existingResult.rows[0]
            const currentWeight = existing ? Number(existing.weight || 0) : 0
            const newWeight = currentWeight + adjustment.weightDelta
            const prevCounts = existing && typeof existing.window_counts === 'object'
              ? existing.window_counts
              : {}
            const newCounts = mergeWindowCounts(prevCounts, {
              total: adjustment.occurrences || 0,
              ...adjustment.windowCounts
            })
            const lastEventAt = (() => {
              const previous = existing ? toIso(existing.last_event_at) : null
              const candidate = adjustment.lastEventAt
              if (!previous) return candidate
              if (!candidate) return previous
              return new Date(candidate) >= new Date(previous) ? candidate : previous
            })()

            const upsertResult = await client.query(
              `
                INSERT INTO profile_feedback_scores (
                  profile_id,
                  entity_type,
                  entity_id,
                  weight,
                  last_event_at,
                  window_counts,
                  updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
                ON CONFLICT (profile_id, entity_type, entity_id)
                DO UPDATE SET
                  weight = EXCLUDED.weight,
                  last_event_at = EXCLUDED.last_event_at,
                  window_counts = EXCLUDED.window_counts,
                  updated_at = NOW()
                RETURNING *
              `,
              [
                profileKey,
                adjustment.entityType,
                adjustment.entityId,
                newWeight,
                lastEventAt,
                JSON.stringify(newCounts)
              ]
            )

            updatedRows.push(normalizeRow(upsertResult.rows[0]))
          }
          await client.query('COMMIT')
          return updatedRows
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON for feedback adjustments:', error.message)
          return this.applyFeedbackAdjustmentsJSON(profileKey, sanitizedAdjustments)
        } finally {
          client.release()
        }
      }

      return this.applyFeedbackAdjustmentsJSON(profileKey, sanitizedAdjustments)
    },

    async listFeedbackScores(profileId) {
      await this.initialize()
      const profileKey = String(profileId || '').trim()
      if (!profileKey) return []

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `
              SELECT *
              FROM profile_feedback_scores
              WHERE profile_id = $1
              ORDER BY weight DESC
            `,
            [profileKey]
          )
          return result.rows.map(normalizeRow)
        } catch (error) {
          console.warn('📊 Falling back to JSON for listing feedback scores:', error.message)
          return this.listFeedbackScoresJSON(profileKey)
        } finally {
          client.release()
        }
      }

      return this.listFeedbackScoresJSON(profileKey)
    },

    // ---------------------------------------------------------------------
    // JSON fallback helpers
    // ---------------------------------------------------------------------
    async loadFeedbackScoresJSON() {
      try {
        const raw = await fs.readFile(this.profileFeedbackFile, 'utf8')
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        if (error.code === 'ENOENT') return []
        throw error
      }
    },

    async saveFeedbackScoresJSON(scores) {
      await fs.writeFile(this.profileFeedbackFile, JSON.stringify(scores, null, 2))
    },

    async applyFeedbackAdjustmentsJSON(profileId, adjustments) {
      const scores = await this.loadFeedbackScoresJSON()
      const now = new Date().toISOString()
      const updated = scores.filter(score => score.profileId !== profileId)

      const existingForProfile = scores.filter(score => score.profileId === profileId)
      const indexMap = new Map(existingForProfile.map(score => [`${score.profileId}:${score.entityType}:${score.entityId}`, score]))

      adjustments.forEach(adjustment => {
        const key = `${profileId}:${adjustment.entityType}:${adjustment.entityId}`
        const existing = indexMap.get(key)
        const base = existing
          ? {
              weight: Number(existing.weight || 0),
              lastEventAt: existing.lastEventAt,
              windowCounts: existing.windowCounts && typeof existing.windowCounts === 'object' ? existing.windowCounts : {}
            }
          : { weight: 0, lastEventAt: null, windowCounts: {} }

        const newWeight = base.weight + adjustment.weightDelta
        const mergedCounts = mergeWindowCounts(base.windowCounts, {
          total: adjustment.occurrences || 0,
          ...adjustment.windowCounts
        })
        const lastEventAt = (() => {
          const previous = base.lastEventAt ? new Date(base.lastEventAt) : null
          const candidate = adjustment.lastEventAt ? new Date(adjustment.lastEventAt) : null
          if (!previous) return candidate ? candidate.toISOString() : null
          if (!candidate) return previous.toISOString()
          return candidate >= previous ? candidate.toISOString() : previous.toISOString()
        })()

        const record = {
          id: existing && existing.id ? existing.id : `feedback-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          profileId,
          entityType: adjustment.entityType,
          entityId: adjustment.entityId,
          weight: newWeight,
          lastEventAt,
          windowCounts: mergedCounts,
          updatedAt: now
        }

        indexMap.set(key, record)
      })

      const merged = [
        ...updated,
        ...Array.from(indexMap.values())
      ]

      await this.saveFeedbackScoresJSON(merged)
      return Array.from(indexMap.values())
    },

    async listFeedbackScoresJSON(profileId) {
      const scores = await this.loadFeedbackScoresJSON()
      return scores.filter(score => score.profileId === profileId).map(score => ({ ...score }))
    }
  })
}
