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

module.exports = { normalizeRegulatoryChangeItemInput }
