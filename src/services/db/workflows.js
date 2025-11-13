const fs = require('fs').promises

function toIso(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function sanitizeSources(sources) {
  if (!sources) return []
  if (Array.isArray(sources)) {
    return sources
      .map(source => ({
        label: String(source.label || source.title || source).trim(),
        url: source.url ? String(source.url).trim() : null
      }))
      .filter(entry => entry.label)
  }
  if (typeof sources === 'string') {
    return sources
      .split(/\n+/)
      .map(line => ({ label: line.trim(), url: null }))
      .filter(entry => entry.label)
  }
  return []
}

function normalizeRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    title: row.title,
    summary: row.summary,
    sources: Array.isArray(row.sources) ? row.sources : [],
    rating: row.rating,
    personas: Array.isArray(row.personas) ? row.personas : [],
    needsReview: row.needs_review,
    alignsPolicy: row.aligns_policy,
    policyReference: row.policy_reference,
    status: row.status || 'open',
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

module.exports = function applyWorkflowMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async listWorkflows(options = {}) {
      await this.initialize()
      const userId = String(options.userId || 'default')
      const statusFilter = options.status
      const limit = Number.isFinite(options.limit) ? Math.min(100, Math.max(1, options.limit)) : 20

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const params = [userId]
          let whereClause = 'WHERE user_id = $1'
          if (statusFilter) {
            params.push(statusFilter)
            whereClause += ` AND status = $${params.length}`
          }
          params.push(limit)
          const result = await client.query(
            `SELECT * FROM profile_workflows ${whereClause} ORDER BY created_at DESC LIMIT $${params.length}`,
            params
          )
          return result.rows.map(normalizeRow)
        } catch (error) {
          console.warn('📊 Falling back to JSON for listWorkflows:', error.message)
          return this.listWorkflowsJSON(userId, statusFilter, limit)
        } finally {
          client.release()
        }
      }

      return this.listWorkflowsJSON(userId, statusFilter, limit)
    },

    async createWorkflow(entry) {
      await this.initialize()
      const payload = {
        userId: String(entry.userId || 'default'),
        profileId: entry.profileId || null,
        title: String(entry.title || '').trim(),
        summary: String(entry.summary || '').trim(),
        sources: sanitizeSources(entry.sources),
        rating: Number.isFinite(entry.rating) ? Math.round(entry.rating) : null,
        personas: Array.isArray(entry.personas) ? entry.personas.map(value => String(value).trim()).filter(Boolean) : [],
        needsReview: Boolean(entry.needsReview),
        alignsPolicy: Boolean(entry.alignsPolicy),
        policyReference: entry.policyReference ? String(entry.policyReference).trim() : null,
        metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}
      }

      if (!payload.title) {
        throw new Error('Workflow title is required')
      }

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `INSERT INTO profile_workflows (
              user_id,
              profile_id,
              title,
              summary,
              sources,
              rating,
              personas,
              needs_review,
              aligns_policy,
              policy_reference,
              metadata,
              status,
              created_at,
              updated_at
            ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11::jsonb,'open',NOW(),NOW()) RETURNING *`,
            [
              payload.userId,
              payload.profileId,
              payload.title,
              payload.summary,
              JSON.stringify(payload.sources),
              payload.rating,
              payload.personas,
              payload.needsReview,
              payload.alignsPolicy,
              payload.policyReference,
              JSON.stringify(payload.metadata)
            ]
          )
          return normalizeRow(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON for createWorkflow:', error.message)
          return this.createWorkflowJSON(payload)
        } finally {
          client.release()
        }
      }

      return this.createWorkflowJSON(payload)
    },

    async updateWorkflowStatus(id, userId, status) {
      await this.initialize()
      const workflowId = Number(id)
      const userKey = String(userId || 'default')
      const nextStatus = status === 'closed' ? 'closed' : 'open'

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `UPDATE profile_workflows SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
            [nextStatus, workflowId, userKey]
          )
          return result.rows.length ? normalizeRow(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON for updateWorkflowStatus:', error.message)
          return this.updateWorkflowStatusJSON(workflowId, userKey, nextStatus)
        } finally {
          client.release()
        }
      }

      return this.updateWorkflowStatusJSON(workflowId, userKey, nextStatus)
    },

    // JSON helpers ---------------------------------------------------------
    async loadWorkflowJSON() {
      try {
        const raw = await fs.readFile(this.profileWorkflowsFile, 'utf8')
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        if (error.code === 'ENOENT') return []
        throw error
      }
    },

    async saveWorkflowJSON(records) {
      await fs.writeFile(this.profileWorkflowsFile, JSON.stringify(records, null, 2))
    },

    async listWorkflowsJSON(userId, statusFilter, limit) {
      const records = await this.loadWorkflowJSON()
      return records
        .filter(record => record.userId === userId && (!statusFilter || record.status === statusFilter))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
    },

    async createWorkflowJSON(payload) {
      const records = await this.loadWorkflowJSON()
      const now = new Date().toISOString()
      const record = {
        id: records.length ? Math.max(...records.map(item => Number(item.id) || 0)) + 1 : 1,
        userId: payload.userId,
        profileId: payload.profileId,
        title: payload.title,
        summary: payload.summary,
        sources: payload.sources,
        rating: payload.rating,
        personas: payload.personas,
        needsReview: payload.needsReview,
        alignsPolicy: payload.alignsPolicy,
        policyReference: payload.policyReference,
        status: 'open',
        metadata: payload.metadata,
        createdAt: now,
        updatedAt: now
      }
      records.push(record)
      await this.saveWorkflowJSON(records)
      return record
    },

    async updateWorkflowStatusJSON(id, userId, status) {
      const records = await this.loadWorkflowJSON()
      const target = records.find(record => record.id === id && record.userId === userId)
      if (!target) return null
      target.status = status
      target.updatedAt = new Date().toISOString()
      await this.saveWorkflowJSON(records)
      return target
    }
  })
}
