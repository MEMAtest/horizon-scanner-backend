function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizePolicy(row) {
  if (!row) return null
  const userId = row.user_id || row.userId
  const title = row.title || row.name
  const ownerName = row.owner_name || row.ownerName || row.owner || null
  const reviewFrequencyMonths = parseInt(row.review_frequency_months || row.reviewFrequencyMonths) || 12
  const nextReviewDate = row.next_review_date || row.nextReviewDate || null
  const currentVersionId = row.current_version_id || row.currentVersionId || null
  const versionCount = parseInt(row.version_count || row.versionCount) || 0
  const citationCount = parseInt(row.citation_count || row.citationCount) || 0
  const createdAt = toIso(row.created_at || row.createdAt)
  const updatedAt = toIso(row.updated_at || row.updatedAt)
  return {
    id: row.id,
    userId,
    user_id: userId,
    title,
    name: row.name || title,
    code: row.code || null,
    category: row.category || null,
    description: row.description || null,
    owner: ownerName,
    ownerName,
    owner_name: ownerName,
    reviewFrequencyMonths,
    review_frequency_months: reviewFrequencyMonths,
    nextReviewDate,
    next_review_date: nextReviewDate,
    currentVersionId,
    current_version_id: currentVersionId,
    current_version: row.current_version || row.currentVersion || null,
    effective_date: row.effective_date || row.effectiveDate || null,
    citationCount,
    citation_count: citationCount,
    status: row.status || 'draft',
    versionCount,
    version_count: versionCount,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt
  }
}

function normalizePolicyVersion(row) {
  if (!row) return null
  const policyId = row.policy_id || row.policyId
  const versionNumber = row.version_number || row.versionNumber
  const approvalStatus = row.approval_status || row.approvalStatus || row.status || 'draft'
  const approverName = row.approver_name || row.approverName || row.approved_by || row.approvedBy || null
  const createdBy = row.created_by || row.createdBy || null
  const createdAt = toIso(row.created_at || row.createdAt)
  const approvedAt = toIso(row.approved_at || row.approvedAt)
  const citationCount = parseInt(row.citation_count || row.citationCount) || 0
  return {
    id: row.id,
    policyId,
    policy_id: policyId,
    versionNumber,
    version_number: versionNumber,
    content: row.content || null,
    effectiveDate: row.effective_date || row.effectiveDate || null,
    effective_date: row.effective_date || row.effectiveDate || null,
    changeSummary: row.change_summary || row.changeSummary || null,
    change_summary: row.change_summary || row.changeSummary || null,
    triggeredByUpdateId: row.triggered_by_update_id || row.triggeredByUpdateId || null,
    triggered_by_update_id: row.triggered_by_update_id || row.triggeredByUpdateId || null,
    approvalStatus,
    approval_status: approvalStatus,
    status: approvalStatus,
    approverName,
    approver_name: approverName,
    approvedBy: approverName,
    approved_by: approverName,
    approvedAt,
    approved_at: approvedAt,
    createdBy,
    created_by: createdBy,
    citationCount,
    citation_count: citationCount,
    createdAt,
    created_at: createdAt
  }
}

function normalizePolicyCitation(row) {
  if (!row) return null
  const policyVersionId = row.policy_version_id || row.policyVersionId
  const regulatoryUpdateId = row.regulatory_update_id || row.regulatoryUpdateId || row.update_id || row.updateId
  const createdAt = toIso(row.created_at || row.createdAt)
  const update = row.headline ? {
    id: regulatoryUpdateId,
    headline: row.headline,
    authority: row.authority,
    publishedDate: toIso(row.published_date),
    url: row.url
  } : row.update || null
  const citationText = row.citation_text || row.citationText || row.notes || row.section_reference || row.sectionReference || null
  return {
    id: row.id,
    policyVersionId,
    policy_version_id: policyVersionId,
    regulatoryUpdateId,
    regulatory_update_id: regulatoryUpdateId,
    updateId: regulatoryUpdateId,
    update_id: regulatoryUpdateId,
    citationType: row.citation_type || row.citationType || null,
    citation_type: row.citation_type || row.citationType || null,
    sectionReference: row.section_reference || row.sectionReference || null,
    section_reference: row.section_reference || row.sectionReference || null,
    notes: row.notes || null,
    citationText,
    citation_text: citationText,
    createdAt,
    created_at: createdAt,
    update,
    update_title: update ? update.headline : null,
    update_source: update ? update.authority : null,
    update_url: update ? update.url : null
  }
}

module.exports = {
  toIso,
  normalizePolicy,
  normalizePolicyVersion,
  normalizePolicyCitation
}
