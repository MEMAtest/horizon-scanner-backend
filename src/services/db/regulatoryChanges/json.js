const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')
const {
  decorateRegulatoryChangeItem
} = require('./mappers')
const { normalizeRegulatoryChangeItemInput } = require('./validators')

async function loadWorkflowTemplatesJSON(service) {
  try {
    const raw = await fs.readFile(service.workflowTemplatesFile, 'utf8')
    return JSON.parse(raw) || []
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureRegulatoryChangesJSONFiles(service)
      return []
    }
    throw error
  }
}

async function saveWorkflowTemplatesJSON(service, templates) {
  await fs.writeFile(service.workflowTemplatesFile, JSON.stringify(templates, null, 2))
}

async function loadRegulatoryChangeItemsJSON(service) {
  try {
    const raw = await fs.readFile(service.regulatoryChangeItemsFile, 'utf8')
    return JSON.parse(raw) || []
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureRegulatoryChangesJSONFiles(service)
      return []
    }
    throw error
  }
}

async function saveRegulatoryChangeItemsJSON(service, items) {
  await fs.writeFile(service.regulatoryChangeItemsFile, JSON.stringify(items, null, 2))
}

async function loadRegulatoryChangeActionsJSON(service) {
  try {
    const raw = await fs.readFile(service.regulatoryChangeActionsFile, 'utf8')
    return JSON.parse(raw) || []
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureRegulatoryChangesJSONFiles(service)
      return []
    }
    throw error
  }
}

async function saveRegulatoryChangeActionsJSON(service, actions) {
  await fs.writeFile(service.regulatoryChangeActionsFile, JSON.stringify(actions, null, 2))
}

async function ensureRegulatoryChangesJSONFiles(service) {
  const dir = path.dirname(service.workflowTemplatesFile)
  await fs.mkdir(dir, { recursive: true })

  const files = [
    service.workflowTemplatesFile,
    service.regulatoryChangeItemsFile,
    service.regulatoryChangeActionsFile
  ]

  for (const file of files) {
    try {
      await fs.access(file)
    } catch {
      await fs.writeFile(file, JSON.stringify([], null, 2))
    }
  }
}

async function getWorkflowTemplatesJSON(service, userId, includeInactive = false) {
  const templates = await loadWorkflowTemplatesJSON(service)
  return templates
    .filter(t => t.userId === userId && (includeInactive || t.isActive !== false))
    .map(t => ({ ...t }))
}

async function getWorkflowTemplateByIdJSON(service, templateId, userId) {
  const templates = await loadWorkflowTemplatesJSON(service)
  const template = templates.find(t =>
    (t.id === templateId || String(t.id) === String(templateId)) && t.userId === userId
  )
  return template ? { ...template } : null
}

async function createWorkflowTemplateJSON(service, userId, templateData) {
  const templates = await loadWorkflowTemplatesJSON(service)
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
  await saveWorkflowTemplatesJSON(service, templates)
  return { ...newTemplate }
}

async function updateWorkflowTemplateJSON(service, templateId, userId, updates) {
  const templates = await loadWorkflowTemplatesJSON(service)
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

  await saveWorkflowTemplatesJSON(service, nextTemplates)
  return updated ? { ...updated } : null
}

async function deleteWorkflowTemplateJSON(service, templateId, userId) {
  const templates = await loadWorkflowTemplatesJSON(service)
  let deleted = false

  const nextTemplates = templates.map(t => {
    if ((String(t.id) === String(templateId)) && t.userId === userId) {
      deleted = true
      return { ...t, isActive: false, updatedAt: new Date().toISOString() }
    }
    return t
  })

  if (deleted) await saveWorkflowTemplatesJSON(service, nextTemplates)
  return deleted
}

async function getRegulatoryChangeItemsJSON(service, userId, filters = {}) {
  const items = await loadRegulatoryChangeItemsJSON(service)
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
}

async function getRegulatoryChangeItemByIdJSON(service, itemId, userId) {
  const items = await loadRegulatoryChangeItemsJSON(service)
  const item = items.find(i =>
    (String(i.id) === String(itemId)) && i.userId === userId
  )
  return item ? decorateRegulatoryChangeItem({ ...item }) : null
}

async function createRegulatoryChangeItemJSON(service, userId, itemData) {
  const items = await loadRegulatoryChangeItemsJSON(service)
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
    current_stage: normalized.currentStageId || null, // Alias for service layer compatibility
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
  await saveRegulatoryChangeItemsJSON(service, items)

  // Record creation action
  await createRegulatoryChangeActionJSON(service, newItem.id, userId, {
    actionType: 'created',
    title: 'Item created',
    description: `Regulatory change item "${itemData.title}" was created`
  })

  return decorateRegulatoryChangeItem({ ...newItem })
}

async function updateRegulatoryChangeItemJSON(service, itemId, userId, updates) {
  const items = await loadRegulatoryChangeItemsJSON(service)
  let updated = null

  const nextItems = items.map(i => {
    if ((String(i.id) === String(itemId)) && i.userId === userId) {
      updated = { ...i, ...updates, updatedAt: new Date().toISOString() }
      return updated
    }
    return i
  })

  if (updated) await saveRegulatoryChangeItemsJSON(service, nextItems)
  return updated ? { ...updated } : null
}

async function deleteRegulatoryChangeItemJSON(service, itemId, userId) {
  const items = await loadRegulatoryChangeItemsJSON(service)
  let deleted = false

  const nextItems = items.map(i => {
    if ((String(i.id) === String(itemId)) && i.userId === userId) {
      deleted = true
      return { ...i, isActive: false, status: 'archived', updatedAt: new Date().toISOString() }
    }
    return i
  })

  if (deleted) await saveRegulatoryChangeItemsJSON(service, nextItems)
  return deleted
}

async function createRegulatoryChangeActionJSON(service, changeItemId, userId, actionData) {
  const actions = await loadRegulatoryChangeActionsJSON(service)
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
  await saveRegulatoryChangeActionsJSON(service, actions)
  return { ...newAction }
}

async function getRegulatoryChangeActionsJSON(service, changeItemId) {
  const actions = await loadRegulatoryChangeActionsJSON(service)
  return actions
    .filter(a => String(a.changeItemId) === String(changeItemId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(a => ({ ...a }))
}

module.exports = {
  createRegulatoryChangeActionJSON,
  createRegulatoryChangeItemJSON,
  createWorkflowTemplateJSON,
  deleteRegulatoryChangeItemJSON,
  deleteWorkflowTemplateJSON,
  ensureRegulatoryChangesJSONFiles,
  getRegulatoryChangeActionsJSON,
  getRegulatoryChangeItemByIdJSON,
  getRegulatoryChangeItemsJSON,
  getWorkflowTemplateByIdJSON,
  getWorkflowTemplatesJSON,
  loadRegulatoryChangeActionsJSON,
  loadRegulatoryChangeItemsJSON,
  loadWorkflowTemplatesJSON,
  saveRegulatoryChangeActionsJSON,
  saveRegulatoryChangeItemsJSON,
  saveWorkflowTemplatesJSON,
  updateRegulatoryChangeItemJSON,
  updateWorkflowTemplateJSON
}
