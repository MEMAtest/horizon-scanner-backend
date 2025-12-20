const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizeWorkflowTemplate(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || null,
    stages: row.stages || [],
    isDefault: row.is_default === true,
    isActive: row.is_active !== false,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function normalizeRegulatoryChangeItem(row) {
  if (!row) return null
  const identifiedDate = toIso(row.identified_date)
  const targetCompletionDate = toIso(row.target_completion_date)
  const actualCompletionDate = toIso(row.actual_completion_date)
  const createdAt = toIso(row.created_at)
  const updatedAt = toIso(row.updated_at)
  const stageHistory = row.stage_history || []
  const summary = row.summary || null

  return {
    id: row.id,
    userId: row.user_id,
    businessLineProfileId: row.business_line_profile_id,
    workflowTemplateId: row.workflow_template_id,
    workflow_template_id: row.workflow_template_id,
    regulatoryUpdateId: row.regulatory_update_id,
    regulatory_update_id: row.regulatory_update_id,
    regulatoryUpdateUrl: row.regulatory_update_url,
    regulatory_update_url: row.regulatory_update_url,
    source_url: row.regulatory_update_url,
    title: row.title,
    summary,
    description: summary,
    authority: row.authority || null,
    impactLevel: row.impact_level || null,
    impact_level: row.impact_level || null,
    currentStageId: row.current_stage_id || null,
    current_stage_id: row.current_stage_id || null,
    current_stage: row.current_stage_id || null,  // Alias for service layer compatibility
    stageHistory,
    stage_history: stageHistory,
    identifiedDate,
    identified_date: identifiedDate,
    targetCompletionDate,
    target_completion_date: targetCompletionDate,
    due_date: targetCompletionDate,
    actualCompletionDate,
    actual_completion_date: actualCompletionDate,
    completed_at: actualCompletionDate,
    status: row.status || 'active',
    priority: row.priority || 'medium',
    tags: Array.isArray(row.tags) ? row.tags : [],
    isActive: row.is_active !== false,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
    // New linking fields for dossiers, policies, and watch lists
    linkedDossierIds: row.linked_dossier_ids || [],
    linkedPolicyIds: row.linked_policy_ids || [],
    watchListMatchIds: row.watch_list_match_ids || []
  }
}

function normalizeRegulatoryChangeAction(row) {
  if (!row) return null
  return {
    id: row.id,
    changeItemId: row.change_item_id,
    userId: row.user_id,
    actionType: row.action_type,
    stageId: row.stage_id || null,
    title: row.title || null,
    description: row.description || null,
    fromStageId: row.from_stage_id || null,
    toStageId: row.to_stage_id || null,
    attachments: row.attachments || [],
    metadata: row.metadata || {},
    createdAt: toIso(row.created_at)
  }
}

function normalizeRegulatoryChangeItemInput(itemData = {}) {
  const source = itemData && typeof itemData === 'object' ? itemData : {}
  const stageHistory = source.stageHistory || source.stage_history

  return {
    businessLineProfileId: source.businessLineProfileId || source.business_line_profile_id || null,
    workflowTemplateId: source.workflowTemplateId || source.workflow_template_id || null,
    regulatoryUpdateId: source.regulatoryUpdateId || source.regulatory_update_id || source.source_update_id || null,
    regulatoryUpdateUrl: source.regulatoryUpdateUrl || source.regulatory_update_url || source.source_url || null,
    title: source.title,
    summary: source.summary || source.description || null,
    authority: source.authority || null,
    impactLevel: source.impactLevel || source.impact_level || null,
    currentStageId: source.currentStageId || source.current_stage_id || source.current_stage || null,
    stageHistory: Array.isArray(stageHistory) ? stageHistory : [],
    identifiedDate: source.identifiedDate || source.identified_date || null,
    targetCompletionDate: source.targetCompletionDate || source.due_date || source.target_completion_date || null,
    status: source.status || 'active',
    priority: source.priority || 'medium',
    tags: Array.isArray(source.tags) ? source.tags : [],
    linkedDossierIds: source.linkedDossierIds || source.linked_dossier_ids || [],
    linkedPolicyIds: source.linkedPolicyIds || source.linked_policy_ids || [],
    watchListMatchIds: source.watchListMatchIds || source.watch_list_match_ids || []
  }
}

function decorateRegulatoryChangeItem(item) {
  if (!item || typeof item !== 'object') return null

  const summary = item.summary || item.description || null
  const workflowTemplateId = item.workflowTemplateId || item.workflow_template_id || null
  const regulatoryUpdateId = item.regulatoryUpdateId || item.regulatory_update_id || item.source_update_id || null
  const regulatoryUpdateUrl = item.regulatoryUpdateUrl || item.regulatory_update_url || item.source_url || null
  const impactLevel = item.impactLevel || item.impact_level || null
  const currentStageId = item.currentStageId || item.current_stage_id || item.current_stage || null
  const stageHistory = Array.isArray(item.stageHistory)
    ? item.stageHistory
    : Array.isArray(item.stage_history)
      ? item.stage_history
      : []

  const identifiedDate = toIso(item.identifiedDate || item.identified_date) || item.identifiedDate || item.identified_date || null
  const targetCompletionDate = toIso(item.targetCompletionDate || item.due_date || item.target_completion_date)
    || item.targetCompletionDate
    || item.due_date
    || item.target_completion_date
    || null
  const actualCompletionDate = toIso(item.actualCompletionDate || item.actual_completion_date || item.completed_at)
    || item.actualCompletionDate
    || item.actual_completion_date
    || item.completed_at
    || null
  const createdAt = toIso(item.createdAt || item.created_at) || item.createdAt || item.created_at || null
  const updatedAt = toIso(item.updatedAt || item.updated_at) || item.updatedAt || item.updated_at || null

  return {
    ...item,
    workflowTemplateId,
    workflow_template_id: workflowTemplateId,
    regulatoryUpdateId,
    regulatory_update_id: regulatoryUpdateId,
    regulatoryUpdateUrl,
    regulatory_update_url: regulatoryUpdateUrl,
    source_url: regulatoryUpdateUrl,
    summary,
    description: summary,
    impactLevel,
    impact_level: impactLevel,
    currentStageId,
    current_stage_id: currentStageId,
    current_stage: item.current_stage || currentStageId || null,
    stageHistory,
    stage_history: stageHistory,
    identifiedDate,
    identified_date: identifiedDate,
    targetCompletionDate,
    target_completion_date: targetCompletionDate,
    due_date: targetCompletionDate,
    actualCompletionDate,
    actual_completion_date: actualCompletionDate,
    completed_at: actualCompletionDate,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt
  }
}

module.exports = function applyRegulatoryChangesMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    workflowTemplatesFile: path.join(__dirname, '../../data/workflow_templates.json'),
    regulatoryChangeItemsFile: path.join(__dirname, '../../data/regulatory_change_items.json'),
    regulatoryChangeActionsFile: path.join(__dirname, '../../data/regulatory_change_actions.json'),

    async ensureRegulatoryChangesTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        // Workflow Stage Templates table
        await client.query(`
          CREATE TABLE IF NOT EXISTS workflow_stage_templates (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            stages JSONB NOT NULL DEFAULT '[]',
            is_default BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_workflow_stage_templates_user
          ON workflow_stage_templates(user_id, is_active)
        `)

        // Regulatory Change Items table
        await client.query(`
          CREATE TABLE IF NOT EXISTS regulatory_change_items (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            business_line_profile_id BIGINT,
            workflow_template_id BIGINT,
            regulatory_update_id BIGINT,
            regulatory_update_url TEXT,
            title VARCHAR(500) NOT NULL,
            summary TEXT,
            authority VARCHAR(100),
            impact_level VARCHAR(20),
            current_stage_id VARCHAR(100),
            stage_history JSONB DEFAULT '[]',
            identified_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            target_completion_date TIMESTAMP WITHOUT TIME ZONE,
            actual_completion_date TIMESTAMP WITHOUT TIME ZONE,
            status VARCHAR(30) DEFAULT 'active',
            priority VARCHAR(20) DEFAULT 'medium',
            tags TEXT[] DEFAULT ARRAY[]::TEXT[],
            linked_dossier_ids UUID[] DEFAULT ARRAY[]::UUID[],
            linked_policy_ids UUID[] DEFAULT ARRAY[]::UUID[],
            watch_list_match_ids UUID[] DEFAULT ARRAY[]::UUID[],
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

        // Add linking columns if they don't exist (for existing databases)
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regulatory_change_items' AND column_name = 'linked_dossier_ids') THEN
              ALTER TABLE regulatory_change_items ADD COLUMN linked_dossier_ids UUID[] DEFAULT ARRAY[]::UUID[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regulatory_change_items' AND column_name = 'linked_policy_ids') THEN
              ALTER TABLE regulatory_change_items ADD COLUMN linked_policy_ids UUID[] DEFAULT ARRAY[]::UUID[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regulatory_change_items' AND column_name = 'watch_list_match_ids') THEN
              ALTER TABLE regulatory_change_items ADD COLUMN watch_list_match_ids UUID[] DEFAULT ARRAY[]::UUID[];
            END IF;
          END $$;
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_items_user
          ON regulatory_change_items(user_id, status)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_items_profile
          ON regulatory_change_items(business_line_profile_id)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_items_stage
          ON regulatory_change_items(current_stage_id)
        `)

        // Regulatory Change Actions table (audit trail)
        await client.query(`
          CREATE TABLE IF NOT EXISTS regulatory_change_actions (
            id BIGSERIAL PRIMARY KEY,
            change_item_id BIGINT NOT NULL,
            user_id TEXT NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            stage_id VARCHAR(100),
            title VARCHAR(255),
            description TEXT,
            from_stage_id VARCHAR(100),
            to_stage_id VARCHAR(100),
            attachments JSONB DEFAULT '[]',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_actions_item
          ON regulatory_change_actions(change_item_id)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_regulatory_change_actions_date
          ON regulatory_change_actions(created_at DESC)
        `)

        console.log('✅ Regulatory changes tables ready')
      } catch (error) {
        console.error('❌ Error creating regulatory changes tables:', error.message)
      } finally {
        client.release()
      }
    },

    // ===========================================
    // WORKFLOW TEMPLATES
    // ===========================================
    async getWorkflowTemplates(userId = 'default', options = {}) {
      await this.initialize()
      const includeInactive = Boolean(options.includeInactive)
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const query = includeInactive
            ? `SELECT * FROM workflow_stage_templates WHERE user_id = $1 ORDER BY name ASC`
            : `SELECT * FROM workflow_stage_templates WHERE user_id = $1 AND is_active = TRUE ORDER BY name ASC`
          const result = await client.query(query, [userKey])
          return result.rows.map(normalizeWorkflowTemplate)
        } catch (error) {
          console.warn('📊 Falling back to JSON for getWorkflowTemplates:', error.message)
          return this.getWorkflowTemplatesJSON(userKey, includeInactive)
        } finally {
          client.release()
        }
      }

      return this.getWorkflowTemplatesJSON(userKey, includeInactive)
    },

    async getWorkflowTemplateById(templateId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `SELECT * FROM workflow_stage_templates WHERE id = $1 AND user_id = $2`,
            [templateId, userKey]
          )
          return result.rows.length ? normalizeWorkflowTemplate(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON for getWorkflowTemplateById:', error.message)
          return this.getWorkflowTemplateByIdJSON(templateId, userKey)
        } finally {
          client.release()
        }
      }

      return this.getWorkflowTemplateByIdJSON(templateId, userKey)
    },

    async createWorkflowTemplate(userId = 'default', templateData = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')

          if (templateData.isDefault) {
            await client.query(
              `UPDATE workflow_stage_templates SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1`,
              [userKey]
            )
          }

          const result = await client.query(
            `INSERT INTO workflow_stage_templates (
              user_id, name, description, stages, is_default, is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW()) RETURNING *`,
            [
              userKey,
              templateData.name || 'New Workflow',
              templateData.description || null,
              JSON.stringify(templateData.stages || []),
              templateData.isDefault || false
            ]
          )

          await client.query('COMMIT')
          return normalizeWorkflowTemplate(result.rows[0])
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON for createWorkflowTemplate:', error.message)
          return this.createWorkflowTemplateJSON(userKey, templateData)
        } finally {
          client.release()
        }
      }

      return this.createWorkflowTemplateJSON(userKey, templateData)
    },

    async updateWorkflowTemplate(templateId, userId = 'default', updates = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')

          if (updates.isDefault) {
            await client.query(
              `UPDATE workflow_stage_templates SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1 AND id != $2`,
              [userKey, templateId]
            )
          }

          const result = await client.query(
            `UPDATE workflow_stage_templates SET
              name = COALESCE($3, name),
              description = COALESCE($4, description),
              stages = COALESCE($5, stages),
              is_default = COALESCE($6, is_default),
              updated_at = NOW()
            WHERE id = $1 AND user_id = $2 RETURNING *`,
            [
              templateId,
              userKey,
              updates.name,
              updates.description,
              updates.stages ? JSON.stringify(updates.stages) : null,
              updates.isDefault
            ]
          )

          await client.query('COMMIT')
          return result.rows.length ? normalizeWorkflowTemplate(result.rows[0]) : null
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON for updateWorkflowTemplate:', error.message)
          return this.updateWorkflowTemplateJSON(templateId, userKey, updates)
        } finally {
          client.release()
        }
      }

      return this.updateWorkflowTemplateJSON(templateId, userKey, updates)
    },

    async deleteWorkflowTemplate(templateId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `UPDATE workflow_stage_templates SET is_active = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
            [templateId, userKey]
          )
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON for deleteWorkflowTemplate:', error.message)
          return this.deleteWorkflowTemplateJSON(templateId, userKey)
        } finally {
          client.release()
        }
      }

      return this.deleteWorkflowTemplateJSON(templateId, userKey)
    },

    // ===========================================
    // REGULATORY CHANGE ITEMS
    // ===========================================
    async getRegulatoryChangeItems(userId = 'default', filters = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          let query = `SELECT * FROM regulatory_change_items WHERE user_id = $1 AND is_active = TRUE`
          const params = [userKey]
          let paramCount = 1

          if (filters.status) {
            query += ` AND status = $${++paramCount}`
            params.push(filters.status)
          }

          if (filters.businessLineProfileId) {
            query += ` AND business_line_profile_id = $${++paramCount}`
            params.push(filters.businessLineProfileId)
          }

          if (filters.currentStageId) {
            query += ` AND current_stage_id = $${++paramCount}`
            params.push(filters.currentStageId)
          }

          if (filters.priority) {
            query += ` AND priority = $${++paramCount}`
            params.push(filters.priority)
          }

          query += ' ORDER BY created_at DESC'

          if (filters.limit) {
            query += ` LIMIT $${++paramCount}`
            params.push(filters.limit)
          }

          const result = await client.query(query, params)
          return result.rows.map(normalizeRegulatoryChangeItem)
        } catch (error) {
          console.warn('📊 Falling back to JSON for getRegulatoryChangeItems:', error.message)
          return this.getRegulatoryChangeItemsJSON(userKey, filters)
        } finally {
          client.release()
        }
      }

      return this.getRegulatoryChangeItemsJSON(userKey, filters)
    },

    async getRegulatoryChangeItemById(itemId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `SELECT * FROM regulatory_change_items WHERE id = $1 AND user_id = $2`,
            [itemId, userKey]
          )
          return result.rows.length ? normalizeRegulatoryChangeItem(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getRegulatoryChangeItemByIdJSON(itemId, userKey)
        } finally {
          client.release()
        }
      }

      return this.getRegulatoryChangeItemByIdJSON(itemId, userKey)
    },

    async createRegulatoryChangeItem(userId = 'default', itemData = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')
      const normalized = normalizeRegulatoryChangeItemInput(itemData)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `INSERT INTO regulatory_change_items (
              user_id, business_line_profile_id, workflow_template_id,
              regulatory_update_id, regulatory_update_url,
              title, summary, authority, impact_level,
              current_stage_id, stage_history,
              identified_date, target_completion_date,
              status, priority, tags, is_active,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE, NOW(), NOW()
            ) RETURNING *`,
            [
              userKey,
              normalized.businessLineProfileId,
              normalized.workflowTemplateId,
              normalized.regulatoryUpdateId,
              normalized.regulatoryUpdateUrl,
              normalized.title,
              normalized.summary,
              normalized.authority,
              normalized.impactLevel,
              normalized.currentStageId,
              JSON.stringify(normalized.stageHistory || []),
              normalized.identifiedDate || new Date(),
              normalized.targetCompletionDate,
              normalized.status,
              normalized.priority,
              normalized.tags
            ]
          )

          // Record the creation action
          await this.createRegulatoryChangeAction(result.rows[0].id, userKey, {
            actionType: 'created',
            title: 'Item created',
            description: `Regulatory change item "${normalized.title}" was created`
          })

          return normalizeRegulatoryChangeItem(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON for createRegulatoryChangeItem:', error.message)
          return this.createRegulatoryChangeItemJSON(userKey, itemData)
        } finally {
          client.release()
        }
      }

      return this.createRegulatoryChangeItemJSON(userKey, itemData)
    },

    async updateRegulatoryChangeItem(itemId, userId = 'default', updates = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const setClauses = []
          const params = [itemId, userKey]
          let paramCount = 2

          const fieldMap = {
            title: 'title',
            summary: 'summary',
            authority: 'authority',
            impactLevel: 'impact_level',
            currentStageId: 'current_stage_id',
            targetCompletionDate: 'target_completion_date',
            actualCompletionDate: 'actual_completion_date',
            status: 'status',
            priority: 'priority'
          }

          Object.entries(fieldMap).forEach(([jsKey, dbKey]) => {
            if (updates[jsKey] !== undefined) {
              setClauses.push(`${dbKey} = $${++paramCount}`)
              params.push(updates[jsKey])
            }
          })

          if (updates.stageHistory !== undefined) {
            setClauses.push(`stage_history = $${++paramCount}`)
            params.push(JSON.stringify(updates.stageHistory))
          }

          if (updates.tags !== undefined) {
            setClauses.push(`tags = $${++paramCount}`)
            params.push(updates.tags)
          }

          if (setClauses.length === 0) {
            return this.getRegulatoryChangeItemById(itemId, userId)
          }

          setClauses.push('updated_at = NOW()')

          const result = await client.query(
            `UPDATE regulatory_change_items SET ${setClauses.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
            params
          )

          return result.rows.length ? normalizeRegulatoryChangeItem(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.updateRegulatoryChangeItemJSON(itemId, userKey, updates)
        } finally {
          client.release()
        }
      }

      return this.updateRegulatoryChangeItemJSON(itemId, userKey, updates)
    },

    async advanceRegulatoryChangeStage(itemId, userId = 'default', newStageId, metadata = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      // Get current item
      const item = await this.getRegulatoryChangeItemById(itemId, userKey)
      if (!item) {
        throw new Error('Regulatory change item not found')
      }

      const fromStageId = item.currentStageId
      const stageHistory = item.stageHistory || []

      // Add to stage history
      stageHistory.push({
        stageId: newStageId,
        fromStageId,
        timestamp: new Date().toISOString(),
        userId: userKey,
        metadata
      })

      // Update the item
      const updated = await this.updateRegulatoryChangeItem(itemId, userKey, {
        currentStageId: newStageId,
        stageHistory
      })

      // Record the stage change action
      await this.createRegulatoryChangeAction(itemId, userKey, {
        actionType: 'stage_change',
        fromStageId,
        toStageId: newStageId,
        title: `Stage changed`,
        description: metadata.comment || `Moved from ${fromStageId || 'initial'} to ${newStageId}`,
        metadata
      })

      return updated
    },

    async deleteRegulatoryChangeItem(itemId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `UPDATE regulatory_change_items SET is_active = FALSE, status = 'archived', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
            [itemId, userKey]
          )
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.deleteRegulatoryChangeItemJSON(itemId, userKey)
        } finally {
          client.release()
        }
      }

      return this.deleteRegulatoryChangeItemJSON(itemId, userKey)
    },

    async getRegulatoryChangeItemsByStage(userId = 'default', profileId = null) {
      await this.initialize()
      const items = await this.getRegulatoryChangeItems(userId, {
        businessLineProfileId: profileId,
        status: 'active'
      })

      // Group by stage
      const byStage = {}
      items.forEach(item => {
        const stageId = item.currentStageId || 'unassigned'
        if (!byStage[stageId]) {
          byStage[stageId] = []
        }
        byStage[stageId].push(item)
      })

      return byStage
    },

    // ===========================================
    // REGULATORY CHANGE ACTIONS (Audit Trail)
    // ===========================================
    async createRegulatoryChangeAction(changeItemId, userId = 'default', actionData = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `INSERT INTO regulatory_change_actions (
              change_item_id, user_id, action_type, stage_id,
              title, description, from_stage_id, to_stage_id,
              attachments, metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`,
            [
              changeItemId,
              userKey,
              actionData.actionType || 'comment',
              actionData.stageId || null,
              actionData.title || null,
              actionData.description || null,
              actionData.fromStageId || null,
              actionData.toStageId || null,
              JSON.stringify(actionData.attachments || []),
              JSON.stringify(actionData.metadata || {})
            ]
          )
          return normalizeRegulatoryChangeAction(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.createRegulatoryChangeActionJSON(changeItemId, userKey, actionData)
        } finally {
          client.release()
        }
      }

      return this.createRegulatoryChangeActionJSON(changeItemId, userKey, actionData)
    },

    async getRegulatoryChangeActions(changeItemId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `SELECT * FROM regulatory_change_actions WHERE change_item_id = $1 ORDER BY created_at DESC`,
            [changeItemId]
          )
          return result.rows.map(normalizeRegulatoryChangeAction)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getRegulatoryChangeActionsJSON(changeItemId)
        } finally {
          client.release()
        }
      }

      return this.getRegulatoryChangeActionsJSON(changeItemId)
    },

    // ===========================================
    // JSON FALLBACK HELPERS
    // ===========================================
    async loadWorkflowTemplatesJSON() {
      try {
        const raw = await fs.readFile(this.workflowTemplatesFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureRegulatoryChangesJSONFiles()
          return []
        }
        throw error
      }
    },

    async saveWorkflowTemplatesJSON(templates) {
      await fs.writeFile(this.workflowTemplatesFile, JSON.stringify(templates, null, 2))
    },

    async loadRegulatoryChangeItemsJSON() {
      try {
        const raw = await fs.readFile(this.regulatoryChangeItemsFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureRegulatoryChangesJSONFiles()
          return []
        }
        throw error
      }
    },

    async saveRegulatoryChangeItemsJSON(items) {
      await fs.writeFile(this.regulatoryChangeItemsFile, JSON.stringify(items, null, 2))
    },

    async loadRegulatoryChangeActionsJSON() {
      try {
        const raw = await fs.readFile(this.regulatoryChangeActionsFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureRegulatoryChangesJSONFiles()
          return []
        }
        throw error
      }
    },

    async saveRegulatoryChangeActionsJSON(actions) {
      await fs.writeFile(this.regulatoryChangeActionsFile, JSON.stringify(actions, null, 2))
    },

    async ensureRegulatoryChangesJSONFiles() {
      const dir = path.dirname(this.workflowTemplatesFile)
      await fs.mkdir(dir, { recursive: true })

      const files = [
        this.workflowTemplatesFile,
        this.regulatoryChangeItemsFile,
        this.regulatoryChangeActionsFile
      ]

      for (const file of files) {
        try {
          await fs.access(file)
        } catch {
          await fs.writeFile(file, JSON.stringify([], null, 2))
        }
      }
    },

    // JSON implementations
    async getWorkflowTemplatesJSON(userId, includeInactive = false) {
      const templates = await this.loadWorkflowTemplatesJSON()
      return templates
        .filter(t => t.userId === userId && (includeInactive || t.isActive !== false))
        .map(t => ({ ...t }))
    },

    async getWorkflowTemplateByIdJSON(templateId, userId) {
      const templates = await this.loadWorkflowTemplatesJSON()
      const template = templates.find(t =>
        (t.id === templateId || String(t.id) === String(templateId)) && t.userId === userId
      )
      return template ? { ...template } : null
    },

    async createWorkflowTemplateJSON(userId, templateData) {
      const templates = await this.loadWorkflowTemplatesJSON()
      const now = new Date().toISOString()

      if (templateData.isDefault) {
        templates.forEach(t => {
          if (t.userId === userId) t.isDefault = false
        })
      }

      const newTemplate = {
        id: crypto.randomUUID ? crypto.randomUUID() : `wft-${Date.now()}`,
        userId,
        name: templateData.name || 'New Workflow',
        description: templateData.description || null,
        stages: templateData.stages || [],
        isDefault: templateData.isDefault || false,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      templates.push(newTemplate)
      await this.saveWorkflowTemplatesJSON(templates)
      return { ...newTemplate }
    },

    async updateWorkflowTemplateJSON(templateId, userId, updates) {
      const templates = await this.loadWorkflowTemplatesJSON()
      const now = new Date().toISOString()
      let updated = null

      if (updates.isDefault) {
        templates.forEach(t => {
          if (t.userId === userId && String(t.id) !== String(templateId)) t.isDefault = false
        })
      }

      const nextTemplates = templates.map(t => {
        if ((String(t.id) === String(templateId)) && t.userId === userId) {
          updated = { ...t, ...updates, updatedAt: now }
          return updated
        }
        return t
      })

      await this.saveWorkflowTemplatesJSON(nextTemplates)
      return updated ? { ...updated } : null
    },

    async deleteWorkflowTemplateJSON(templateId, userId) {
      const templates = await this.loadWorkflowTemplatesJSON()
      let deleted = false

      const nextTemplates = templates.map(t => {
        if ((String(t.id) === String(templateId)) && t.userId === userId) {
          deleted = true
          return { ...t, isActive: false, updatedAt: new Date().toISOString() }
        }
        return t
      })

      if (deleted) await this.saveWorkflowTemplatesJSON(nextTemplates)
      return deleted
    },

    async getRegulatoryChangeItemsJSON(userId, filters = {}) {
      const items = await this.loadRegulatoryChangeItemsJSON()
      let filtered = items.filter(i => i.userId === userId && i.isActive !== false)

      if (filters.status) {
        filtered = filtered.filter(i => i.status === filters.status)
      }
      if (filters.businessLineProfileId) {
        filtered = filtered.filter(i => String(i.businessLineProfileId) === String(filters.businessLineProfileId))
      }
      if (filters.currentStageId) {
        filtered = filtered.filter(i => i.currentStageId === filters.currentStageId)
      }
      if (filters.priority) {
        filtered = filtered.filter(i => i.priority === filters.priority)
      }
      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit)
      }

      return filtered
        .map(i => decorateRegulatoryChangeItem({ ...i }))
        .filter(Boolean)
    },

    async getRegulatoryChangeItemByIdJSON(itemId, userId) {
      const items = await this.loadRegulatoryChangeItemsJSON()
      const item = items.find(i =>
        (String(i.id) === String(itemId)) && i.userId === userId
      )
      return item ? decorateRegulatoryChangeItem({ ...item }) : null
    },

    async createRegulatoryChangeItemJSON(userId, itemData) {
      const items = await this.loadRegulatoryChangeItemsJSON()
      const now = new Date().toISOString()
      const normalized = normalizeRegulatoryChangeItemInput(itemData)

      const newItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `rci-${Date.now()}`,
        userId,
        businessLineProfileId: normalized.businessLineProfileId,
        workflowTemplateId: normalized.workflowTemplateId,
        regulatoryUpdateId: normalized.regulatoryUpdateId,
        regulatoryUpdateUrl: normalized.regulatoryUpdateUrl,
        title: normalized.title,
        summary: normalized.summary,
        authority: normalized.authority,
        impactLevel: normalized.impactLevel,
        currentStageId: normalized.currentStageId,
        current_stage: normalized.currentStageId || null,  // Alias for service layer compatibility
        stageHistory: normalized.stageHistory || [],
        identifiedDate: normalized.identifiedDate || now,
        targetCompletionDate: normalized.targetCompletionDate,
        actualCompletionDate: null,
        status: normalized.status,
        priority: normalized.priority,
        tags: normalized.tags,
        linkedDossierIds: normalized.linkedDossierIds,
        linkedPolicyIds: normalized.linkedPolicyIds,
        watchListMatchIds: normalized.watchListMatchIds,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      items.push(newItem)
      await this.saveRegulatoryChangeItemsJSON(items)

      // Record creation action
      await this.createRegulatoryChangeActionJSON(newItem.id, userId, {
        actionType: 'created',
        title: 'Item created',
        description: `Regulatory change item "${itemData.title}" was created`
      })

      return decorateRegulatoryChangeItem({ ...newItem })
    },

    async updateRegulatoryChangeItemJSON(itemId, userId, updates) {
      const items = await this.loadRegulatoryChangeItemsJSON()
      let updated = null

      const nextItems = items.map(i => {
        if ((String(i.id) === String(itemId)) && i.userId === userId) {
          updated = { ...i, ...updates, updatedAt: new Date().toISOString() }
          return updated
        }
        return i
      })

      if (updated) await this.saveRegulatoryChangeItemsJSON(nextItems)
      return updated ? { ...updated } : null
    },

    async deleteRegulatoryChangeItemJSON(itemId, userId) {
      const items = await this.loadRegulatoryChangeItemsJSON()
      let deleted = false

      const nextItems = items.map(i => {
        if ((String(i.id) === String(itemId)) && i.userId === userId) {
          deleted = true
          return { ...i, isActive: false, status: 'archived', updatedAt: new Date().toISOString() }
        }
        return i
      })

      if (deleted) await this.saveRegulatoryChangeItemsJSON(nextItems)
      return deleted
    },

    async createRegulatoryChangeActionJSON(changeItemId, userId, actionData) {
      const actions = await this.loadRegulatoryChangeActionsJSON()
      const now = new Date().toISOString()

      const newAction = {
        id: crypto.randomUUID ? crypto.randomUUID() : `rca-${Date.now()}`,
        changeItemId,
        userId,
        actionType: actionData.actionType || 'comment',
        stageId: actionData.stageId || null,
        title: actionData.title || null,
        description: actionData.description || null,
        fromStageId: actionData.fromStageId || null,
        toStageId: actionData.toStageId || null,
        attachments: actionData.attachments || [],
        metadata: actionData.metadata || {},
        createdAt: now
      }

      actions.push(newAction)
      await this.saveRegulatoryChangeActionsJSON(actions)
      return { ...newAction }
    },

    async getRegulatoryChangeActionsJSON(changeItemId) {
      const actions = await this.loadRegulatoryChangeActionsJSON()
      return actions
        .filter(a => String(a.changeItemId) === String(changeItemId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(a => ({ ...a }))
    },

    // =====================
    // ALIASES for service compatibility
    // =====================
    async getWorkflowStageTemplates(userId, options) {
      return this.getWorkflowTemplates(userId, options)
    },

    async getWorkflowStageTemplateById(templateId, userId) {
      return this.getWorkflowTemplateById(templateId, userId)
    },

    async createWorkflowStageTemplate(userId, templateData) {
      return this.createWorkflowTemplate(userId, templateData)
    },

    async updateWorkflowStageTemplate(templateId, userId, updates) {
      return this.updateWorkflowTemplate(templateId, userId, updates)
    },

    async deleteWorkflowStageTemplate(templateId, userId) {
      return this.deleteWorkflowTemplate(templateId, userId)
    },

    async getDefaultWorkflowTemplate(userId) {
      const templates = await this.getWorkflowTemplates(userId)
      return templates.find(t => t.isDefault) || templates[0] || null
    },

    async setDefaultWorkflowTemplate(templateId, userId) {
      return this.updateWorkflowTemplate(templateId, userId, { isDefault: true })
    }
  })
}
