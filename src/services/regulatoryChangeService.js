const dbService = require('./dbService')

/**
 * Regulatory Change Service
 * Manages regulatory change items and their workflow progression
 */
class RegulatoryChangeService {
  constructor() {
    this.db = dbService
  }

  // ==================== WORKFLOW TEMPLATES ====================

  /**
   * Get all workflow templates for a user
   */
  async getWorkflowTemplates(userId = 'default') {
    try {
      return await this.db.getWorkflowStageTemplates(userId)
    } catch (error) {
      console.error('Error getting workflow templates:', error.message)
      return []
    }
  }

  /**
   * Get a single workflow template by ID
   */
  async getWorkflowTemplateById(templateId, userId = 'default') {
    try {
      return await this.db.getWorkflowStageTemplateById(templateId, userId)
    } catch (error) {
      console.error('Error getting workflow template:', error.message)
      return null
    }
  }

  /**
   * Get the default workflow template for a user
   */
  async getDefaultTemplate(userId = 'default') {
    try {
      return await this.db.getDefaultWorkflowTemplate(userId)
    } catch (error) {
      console.error('Error getting default template:', error.message)
      return null
    }
  }

  /**
   * Create a new workflow template
   */
  async createWorkflowTemplate(userId = 'default', templateData = {}) {
    try {
      // Validate required fields
      if (!templateData.name || !templateData.name.trim()) {
        throw new Error('Template name is required')
      }

      if (!templateData.stages || !Array.isArray(templateData.stages) || templateData.stages.length === 0) {
        throw new Error('At least one stage is required')
      }

      // Validate stages structure
      templateData.stages.forEach((stage, index) => {
        if (!stage.name || !stage.name.trim()) {
          throw new Error(`Stage ${index + 1} name is required`)
        }
      })

      return await this.db.createWorkflowStageTemplate(userId, templateData)
    } catch (error) {
      console.error('Error creating workflow template:', error.message)
      throw error
    }
  }

  /**
   * Update an existing workflow template
   */
  async updateWorkflowTemplate(templateId, userId = 'default', updates = {}) {
    try {
      const existing = await this.db.getWorkflowStageTemplateById(templateId, userId)
      if (!existing) {
        throw new Error('Template not found')
      }

      // Validate stages if provided
      if (updates.stages) {
        if (!Array.isArray(updates.stages) || updates.stages.length === 0) {
          throw new Error('At least one stage is required')
        }
        updates.stages.forEach((stage, index) => {
          if (!stage.name || !stage.name.trim()) {
            throw new Error(`Stage ${index + 1} name is required`)
          }
        })
      }

      return await this.db.updateWorkflowStageTemplate(templateId, userId, updates)
    } catch (error) {
      console.error('Error updating workflow template:', error.message)
      throw error
    }
  }

  /**
   * Delete a workflow template
   */
  async deleteWorkflowTemplate(templateId, userId = 'default') {
    try {
      const result = await this.db.deleteWorkflowStageTemplate(templateId, userId)
      if (!result) {
        throw new Error('Template not found or already deleted')
      }
      return result
    } catch (error) {
      console.error('Error deleting workflow template:', error.message)
      throw error
    }
  }

  /**
   * Set a template as the default
   */
  async setDefaultTemplate(templateId, userId = 'default') {
    try {
      const result = await this.db.setDefaultWorkflowTemplate(templateId, userId)
      if (!result) {
        throw new Error('Template not found')
      }
      return result
    } catch (error) {
      console.error('Error setting default template:', error.message)
      throw error
    }
  }

  /**
   * Get preset workflow templates
   */
  getPresetTemplates() {
    return [
      {
        name: 'Standard Regulatory Change',
        description: 'Standard 6-stage workflow for managing regulatory changes',
        stages: [
          { name: 'Identified', description: 'Change has been identified and logged', color: '#6B7280', order: 1 },
          { name: 'Gap Analysis', description: 'Analyzing gaps between current state and requirements', color: '#3B82F6', order: 2 },
          { name: 'Risk Assessment', description: 'Assessing risks and impact on the business', color: '#F59E0B', order: 3 },
          { name: 'Implementation Plan', description: 'Developing implementation strategy and timeline', color: '#8B5CF6', order: 4 },
          { name: 'In Progress', description: 'Implementation is underway', color: '#10B981', order: 5 },
          { name: 'Complete', description: 'Change has been fully implemented and signed off', color: '#059669', order: 6 }
        ]
      },
      {
        name: 'Quick Assessment',
        description: 'Simplified 4-stage workflow for low-impact changes',
        stages: [
          { name: 'New', description: 'Newly identified change', color: '#6B7280', order: 1 },
          { name: 'Under Review', description: 'Being reviewed for impact', color: '#3B82F6', order: 2 },
          { name: 'Action Required', description: 'Actions identified and being taken', color: '#F59E0B', order: 3 },
          { name: 'Closed', description: 'No further action required', color: '#059669', order: 4 }
        ]
      },
      {
        name: 'Compliance Tracking',
        description: 'Detailed workflow with compliance sign-off stages',
        stages: [
          { name: 'Identified', description: 'Change identified from regulatory source', color: '#6B7280', order: 1 },
          { name: 'Impact Analysis', description: 'Analyzing business and compliance impact', color: '#3B82F6', order: 2 },
          { name: 'Policy Review', description: 'Reviewing affected policies and procedures', color: '#8B5CF6', order: 3 },
          { name: 'Implementation', description: 'Implementing required changes', color: '#F59E0B', order: 4 },
          { name: 'Testing', description: 'Testing and validating implementation', color: '#10B981', order: 5 },
          { name: 'Compliance Sign-off', description: 'Awaiting compliance team approval', color: '#EC4899', order: 6 },
          { name: 'Complete', description: 'Fully implemented and approved', color: '#059669', order: 7 }
        ]
      }
    ]
  }

  /**
   * Create a template from a preset
   */
  async createFromPreset(presetName, userId = 'default', overrides = {}) {
    const presets = this.getPresetTemplates()
    const preset = presets.find(p =>
      p.name.toLowerCase() === presetName.toLowerCase()
    )

    if (!preset) {
      throw new Error(`Preset '${presetName}' not found`)
    }

    const templateData = {
      ...preset,
      ...overrides
    }

    return await this.createWorkflowTemplate(userId, templateData)
  }

  // ==================== REGULATORY CHANGE ITEMS ====================

  /**
   * Get all regulatory change items for a user with optional filtering
   */
  async getChangeItems(userId = 'default', filters = {}) {
    try {
      return await this.db.getRegulatoryChangeItems(userId, filters)
    } catch (error) {
      console.error('Error getting change items:', error.message)
      return []
    }
  }

  /**
   * Get a single change item by ID
   */
  async getChangeItemById(itemId, userId = 'default') {
    try {
      return await this.db.getRegulatoryChangeItemById(itemId, userId)
    } catch (error) {
      console.error('Error getting change item:', error.message)
      return null
    }
  }

  /**
   * Get change items grouped by workflow stage (for Kanban view)
   */
  async getChangeItemsByStage(userId = 'default', filters = {}) {
    try {
      const items = await this.db.getRegulatoryChangeItems(userId, filters)

      // Group by current stage
      const grouped = {}
      items.forEach(item => {
        const stage = item.current_stage || 'Unassigned'
        if (!grouped[stage]) {
          grouped[stage] = []
        }
        grouped[stage].push(item)
      })

      return grouped
    } catch (error) {
      console.error('Error getting change items by stage:', error.message)
      return {}
    }
  }

  /**
   * Create a new regulatory change item
   */
  async createChangeItem(userId = 'default', itemData = {}) {
    try {
      // Validate required fields
      if (!itemData.title || !itemData.title.trim()) {
        throw new Error('Title is required')
      }

      // If workflow_template_id is provided, get the template and set initial stage
      if (itemData.workflow_template_id) {
        const template = await this.getWorkflowTemplateById(itemData.workflow_template_id, userId)
        if (template && template.stages && template.stages.length > 0) {
          // Sort stages by order and get the first one
          const sortedStages = [...template.stages].sort((a, b) => a.order - b.order)
          itemData.current_stage = sortedStages[0].name
        }
      }

      return await this.db.createRegulatoryChangeItem(userId, itemData)
    } catch (error) {
      console.error('Error creating change item:', error.message)
      throw error
    }
  }

  /**
   * Create a change item from a regulatory update
   */
  async createFromUpdate(updateId, userId = 'default', additionalData = {}) {
    try {
      // Get the update
      const update = await this.db.getUpdateById(updateId)
      if (!update) {
        throw new Error('Update not found')
      }

      // Get default template if not specified
      let workflowTemplateId = additionalData.workflow_template_id
      if (!workflowTemplateId) {
        const defaultTemplate = await this.getDefaultTemplate(userId)
        if (defaultTemplate) {
          workflowTemplateId = defaultTemplate.id
        }
      }

      const itemData = {
        title: update.headline || update.title || 'Regulatory Change',
        description: update.ai_summary || update.summary || '',
        source_update_id: updateId,
        source_url: update.url || update.link,
        authority: update.authority,
        sector: update.sector,
        impact_level: update.impact_level || 'medium',
        workflow_template_id: workflowTemplateId,
        due_date: update.compliance_deadline || additionalData.due_date,
        ...additionalData
      }

      return await this.createChangeItem(userId, itemData)
    } catch (error) {
      console.error('Error creating change item from update:', error.message)
      throw error
    }
  }

  /**
   * Update an existing change item
   */
  async updateChangeItem(itemId, userId = 'default', updates = {}) {
    try {
      const existing = await this.db.getRegulatoryChangeItemById(itemId, userId)
      if (!existing) {
        throw new Error('Change item not found')
      }

      return await this.db.updateRegulatoryChangeItem(itemId, userId, updates)
    } catch (error) {
      console.error('Error updating change item:', error.message)
      throw error
    }
  }

  /**
   * Advance a change item to the next stage
   */
  async advanceStage(itemId, userId = 'default', newStage, notes = '') {
    try {
      const result = await this.db.advanceRegulatoryChangeStage(itemId, userId, newStage, notes)
      if (!result) {
        throw new Error('Failed to advance stage')
      }
      return result
    } catch (error) {
      console.error('Error advancing stage:', error.message)
      throw error
    }
  }

  /**
   * Delete (archive) a change item
   */
  async deleteChangeItem(itemId, userId = 'default') {
    try {
      const result = await this.db.deleteRegulatoryChangeItem(itemId, userId)
      if (!result) {
        throw new Error('Change item not found or already deleted')
      }
      return result
    } catch (error) {
      console.error('Error deleting change item:', error.message)
      throw error
    }
  }

  // ==================== ACTIONS & AUDIT TRAIL ====================

  /**
   * Add an action to a change item
   */
  async addAction(itemId, userId = 'default', actionData = {}) {
    try {
      // Validate required fields
      if (!actionData.action_type) {
        throw new Error('Action type is required')
      }

      // Verify item exists
      const item = await this.db.getRegulatoryChangeItemById(itemId, userId)
      if (!item) {
        throw new Error('Change item not found')
      }

      return await this.db.createRegulatoryChangeAction(itemId, userId, actionData)
    } catch (error) {
      console.error('Error adding action:', error.message)
      throw error
    }
  }

  /**
   * Get actions for a change item
   */
  async getActions(itemId, userId = 'default') {
    try {
      return await this.db.getRegulatoryChangeActions(itemId, userId)
    } catch (error) {
      console.error('Error getting actions:', error.message)
      return []
    }
  }

  /**
   * Get audit trail for a change item (all stage transitions)
   */
  async getAuditTrail(itemId, userId = 'default') {
    try {
      const item = await this.db.getRegulatoryChangeItemById(itemId, userId)
      if (!item) {
        return []
      }
      return item.stage_history || []
    } catch (error) {
      console.error('Error getting audit trail:', error.message)
      return []
    }
  }

  // ==================== STATISTICS & REPORTING ====================

  /**
   * Get statistics for regulatory changes
   */
  async getStatistics(userId = 'default', filters = {}) {
    try {
      const items = await this.db.getRegulatoryChangeItems(userId, filters)

      const stats = {
        total: items.length,
        byStage: {},
        byPriority: { high: 0, medium: 0, low: 0 },
        byImpact: { high: 0, medium: 0, low: 0 },
        byAuthority: {},
        bySector: {},
        overdue: 0,
        dueSoon: 0, // Due within 7 days
        completedThisMonth: 0,
        avgTimeInStage: {}
      }

      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      items.forEach(item => {
        // By stage
        const stage = item.current_stage || 'Unassigned'
        stats.byStage[stage] = (stats.byStage[stage] || 0) + 1

        // By priority
        const priority = (item.priority || 'medium').toLowerCase()
        if (stats.byPriority[priority] !== undefined) {
          stats.byPriority[priority]++
        }

        // By impact
        const impact = (item.impact_level || 'medium').toLowerCase()
        if (stats.byImpact[impact] !== undefined) {
          stats.byImpact[impact]++
        }

        // By authority
        if (item.authority) {
          stats.byAuthority[item.authority] = (stats.byAuthority[item.authority] || 0) + 1
        }

        // By sector
        if (item.sector) {
          stats.bySector[item.sector] = (stats.bySector[item.sector] || 0) + 1
        }

        // Overdue
        if (item.due_date && new Date(item.due_date) < now && item.current_stage !== 'Complete') {
          stats.overdue++
        }

        // Due soon
        if (item.due_date) {
          const dueDate = new Date(item.due_date)
          if (dueDate >= now && dueDate <= sevenDaysFromNow) {
            stats.dueSoon++
          }
        }

        // Completed this month
        if (item.completed_at && new Date(item.completed_at) >= startOfMonth) {
          stats.completedThisMonth++
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting statistics:', error.message)
      return { total: 0, byStage: {}, byPriority: {}, byImpact: {}, byAuthority: {}, bySector: {} }
    }
  }

  /**
   * Get velocity metrics (items completed per period)
   */
  async getVelocityMetrics(userId = 'default', periodDays = 30) {
    try {
      const items = await this.db.getRegulatoryChangeItems(userId, { includeArchived: true })

      const now = new Date()
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

      const completedInPeriod = items.filter(item =>
        item.completed_at && new Date(item.completed_at) >= startDate
      )

      const createdInPeriod = items.filter(item =>
        item.created_at && new Date(item.created_at) >= startDate
      )

      return {
        period: periodDays,
        completed: completedInPeriod.length,
        created: createdInPeriod.length,
        netChange: completedInPeriod.length - createdInPeriod.length,
        avgCompletionRate: completedInPeriod.length / (periodDays / 7) // Per week
      }
    } catch (error) {
      console.error('Error getting velocity metrics:', error.message)
      return { period: periodDays, completed: 0, created: 0, netChange: 0, avgCompletionRate: 0 }
    }
  }
}

module.exports = new RegulatoryChangeService()
