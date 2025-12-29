const POLICY_UPDATE_FIELDS = {
  name: 'name',
  description: 'description',
  code: 'code',
  category: 'category',
  ownerName: 'owner_name',
  reviewFrequencyMonths: 'review_frequency_months',
  nextReviewDate: 'next_review_date',
  currentVersionId: 'current_version_id',
  status: 'status'
}

async function ensurePoliciesTables(client) {
  await client.query(`
          CREATE TABLE IF NOT EXISTS policies (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            code VARCHAR(50),
            category VARCHAR(100),
            owner_name VARCHAR(255),
            review_frequency_months INTEGER DEFAULT 12,
            next_review_date DATE,
            current_version_id BIGINT,
            status VARCHAR(30) DEFAULT 'draft',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

  await client.query(`
          ALTER TABLE policies
            ADD COLUMN IF NOT EXISTS description TEXT
        `)

  await client.query(`
          CREATE INDEX IF NOT EXISTS idx_policies_user
          ON policies(user_id, status)
        `)

  await client.query(`
          CREATE INDEX IF NOT EXISTS idx_policies_category
          ON policies(category)
        `)

  await client.query(`
          CREATE INDEX IF NOT EXISTS idx_policies_review
          ON policies(next_review_date)
        `)

  await client.query(`
          CREATE TABLE IF NOT EXISTS policy_versions (
            id BIGSERIAL PRIMARY KEY,
            policy_id BIGINT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
            version_number VARCHAR(20) NOT NULL,
            content TEXT,
            effective_date DATE,
            change_summary TEXT,
            triggered_by_update_id BIGINT,
            approval_status VARCHAR(30) DEFAULT 'draft',
            approver_name VARCHAR(255),
            approved_at TIMESTAMP WITHOUT TIME ZONE,
            created_by VARCHAR(255),
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

  await client.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_versions_policy
          ON policy_versions(policy_id)
        `)

  await client.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_versions_status
          ON policy_versions(approval_status)
        `)

  await client.query(`
          CREATE TABLE IF NOT EXISTS policy_citations (
            id BIGSERIAL PRIMARY KEY,
            policy_version_id BIGINT NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
            regulatory_update_id BIGINT NOT NULL,
            citation_type VARCHAR(30),
            section_reference VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(policy_version_id, regulatory_update_id)
          )
        `)

  await client.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_citations_version
          ON policy_citations(policy_version_id)
        `)

  await client.query(`
          CREATE INDEX IF NOT EXISTS idx_policy_citations_update
          ON policy_citations(regulatory_update_id)
        `)
}

async function getPolicies(client, userKey, filters = {}) {
  let query = `
            SELECT p.*,
              (SELECT COUNT(*) FROM policy_versions v WHERE v.policy_id = p.id) as version_count,
              cv.version_number as current_version,
              cv.effective_date as effective_date,
              COALESCE((SELECT COUNT(*) FROM policy_citations c WHERE c.policy_version_id = p.current_version_id), 0) as citation_count
            FROM policies p
            LEFT JOIN policy_versions cv ON cv.id = p.current_version_id
            WHERE p.user_id = $1
          `
  const params = [userKey]
  let paramCount = 1

  if (filters.status) {
    query += ` AND p.status = $${++paramCount}`
    params.push(filters.status)
  }

  if (filters.category) {
    query += ` AND p.category = $${++paramCount}`
    params.push(filters.category)
  }

  if (filters.reviewDueBefore) {
    query += ` AND p.next_review_date <= $${++paramCount}`
    params.push(filters.reviewDueBefore)
  }

  query += ` ORDER BY p.name ASC`

  const result = await client.query(query, params)
  return result.rows
}

async function getPolicyById(client, policyId, userKey) {
  const result = await client.query(`
            SELECT p.*,
              (SELECT COUNT(*) FROM policy_versions v WHERE v.policy_id = p.id) as version_count,
              cv.version_number as current_version,
              cv.effective_date as effective_date,
              COALESCE((SELECT COUNT(*) FROM policy_citations c WHERE c.policy_version_id = p.current_version_id), 0) as citation_count
            FROM policies p
            LEFT JOIN policy_versions cv ON cv.id = p.current_version_id
            WHERE p.id = $1 AND p.user_id = $2
          `, [policyId, userKey])
  return result.rows
}

async function createPolicy(client, userKey, data, reviewMonths, nextReviewValue) {
  const result = await client.query(`
            INSERT INTO policies (
              user_id, name, description, code, category, owner_name,
              review_frequency_months, next_review_date, status,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', NOW(), NOW())
            RETURNING *
          `, [
    userKey,
    data.name || data.title || 'New Policy',
    data.description || null,
    data.code || null,
    data.category || null,
    data.ownerName || data.owner || null,
    reviewMonths,
    nextReviewValue
  ])
  return result.rows
}

async function updatePolicy(client, policyId, userKey, updates = {}) {
  const setClauses = []
  const params = [policyId, userKey]
  let paramCount = 2

  Object.entries(POLICY_UPDATE_FIELDS).forEach(([jsKey, dbKey]) => {
    if (updates[jsKey] !== undefined) {
      setClauses.push(`${dbKey} = $${++paramCount}`)
      params.push(updates[jsKey])
    }
  })

  if (setClauses.length === 0) {
    return { updated: false, row: null }
  }

  setClauses.push('updated_at = NOW()')

  const result = await client.query(`
            UPDATE policies SET ${setClauses.join(', ')}
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, params)

  return { updated: true, row: result.rows[0] || null }
}

async function retirePolicy(client, policyId, userKey) {
  const result = await client.query(`
            UPDATE policies SET status = 'retired', updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, [policyId, userKey])
  return result.rows
}

async function getPolicyVersions(client, policyId) {
  const result = await client.query(`
            SELECT v.*,
              (SELECT COUNT(*) FROM policy_citations c WHERE c.policy_version_id = v.id) as citation_count
            FROM policy_versions v
            WHERE v.policy_id = $1
            ORDER BY v.created_at DESC
          `, [policyId])
  return result.rows
}

async function getPolicyVersionById(client, versionId) {
  const result = await client.query(`
            SELECT v.*,
              (SELECT COUNT(*) FROM policy_citations c WHERE c.policy_version_id = v.id) as citation_count
            FROM policy_versions v
            WHERE v.id = $1
          `, [versionId])
  return result.rows
}

async function getLatestPolicyVersionNumber(client, policyId) {
  const result = await client.query(`
            SELECT version_number FROM policy_versions
            WHERE policy_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `, [policyId])
  return result.rows[0]?.version_number
}

async function createPolicyVersion(client, policyId, data, versionNumber) {
  const result = await client.query(`
            INSERT INTO policy_versions (
              policy_id, version_number, content, effective_date,
              change_summary, triggered_by_update_id, approval_status,
              created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, NOW())
            RETURNING *
          `, [
    policyId,
    versionNumber,
    data.content || null,
    data.effectiveDate || null,
    data.changeSummary || null,
    data.triggeredByUpdateId || null,
    data.createdBy || null
  ])
  return result.rows
}

async function updatePolicyVersion(client, versionId, updates = {}) {
  const setClauses = []
  const params = [versionId]
  let paramCount = 1

  if (updates.content !== undefined) {
    setClauses.push(`content = $${++paramCount}`)
    params.push(updates.content)
  }
  if (updates.effectiveDate !== undefined) {
    setClauses.push(`effective_date = $${++paramCount}`)
    params.push(updates.effectiveDate)
  }
  if (updates.changeSummary !== undefined) {
    setClauses.push(`change_summary = $${++paramCount}`)
    params.push(updates.changeSummary)
  }
  if (updates.approvalStatus !== undefined) {
    setClauses.push(`approval_status = $${++paramCount}`)
    params.push(updates.approvalStatus)
  }
  if (updates.approverName !== undefined) {
    setClauses.push(`approver_name = $${++paramCount}`)
    params.push(updates.approverName)
  }
  if (updates.approvedAt !== undefined) {
    setClauses.push(`approved_at = $${++paramCount}`)
    params.push(updates.approvedAt)
  }

  if (setClauses.length === 0) {
    return { updated: false, row: null }
  }

  const result = await client.query(`
            UPDATE policy_versions SET ${setClauses.join(', ')}
            WHERE id = $1
            RETURNING *
          `, params)

  return { updated: true, row: result.rows[0] || null }
}

async function approvePolicyVersion(client, versionId, approverName) {
  const result = await client.query(`
            UPDATE policy_versions SET
              approval_status = 'approved',
              approver_name = $2,
              approved_at = NOW()
            WHERE id = $1
            RETURNING *
          `, [versionId, approverName])
  return result.rows
}

async function setPolicyCurrentVersion(client, policyId, versionId) {
  await client.query(`
            UPDATE policies SET
              current_version_id = $1,
              status = 'active',
              updated_at = NOW()
            WHERE id = $2
          `, [versionId, policyId])
}

async function getPolicyCitations(client, versionId) {
  const result = await client.query(`
            SELECT c.*, u.headline, u.authority, u.published_date, u.url
            FROM policy_citations c
            LEFT JOIN regulatory_updates u ON c.regulatory_update_id = u.id
            WHERE c.policy_version_id = $1
            ORDER BY c.created_at DESC
          `, [versionId])
  return result.rows
}

async function addPolicyCitation(client, versionId, updateId, data) {
  const result = await client.query(`
            INSERT INTO policy_citations (
              policy_version_id, regulatory_update_id, citation_type,
              section_reference, notes, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (policy_version_id, regulatory_update_id) DO UPDATE SET
              citation_type = COALESCE(EXCLUDED.citation_type, policy_citations.citation_type),
              section_reference = COALESCE(EXCLUDED.section_reference, policy_citations.section_reference),
              notes = COALESCE(EXCLUDED.notes, policy_citations.notes)
            RETURNING *
          `, [
    versionId,
    updateId,
    data.citationType || null,
    data.sectionReference || null,
    data.notes || null
  ])
  return result.rows
}

async function removePolicyCitation(client, citationId) {
  const result = await client.query(`
            DELETE FROM policy_citations WHERE id = $1 RETURNING *
          `, [citationId])
  return result.rows
}

async function getPoliciesDueForReview(client, userKey, dueDate) {
  const result = await client.query(`
            SELECT p.*,
              (SELECT COUNT(*) FROM policy_versions v WHERE v.policy_id = p.id) as version_count
            FROM policies p
            WHERE p.user_id = $1
              AND p.status = 'active'
              AND p.next_review_date <= $2
            ORDER BY p.next_review_date ASC
          `, [userKey, dueDate])
  return result.rows
}

module.exports = {
  ensurePoliciesTables,
  getPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  retirePolicy,
  getPolicyVersions,
  getPolicyVersionById,
  getLatestPolicyVersionNumber,
  createPolicyVersion,
  updatePolicyVersion,
  approvePolicyVersion,
  setPolicyCurrentVersion,
  getPolicyCitations,
  addPolicyCitation,
  removePolicyCitation,
  getPoliciesDueForReview
}
