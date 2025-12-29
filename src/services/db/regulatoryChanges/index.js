const path = require('path')
const {
  ALTER_REGULATORY_CHANGE_ITEMS_LINKING,
  CLEAR_DEFAULT_WORKFLOW_TEMPLATE_EXCEPT_QUERY,
  CLEAR_DEFAULT_WORKFLOW_TEMPLATE_QUERY,
  CREATE_REGULATORY_CHANGE_ACTIONS_DATE_INDEX,
  CREATE_REGULATORY_CHANGE_ACTIONS_ITEM_INDEX,
  CREATE_REGULATORY_CHANGE_ACTIONS_TABLE,
  CREATE_REGULATORY_CHANGE_ITEMS_PROFILE_INDEX,
  CREATE_REGULATORY_CHANGE_ITEMS_STAGE_INDEX,
  CREATE_REGULATORY_CHANGE_ITEMS_TABLE,
  CREATE_REGULATORY_CHANGE_ITEMS_USER_INDEX,
  CREATE_WORKFLOW_TEMPLATES_INDEX,
  CREATE_WORKFLOW_TEMPLATES_TABLE,
  DELETE_REGULATORY_CHANGE_ITEM_QUERY,
  DELETE_WORKFLOW_TEMPLATE_QUERY,
  GET_REGULATORY_CHANGE_ACTIONS_QUERY,
  GET_REGULATORY_CHANGE_ITEM_BY_ID_QUERY,
  GET_WORKFLOW_TEMPLATE_BY_ID_QUERY,
  GET_WORKFLOW_TEMPLATES_QUERY,
  INSERT_REGULATORY_CHANGE_ACTION_QUERY,
  INSERT_REGULATORY_CHANGE_ITEM_QUERY,
  INSERT_WORKFLOW_TEMPLATE_QUERY,
  UPDATE_WORKFLOW_TEMPLATE_QUERY,
  buildRegulatoryChangeItemUpdateQuery,
  buildRegulatoryChangeItemsQuery
} = require('./queries')
const {
  normalizeRegulatoryChangeAction,
  normalizeRegulatoryChangeItem,
  normalizeWorkflowTemplate
} = require('./mappers')
const { normalizeRegulatoryChangeItemInput } = require('./validators')
const json = require('./json')

module.exports = function applyRegulatoryChangesMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    workflowTemplatesFile: path.join(__dirname, '../../../data/workflow_templates.json'),
    regulatoryChangeItemsFile: path.join(__dirname, '../../../data/regulatory_change_items.json'),
    regulatoryChangeActionsFile: path.join(__dirname, '../../../data/regulatory_change_actions.json'),

    async ensureRegulatoryChangesTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        // Workflow Stage Templates table
        await client.query(CREATE_WORKFLOW_TEMPLATES_TABLE)

        await client.query(CREATE_WORKFLOW_TEMPLATES_INDEX)

        // Regulatory Change Items table
        await client.query(CREATE_REGULATORY_CHANGE_ITEMS_TABLE)

        // Add linking columns if they don't exist (for existing databases)
        await client.query(ALTER_REGULATORY_CHANGE_ITEMS_LINKING)

        await client.query(CREATE_REGULATORY_CHANGE_ITEMS_USER_INDEX)

        await client.query(CREATE_REGULATORY_CHANGE_ITEMS_PROFILE_INDEX)

        await client.query(CREATE_REGULATORY_CHANGE_ITEMS_STAGE_INDEX)

        // Regulatory Change Actions table (audit trail)
        await client.query(CREATE_REGULATORY_CHANGE_ACTIONS_TABLE)

        await client.query(CREATE_REGULATORY_CHANGE_ACTIONS_ITEM_INDEX)

        await client.query(CREATE_REGULATORY_CHANGE_ACTIONS_DATE_INDEX)

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
          const query = includeInactive ? GET_WORKFLOW_TEMPLATES_QUERY.all : GET_WORKFLOW_TEMPLATES_QUERY.active
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
          const result = await client.query(GET_WORKFLOW_TEMPLATE_BY_ID_QUERY, [templateId, userKey])
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
            await client.query(CLEAR_DEFAULT_WORKFLOW_TEMPLATE_QUERY, [userKey])
          }

          const result = await client.query(
            INSERT_WORKFLOW_TEMPLATE_QUERY,
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
            await client.query(CLEAR_DEFAULT_WORKFLOW_TEMPLATE_EXCEPT_QUERY, [userKey, templateId])
          }

          const result = await client.query(
            UPDATE_WORKFLOW_TEMPLATE_QUERY,
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
          const result = await client.query(DELETE_WORKFLOW_TEMPLATE_QUERY, [templateId, userKey])
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
          const { text, values } = buildRegulatoryChangeItemsQuery(userKey, filters)
          const result = await client.query(text, values)
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
          const result = await client.query(GET_REGULATORY_CHANGE_ITEM_BY_ID_QUERY, [itemId, userKey])
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
            INSERT_REGULATORY_CHANGE_ITEM_QUERY,
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
          const { text, values, hasUpdates } = buildRegulatoryChangeItemUpdateQuery(itemId, userKey, updates)

          if (!hasUpdates) {
            return this.getRegulatoryChangeItemById(itemId, userId)
          }

          const result = await client.query(text, values)

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
        title: 'Stage changed',
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
          const result = await client.query(DELETE_REGULATORY_CHANGE_ITEM_QUERY, [itemId, userKey])
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
            INSERT_REGULATORY_CHANGE_ACTION_QUERY,
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
          const result = await client.query(GET_REGULATORY_CHANGE_ACTIONS_QUERY, [changeItemId])
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
      return json.loadWorkflowTemplatesJSON(this)
    },

    async saveWorkflowTemplatesJSON(templates) {
      await json.saveWorkflowTemplatesJSON(this, templates)
    },

    async loadRegulatoryChangeItemsJSON() {
      return json.loadRegulatoryChangeItemsJSON(this)
    },

    async saveRegulatoryChangeItemsJSON(items) {
      await json.saveRegulatoryChangeItemsJSON(this, items)
    },

    async loadRegulatoryChangeActionsJSON() {
      return json.loadRegulatoryChangeActionsJSON(this)
    },

    async saveRegulatoryChangeActionsJSON(actions) {
      await json.saveRegulatoryChangeActionsJSON(this, actions)
    },

    async ensureRegulatoryChangesJSONFiles() {
      await json.ensureRegulatoryChangesJSONFiles(this)
    },

    // JSON implementations
    async getWorkflowTemplatesJSON(userId, includeInactive = false) {
      return json.getWorkflowTemplatesJSON(this, userId, includeInactive)
    },

    async getWorkflowTemplateByIdJSON(templateId, userId) {
      return json.getWorkflowTemplateByIdJSON(this, templateId, userId)
    },

    async createWorkflowTemplateJSON(userId, templateData) {
      return json.createWorkflowTemplateJSON(this, userId, templateData)
    },

    async updateWorkflowTemplateJSON(templateId, userId, updates) {
      return json.updateWorkflowTemplateJSON(this, templateId, userId, updates)
    },

    async deleteWorkflowTemplateJSON(templateId, userId) {
      return json.deleteWorkflowTemplateJSON(this, templateId, userId)
    },

    async getRegulatoryChangeItemsJSON(userId, filters = {}) {
      return json.getRegulatoryChangeItemsJSON(this, userId, filters)
    },

    async getRegulatoryChangeItemByIdJSON(itemId, userId) {
      return json.getRegulatoryChangeItemByIdJSON(this, itemId, userId)
    },

    async createRegulatoryChangeItemJSON(userId, itemData) {
      return json.createRegulatoryChangeItemJSON(this, userId, itemData)
    },

    async updateRegulatoryChangeItemJSON(itemId, userId, updates) {
      return json.updateRegulatoryChangeItemJSON(this, itemId, userId, updates)
    },

    async deleteRegulatoryChangeItemJSON(itemId, userId) {
      return json.deleteRegulatoryChangeItemJSON(this, itemId, userId)
    },

    async createRegulatoryChangeActionJSON(changeItemId, userId, actionData) {
      return json.createRegulatoryChangeActionJSON(this, changeItemId, userId, actionData)
    },

    async getRegulatoryChangeActionsJSON(changeItemId) {
      return json.getRegulatoryChangeActionsJSON(this, changeItemId)
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
