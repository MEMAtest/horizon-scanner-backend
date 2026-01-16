// Database-backed Annotation Service
// PostgreSQL primary storage with JSON fallback for serverless compatibility

const crypto = require('crypto')

const ANNOTATIONS_TABLE_QUERY = `
  CREATE TABLE IF NOT EXISTS annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id TEXT NOT NULL,
    author TEXT DEFAULT 'unknown',
    visibility TEXT DEFAULT 'team' CHECK (visibility IN ('public', 'team', 'private')),
    status TEXT DEFAULT 'analyzing' CHECK (status IN ('analyzing', 'reviewed', 'actioned')),
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    assigned_to TEXT[] DEFAULT ARRAY[]::TEXT[],
    linked_resources JSONB DEFAULT '[]'::JSONB,
    origin_page TEXT,
    action_type TEXT,
    annotation_type TEXT DEFAULT 'general',
    priority TEXT,
    persona TEXT,
    report_included BOOLEAN DEFAULT FALSE,
    context JSONB,
    due_date TIMESTAMP WITHOUT TIME ZONE,
    deleted_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
  )
`

const ADD_DUE_DATE_COLUMN_QUERY = `
  ALTER TABLE annotations
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITHOUT TIME ZONE
`

const ADD_DUE_DATE_INDEX_QUERY = `
  CREATE INDEX IF NOT EXISTS idx_annotations_due_date
  ON annotations (due_date)
  WHERE due_date IS NOT NULL AND deleted_at IS NULL
`

// Safe field name mapping to prevent SQL injection via prototype pollution
const FIELD_TO_COLUMN = {
  visibility: 'visibility',
  status: 'status',
  content: 'content',
  tags: 'tags',
  assigned_to: 'assigned_to',
  linked_resources: 'linked_resources',
  origin_page: 'origin_page',
  action_type: 'action_type',
  annotation_type: 'annotation_type',
  priority: 'priority',
  persona: 'persona',
  report_included: 'report_included',
  context: 'context',
  due_date: 'due_date'
}

// Validate and format date safely - returns null for invalid dates
function safeFormatDate(dateInput) {
  if (!dateInput) return null
  try {
    const date = new Date(dateInput)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  } catch (error) {
    return null
  }
}

function normalizeAnnotation(row) {
  if (!row) return null
  return {
    note_id: row.id,
    update_id: row.update_id,
    author: row.author || 'unknown',
    visibility: row.visibility || 'team',
    status: row.status || 'analyzing',
    content: row.content || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    assigned_to: Array.isArray(row.assigned_to) ? row.assigned_to : [],
    linked_resources: Array.isArray(row.linked_resources) ? row.linked_resources : [],
    origin_page: row.origin_page || null,
    action_type: row.action_type || null,
    annotation_type: row.annotation_type || 'general',
    priority: row.priority || null,
    persona: row.persona || null,
    report_included: Boolean(row.report_included),
    context: row.context || null,
    due_date: safeFormatDate(row.due_date),
    deletedAt: safeFormatDate(row.deleted_at),
    created_at: safeFormatDate(row.created_at),
    updated_at: safeFormatDate(row.updated_at)
  }
}

module.exports = function applyAnnotationMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async ensureAnnotationsTable() {
      if (this.fallbackMode) return
      const client = await this.pool.connect()
      try {
        await client.query(ANNOTATIONS_TABLE_QUERY)
        await client.query(ADD_DUE_DATE_COLUMN_QUERY)
        await client.query(ADD_DUE_DATE_INDEX_QUERY)
        console.log('Annotations table ensured')
      } catch (error) {
        console.warn('Failed to create annotations table:', error.message)
      } finally {
        client.release()
      }
    },

    async listAnnotations(filters = {}) {
      await this.initialize()

      if (!this.fallbackMode && this.pool) {
        const client = await this.pool.connect()
        try {
          let query = 'SELECT * FROM annotations WHERE deleted_at IS NULL'
          const params = []
          let paramIndex = 1

          if (filters.updateIds && filters.updateIds.length > 0) {
            query += ` AND update_id = ANY($${paramIndex})`
            params.push(filters.updateIds)
            paramIndex++
          }

          if (filters.visibility && filters.visibility.length > 0) {
            query += ` AND visibility = ANY($${paramIndex})`
            params.push(filters.visibility)
            paramIndex++
          }

          if (filters.status && filters.status.length > 0) {
            query += ` AND status = ANY($${paramIndex})`
            params.push(filters.status)
            paramIndex++
          }

          if (filters.since) {
            query += ` AND created_at >= $${paramIndex}`
            params.push(new Date(filters.since).toISOString())
            paramIndex++
          }

          if (filters.dueBefore) {
            query += ` AND due_date IS NOT NULL AND due_date <= $${paramIndex}`
            params.push(new Date(filters.dueBefore).toISOString())
            paramIndex++
          }

          if (filters.hasDueDate) {
            query += ' AND due_date IS NOT NULL'
          }

          query += ' ORDER BY created_at DESC'

          if (filters.limit) {
            query += ` LIMIT $${paramIndex}`
            params.push(filters.limit)
          }

          const result = await client.query(query, params)
          return result.rows.map(normalizeAnnotation)
        } catch (error) {
          console.warn('Annotations query failed, using JSON fallback:', error.message)
          return this.listAnnotationsJSON(filters)
        } finally {
          client.release()
        }
      }

      return this.listAnnotationsJSON(filters)
    },

    async listAnnotationsJSON(filters = {}) {
      const workspace = await this.loadWorkspaceState()
      const annotations = Array.isArray(workspace.annotations) ? workspace.annotations : []

      return annotations.filter(annotation => {
        if (annotation.deletedAt) return false

        if (filters.updateIds && filters.updateIds.length > 0) {
          if (!filters.updateIds.includes(annotation.update_id)) return false
        }

        if (filters.visibility && filters.visibility.length > 0) {
          if (!filters.visibility.includes(annotation.visibility)) return false
        }

        if (filters.status && filters.status.length > 0) {
          if (!filters.status.includes(annotation.status)) return false
        }

        if (filters.since) {
          const since = new Date(filters.since)
          if (!Number.isNaN(since.getTime())) {
            const created = new Date(annotation.created_at || 0)
            if (created < since) return false
          }
        }

        if (filters.dueBefore && annotation.due_date) {
          const dueBefore = new Date(filters.dueBefore)
          const dueDate = new Date(annotation.due_date)
          if (dueDate > dueBefore) return false
        }

        if (filters.hasDueDate && !annotation.due_date) {
          return false
        }

        return true
      })
    },

    async addAnnotation(note) {
      await this.initialize()

      const now = new Date().toISOString()
      const noteId = crypto.randomUUID()

      const annotation = {
        note_id: noteId,
        update_id: note.update_id,
        author: note.author || 'unknown',
        visibility: note.visibility || 'team',
        status: note.status || 'analyzing',
        content: note.content || '',
        tags: Array.isArray(note.tags) ? note.tags : [],
        assigned_to: Array.isArray(note.assigned_to) ? note.assigned_to : [],
        linked_resources: Array.isArray(note.linked_resources) ? note.linked_resources : [],
        origin_page: note.origin_page || null,
        action_type: note.action_type || null,
        annotation_type: typeof note.annotation_type === 'string' && note.annotation_type.trim()
          ? note.annotation_type.trim()
          : 'general',
        priority: note.priority || null,
        persona: note.persona || null,
        report_included: typeof note.report_included === 'boolean' ? note.report_included : false,
        context: note.context || null,
        due_date: safeFormatDate(note.due_date),
        created_at: now,
        updated_at: now
      }

      if (!this.fallbackMode && this.pool) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            INSERT INTO annotations (
              id, update_id, author, visibility, status, content,
              tags, assigned_to, linked_resources, origin_page, action_type,
              annotation_type, priority, persona, report_included, context,
              due_date, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9::jsonb, $10, $11,
              $12, $13, $14, $15, $16::jsonb,
              $17, $18, $19
            ) RETURNING *
          `, [
            noteId,
            annotation.update_id,
            annotation.author,
            annotation.visibility,
            annotation.status,
            annotation.content,
            annotation.tags,
            annotation.assigned_to,
            JSON.stringify(annotation.linked_resources),
            annotation.origin_page,
            annotation.action_type,
            annotation.annotation_type,
            annotation.priority,
            annotation.persona,
            annotation.report_included,
            annotation.context ? JSON.stringify(annotation.context) : null,
            annotation.due_date,
            annotation.created_at,
            annotation.updated_at
          ])

          return normalizeAnnotation(result.rows[0])
        } catch (error) {
          console.warn('Annotation insert failed, using JSON fallback:', error.message)
          return this.addAnnotationJSON(annotation)
        } finally {
          client.release()
        }
      }

      return this.addAnnotationJSON(annotation)
    },

    async addAnnotationJSON(annotation) {
      const workspace = await this.loadWorkspaceState()
      if (!Array.isArray(workspace.annotations)) {
        workspace.annotations = []
      }
      workspace.annotations.push(annotation)
      await this.saveWorkspaceState(workspace)
      return annotation
    },

    async updateAnnotation(noteId, updates = {}) {
      await this.initialize()

      if (!this.fallbackMode && this.pool) {
        const client = await this.pool.connect()
        try {
          // Build dynamic update query using safe field mapping
          const setClauses = ['updated_at = NOW()']
          const params = [noteId]
          let paramIndex = 2

          // Only process fields that have a safe column mapping
          for (const field of Object.keys(FIELD_TO_COLUMN)) {
            if (!Object.prototype.hasOwnProperty.call(updates, field)) continue

            const columnName = FIELD_TO_COLUMN[field]
            if (!columnName) continue // Extra safety - skip unmapped fields

            let value = updates[field]

            // Handle special types
            if (field === 'tags' || field === 'assigned_to') {
              value = Array.isArray(value) ? value : []
              setClauses.push(`${columnName} = $${paramIndex}`)
            } else if (field === 'linked_resources' || field === 'context') {
              setClauses.push(`${columnName} = $${paramIndex}::jsonb`)
              value = JSON.stringify(value || (field === 'linked_resources' ? [] : null))
            } else if (field === 'report_included') {
              setClauses.push(`${columnName} = $${paramIndex}`)
              value = Boolean(value)
            } else if (field === 'due_date') {
              setClauses.push(`${columnName} = $${paramIndex}`)
              value = safeFormatDate(value)
            } else {
              setClauses.push(`${columnName} = $${paramIndex}`)
            }

            params.push(value)
            paramIndex++
          }

          const query = `
            UPDATE annotations
            SET ${setClauses.join(', ')}
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
          `

          const result = await client.query(query, params)
          if (result.rows.length === 0) return null
          return normalizeAnnotation(result.rows[0])
        } catch (error) {
          console.warn('Annotation update failed, using JSON fallback:', error.message)
          return this.updateAnnotationJSON(noteId, updates)
        } finally {
          client.release()
        }
      }

      return this.updateAnnotationJSON(noteId, updates)
    },

    async updateAnnotationJSON(noteId, updates = {}) {
      const workspace = await this.loadWorkspaceState()
      if (!Array.isArray(workspace.annotations)) {
        workspace.annotations = []
      }

      const index = workspace.annotations.findIndex(a => a.note_id === noteId)
      if (index === -1) return null

      const existing = workspace.annotations[index]
      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Normalize array fields
      if (updates.tags) {
        updated.tags = Array.isArray(updates.tags) ? updates.tags : []
      }
      if (updates.assigned_to) {
        updated.assigned_to = Array.isArray(updates.assigned_to) ? updates.assigned_to : []
      }
      if (updates.linked_resources) {
        updated.linked_resources = Array.isArray(updates.linked_resources) ? updates.linked_resources : []
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'report_included')) {
        updated.report_included = Boolean(updates.report_included)
      }
      if (Object.prototype.hasOwnProperty.call(updates, 'due_date')) {
        updated.due_date = safeFormatDate(updates.due_date)
      }

      workspace.annotations[index] = updated
      await this.saveWorkspaceState(workspace)
      return updated
    },

    async deleteAnnotation(noteId) {
      await this.initialize()

      if (!this.fallbackMode && this.pool) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            UPDATE annotations
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
          `, [noteId])

          return result.rowCount > 0
        } catch (error) {
          console.warn('Annotation delete failed, using JSON fallback:', error.message)
          return this.deleteAnnotationJSON(noteId)
        } finally {
          client.release()
        }
      }

      return this.deleteAnnotationJSON(noteId)
    },

    async deleteAnnotationJSON(noteId) {
      const workspace = await this.loadWorkspaceState()
      if (!Array.isArray(workspace.annotations)) {
        workspace.annotations = []
      }

      const index = workspace.annotations.findIndex(a => a.note_id === noteId)
      if (index === -1) return false

      workspace.annotations[index] = {
        ...workspace.annotations[index],
        deletedAt: new Date().toISOString()
      }

      await this.saveWorkspaceState(workspace)
      return true
    },

    async getAnnotation(noteId) {
      await this.initialize()

      if (!this.fallbackMode && this.pool) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            'SELECT * FROM annotations WHERE id = $1 AND deleted_at IS NULL',
            [noteId]
          )
          return result.rows.length ? normalizeAnnotation(result.rows[0]) : null
        } catch (error) {
          console.warn('Annotation get failed, using JSON fallback:', error.message)
          return this.getAnnotationJSON(noteId)
        } finally {
          client.release()
        }
      }

      return this.getAnnotationJSON(noteId)
    },

    async getAnnotationJSON(noteId) {
      const workspace = await this.loadWorkspaceState()
      const annotations = Array.isArray(workspace.annotations) ? workspace.annotations : []
      const annotation = annotations.find(a => a.note_id === noteId && !a.deletedAt)
      return annotation || null
    },

    // Get annotations with upcoming due dates
    async getUpcomingDueAnnotations(daysAhead = 7) {
      const dueBefore = new Date()
      dueBefore.setDate(dueBefore.getDate() + daysAhead)

      return this.listAnnotations({
        hasDueDate: true,
        dueBefore: dueBefore.toISOString(),
        status: ['analyzing', 'reviewed'] // Not actioned
      })
    },

    // Get overdue annotations
    async getOverdueAnnotations() {
      const now = new Date()

      return this.listAnnotations({
        hasDueDate: true,
        dueBefore: now.toISOString(),
        status: ['analyzing', 'reviewed']
      })
    }
  })
}
