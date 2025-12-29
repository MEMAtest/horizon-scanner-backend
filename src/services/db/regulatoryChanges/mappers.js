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
    current_stage: row.current_stage_id || null, // Alias for service layer compatibility
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

module.exports = {
  decorateRegulatoryChangeItem,
  normalizeRegulatoryChangeAction,
  normalizeRegulatoryChangeItem,
  normalizeWorkflowTemplate,
  toIso
}
