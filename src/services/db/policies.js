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

function normalizePolicy(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    code: row.code || null,
    category: row.category || null,
    ownerName: row.owner_name || null,
    reviewFrequencyMonths: parseInt(row.review_frequency_months) || 12,
    nextReviewDate: row.next_review_date || null,
    currentVersionId: row.current_version_id || null,
    status: row.status || 'draft',
    versionCount: parseInt(row.version_count) || 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function normalizePolicyVersion(row) {
  if (!row) return null
  return {
    id: row.id,
    policyId: row.policy_id,
    versionNumber: row.version_number,
    content: row.content || null,
    effectiveDate: row.effective_date || null,
    changeSummary: row.change_summary || null,
    triggeredByUpdateId: row.triggered_by_update_id || null,
    approvalStatus: row.approval_status || 'draft',
    approverName: row.approver_name || null,
    approvedAt: toIso(row.approved_at),
    createdBy: row.created_by || null,
    citationCount: parseInt(row.citation_count) || 0,
    createdAt: toIso(row.created_at)
  }
}

function normalizePolicyCitation(row) {
  if (!row) return null
  return {
    id: row.id,
    policyVersionId: row.policy_version_id,
    regulatoryUpdateId: row.regulatory_update_id,
    citationType: row.citation_type || null,
    sectionReference: row.section_reference || null,
    notes: row.notes || null,
    createdAt: toIso(row.created_at),
    // Include update details if joined
    update: row.headline ? {
      id: row.regulatory_update_id,
      headline: row.headline,
      authority: row.authority,
      publishedDate: toIso(row.published_date),
      url: row.url
    } : null
  }
}

module.exports = function applyPoliciesMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    policiesFile: path.join(__dirname, '../../data/policies.json'),
    policyVersionsFile: path.join(__dirname, '../../data/policy_versions.json'),
    policyCitationsFile: path.join(__dirname, '../../data/policy_citations.json'),

    async ensurePoliciesTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        // Policies table
        await client.query(`
          CREATE TABLE IF NOT EXISTS policies (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
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

        // Policy Versions table
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

        // Policy Citations table
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

        console.log('✅ Policies tables ready')
      } catch (error) {
        console.error('❌ Error creating policies tables:', error.message)
      } finally {
        client.release()
      }
    },

    // ===========================================
    // POLICIES CRUD
    // ===========================================
    async getPolicies(userId = 'default', filters = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          let query = `
            SELECT p.*,
              (SELECT COUNT(*) FROM policy_versions v WHERE v.policy_id = p.id) as version_count
            FROM policies p
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
          return result.rows.map(normalizePolicy)
        } catch (error) {
          console.warn('📊 Falling back to JSON for getPolicies:', error.message)
          return this.getPoliciesJSON(userKey, filters)
        } finally {
          client.release()
        }
      }

      return this.getPoliciesJSON(userKey, filters)
    },

    async getPolicyById(policyId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT p.*,
              (SELECT COUNT(*) FROM policy_versions v WHERE v.policy_id = p.id) as version_count
            FROM policies p
            WHERE p.id = $1 AND p.user_id = $2
          `, [policyId, userKey])
          return result.rows.length ? normalizePolicy(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getPolicyByIdJSON(policyId, userKey)
        } finally {
          client.release()
        }
      }

      return this.getPolicyByIdJSON(policyId, userKey)
    },

    async createPolicy(userId = 'default', data = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          // Calculate next review date
          const reviewMonths = data.reviewFrequencyMonths || 12
          const nextReview = new Date()
          nextReview.setMonth(nextReview.getMonth() + reviewMonths)

          const result = await client.query(`
            INSERT INTO policies (
              user_id, name, code, category, owner_name,
              review_frequency_months, next_review_date, status,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', NOW(), NOW())
            RETURNING *
          `, [
            userKey,
            data.name || 'New Policy',
            data.code || null,
            data.category || null,
            data.ownerName || null,
            reviewMonths,
            nextReview.toISOString().split('T')[0]
          ])
          return normalizePolicy(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.createPolicyJSON(userKey, data)
        } finally {
          client.release()
        }
      }

      return this.createPolicyJSON(userKey, data)
    },

    async updatePolicy(policyId, userId = 'default', updates = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const setClauses = []
          const params = [policyId, userKey]
          let paramCount = 2

          const fieldMap = {
            name: 'name',
            code: 'code',
            category: 'category',
            ownerName: 'owner_name',
            reviewFrequencyMonths: 'review_frequency_months',
            nextReviewDate: 'next_review_date',
            currentVersionId: 'current_version_id',
            status: 'status'
          }

          Object.entries(fieldMap).forEach(([jsKey, dbKey]) => {
            if (updates[jsKey] !== undefined) {
              setClauses.push(`${dbKey} = $${++paramCount}`)
              params.push(updates[jsKey])
            }
          })

          if (setClauses.length === 0) {
            return this.getPolicyById(policyId, userId)
          }

          setClauses.push('updated_at = NOW()')

          const result = await client.query(`
            UPDATE policies SET ${setClauses.join(', ')}
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, params)

          return result.rows.length ? normalizePolicy(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.updatePolicyJSON(policyId, userKey, updates)
        } finally {
          client.release()
        }
      }

      return this.updatePolicyJSON(policyId, userKey, updates)
    },

    async deletePolicy(policyId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            UPDATE policies SET status = 'retired', updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, [policyId, userKey])
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.deletePolicyJSON(policyId, userKey)
        } finally {
          client.release()
        }
      }

      return this.deletePolicyJSON(policyId, userKey)
    },

    // ===========================================
    // POLICY VERSIONS
    // ===========================================
    async getPolicyVersions(policyId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT v.*,
              (SELECT COUNT(*) FROM policy_citations c WHERE c.policy_version_id = v.id) as citation_count
            FROM policy_versions v
            WHERE v.policy_id = $1
            ORDER BY v.created_at DESC
          `, [policyId])
          return result.rows.map(normalizePolicyVersion)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getPolicyVersionsJSON(policyId)
        } finally {
          client.release()
        }
      }

      return this.getPolicyVersionsJSON(policyId)
    },

    async getPolicyVersionById(versionId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT v.*,
              (SELECT COUNT(*) FROM policy_citations c WHERE c.policy_version_id = v.id) as citation_count
            FROM policy_versions v
            WHERE v.id = $1
          `, [versionId])
          return result.rows.length ? normalizePolicyVersion(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getPolicyVersionByIdJSON(versionId)
        } finally {
          client.release()
        }
      }

      return this.getPolicyVersionByIdJSON(versionId)
    },

    async createPolicyVersion(policyId, data = {}) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')

          // Get latest version number
          const latestResult = await client.query(`
            SELECT version_number FROM policy_versions
            WHERE policy_id = $1
            ORDER BY created_at DESC
            LIMIT 1
          `, [policyId])

          let newVersionNumber = '1.0'
          if (latestResult.rows.length > 0) {
            const latest = latestResult.rows[0].version_number
            const parts = latest.split('.')
            if (data.changeSummary && data.changeSummary.toLowerCase().includes('major')) {
              newVersionNumber = `${parseInt(parts[0]) + 1}.0`
            } else {
              newVersionNumber = `${parts[0]}.${parseInt(parts[1] || 0) + 1}`
            }
          }

          const result = await client.query(`
            INSERT INTO policy_versions (
              policy_id, version_number, content, effective_date,
              change_summary, triggered_by_update_id, approval_status,
              created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, NOW())
            RETURNING *
          `, [
            policyId,
            data.versionNumber || newVersionNumber,
            data.content || null,
            data.effectiveDate || null,
            data.changeSummary || null,
            data.triggeredByUpdateId || null,
            data.createdBy || null
          ])

          await client.query('COMMIT')
          return normalizePolicyVersion(result.rows[0])
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON:', error.message)
          return this.createPolicyVersionJSON(policyId, data)
        } finally {
          client.release()
        }
      }

      return this.createPolicyVersionJSON(policyId, data)
    },

    async updatePolicyVersion(versionId, updates = {}) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
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

          if (setClauses.length === 0) return this.getPolicyVersionById(versionId)

          const result = await client.query(`
            UPDATE policy_versions SET ${setClauses.join(', ')}
            WHERE id = $1
            RETURNING *
          `, params)

          return result.rows.length ? normalizePolicyVersion(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.updatePolicyVersionJSON(versionId, updates)
        } finally {
          client.release()
        }
      }

      return this.updatePolicyVersionJSON(versionId, updates)
    },

    async approvePolicyVersion(versionId, approverName, userId = 'default') {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')

          // Update the version
          const versionResult = await client.query(`
            UPDATE policy_versions SET
              approval_status = 'approved',
              approver_name = $2,
              approved_at = NOW()
            WHERE id = $1
            RETURNING *
          `, [versionId, approverName])

          if (versionResult.rows.length === 0) {
            await client.query('ROLLBACK')
            return null
          }

          const version = versionResult.rows[0]

          // Update the policy to set this as current version and mark as active
          await client.query(`
            UPDATE policies SET
              current_version_id = $1,
              status = 'active',
              updated_at = NOW()
            WHERE id = $2
          `, [versionId, version.policy_id])

          await client.query('COMMIT')
          return normalizePolicyVersion(version)
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON:', error.message)
          return this.approvePolicyVersionJSON(versionId, approverName, userId)
        } finally {
          client.release()
        }
      }

      return this.approvePolicyVersionJSON(versionId, approverName, userId)
    },

    // ===========================================
    // POLICY CITATIONS
    // ===========================================
    async getPolicyCitations(versionId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT c.*, u.headline, u.authority, u.published_date, u.url
            FROM policy_citations c
            LEFT JOIN regulatory_updates u ON c.regulatory_update_id = u.id
            WHERE c.policy_version_id = $1
            ORDER BY c.created_at DESC
          `, [versionId])
          return result.rows.map(normalizePolicyCitation)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getPolicyCitationsJSON(versionId)
        } finally {
          client.release()
        }
      }

      return this.getPolicyCitationsJSON(versionId)
    },

    async addPolicyCitation(versionId, updateId, data = {}) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
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
          return normalizePolicyCitation(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.addPolicyCitationJSON(versionId, updateId, data)
        } finally {
          client.release()
        }
      }

      return this.addPolicyCitationJSON(versionId, updateId, data)
    },

    async removePolicyCitation(citationId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            DELETE FROM policy_citations WHERE id = $1 RETURNING *
          `, [citationId])
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.removePolicyCitationJSON(citationId)
        } finally {
          client.release()
        }
      }

      return this.removePolicyCitationJSON(citationId)
    },

    // ===========================================
    // REVIEW DUE POLICIES
    // ===========================================
    async getPoliciesDueForReview(userId = 'default', daysAhead = 30) {
      await this.initialize()
      const userKey = String(userId || 'default')

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + daysAhead)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT p.*,
              (SELECT COUNT(*) FROM policy_versions v WHERE v.policy_id = p.id) as version_count
            FROM policies p
            WHERE p.user_id = $1
              AND p.status = 'active'
              AND p.next_review_date <= $2
            ORDER BY p.next_review_date ASC
          `, [userKey, dueDate.toISOString().split('T')[0]])
          return result.rows.map(normalizePolicy)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getPoliciesDueForReviewJSON(userKey, daysAhead)
        } finally {
          client.release()
        }
      }

      return this.getPoliciesDueForReviewJSON(userKey, daysAhead)
    },

    // ===========================================
    // JSON FALLBACK HELPERS
    // ===========================================
    async loadPoliciesJSON() {
      try {
        const raw = await fs.readFile(this.policiesFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensurePoliciesJSONFiles()
          return []
        }
        throw error
      }
    },

    async savePoliciesJSON(data) {
      await fs.writeFile(this.policiesFile, JSON.stringify(data, null, 2))
    },

    async loadPolicyVersionsJSON() {
      try {
        const raw = await fs.readFile(this.policyVersionsFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensurePoliciesJSONFiles()
          return []
        }
        throw error
      }
    },

    async savePolicyVersionsJSON(data) {
      await fs.writeFile(this.policyVersionsFile, JSON.stringify(data, null, 2))
    },

    async loadPolicyCitationsJSON() {
      try {
        const raw = await fs.readFile(this.policyCitationsFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensurePoliciesJSONFiles()
          return []
        }
        throw error
      }
    },

    async savePolicyCitationsJSON(data) {
      await fs.writeFile(this.policyCitationsFile, JSON.stringify(data, null, 2))
    },

    async ensurePoliciesJSONFiles() {
      const dir = path.dirname(this.policiesFile)
      await fs.mkdir(dir, { recursive: true })

      for (const file of [this.policiesFile, this.policyVersionsFile, this.policyCitationsFile]) {
        try {
          await fs.access(file)
        } catch {
          await fs.writeFile(file, JSON.stringify([], null, 2))
        }
      }
    },

    async getPoliciesJSON(userId, filters = {}) {
      const policies = await this.loadPoliciesJSON()
      const versions = await this.loadPolicyVersionsJSON()

      let filtered = policies.filter(p => p.userId === userId)

      if (filters.status) {
        filtered = filtered.filter(p => p.status === filters.status)
      }

      if (filters.category) {
        filtered = filtered.filter(p => p.category === filters.category)
      }

      if (filters.reviewDueBefore) {
        const dueDate = new Date(filters.reviewDueBefore)
        filtered = filtered.filter(p => p.nextReviewDate && new Date(p.nextReviewDate) <= dueDate)
      }

      return filtered.map(p => ({
        ...p,
        versionCount: versions.filter(v => String(v.policyId) === String(p.id)).length
      }))
    },

    async getPolicyByIdJSON(policyId, userId) {
      const policies = await this.loadPoliciesJSON()
      const versions = await this.loadPolicyVersionsJSON()

      const policy = policies.find(p =>
        String(p.id) === String(policyId) && p.userId === userId
      )

      if (!policy) return null

      return {
        ...policy,
        versionCount: versions.filter(v => String(v.policyId) === String(policy.id)).length
      }
    },

    async createPolicyJSON(userId, data) {
      const policies = await this.loadPoliciesJSON()
      const now = new Date().toISOString()

      const reviewMonths = data.reviewFrequencyMonths || 12
      const nextReview = new Date()
      nextReview.setMonth(nextReview.getMonth() + reviewMonths)

      const newPolicy = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pol-${Date.now()}`,
        userId,
        name: data.name || 'New Policy',
        code: data.code || null,
        category: data.category || null,
        ownerName: data.ownerName || null,
        reviewFrequencyMonths: reviewMonths,
        nextReviewDate: nextReview.toISOString().split('T')[0],
        currentVersionId: null,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }

      policies.push(newPolicy)
      await this.savePoliciesJSON(policies)
      return { ...newPolicy, versionCount: 0 }
    },

    async updatePolicyJSON(policyId, userId, updates) {
      const policies = await this.loadPoliciesJSON()
      let updated = null

      const nextPolicies = policies.map(p => {
        if (String(p.id) === String(policyId) && p.userId === userId) {
          updated = { ...p, ...updates, updatedAt: new Date().toISOString() }
          return updated
        }
        return p
      })

      if (updated) await this.savePoliciesJSON(nextPolicies)
      return updated
    },

    async deletePolicyJSON(policyId, userId) {
      const policies = await this.loadPoliciesJSON()
      let deleted = false

      const nextPolicies = policies.map(p => {
        if (String(p.id) === String(policyId) && p.userId === userId) {
          deleted = true
          return { ...p, status: 'retired', updatedAt: new Date().toISOString() }
        }
        return p
      })

      if (deleted) await this.savePoliciesJSON(nextPolicies)
      return deleted
    },

    async getPolicyVersionsJSON(policyId) {
      const versions = await this.loadPolicyVersionsJSON()
      const citations = await this.loadPolicyCitationsJSON()

      return versions
        .filter(v => String(v.policyId) === String(policyId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(v => ({
          ...v,
          citationCount: citations.filter(c => String(c.policyVersionId) === String(v.id)).length
        }))
    },

    async getPolicyVersionByIdJSON(versionId) {
      const versions = await this.loadPolicyVersionsJSON()
      const citations = await this.loadPolicyCitationsJSON()

      const version = versions.find(v => String(v.id) === String(versionId))
      if (!version) return null

      return {
        ...version,
        citationCount: citations.filter(c => String(c.policyVersionId) === String(version.id)).length
      }
    },

    async createPolicyVersionJSON(policyId, data) {
      const versions = await this.loadPolicyVersionsJSON()
      const now = new Date().toISOString()

      // Get latest version number
      const policyVersions = versions.filter(v => String(v.policyId) === String(policyId))
      let newVersionNumber = '1.0'
      if (policyVersions.length > 0) {
        const latest = policyVersions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        const parts = latest.versionNumber.split('.')
        if (data.changeSummary && data.changeSummary.toLowerCase().includes('major')) {
          newVersionNumber = `${parseInt(parts[0]) + 1}.0`
        } else {
          newVersionNumber = `${parts[0]}.${parseInt(parts[1] || 0) + 1}`
        }
      }

      const newVersion = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pv-${Date.now()}`,
        policyId,
        versionNumber: data.versionNumber || newVersionNumber,
        content: data.content || null,
        effectiveDate: data.effectiveDate || null,
        changeSummary: data.changeSummary || null,
        triggeredByUpdateId: data.triggeredByUpdateId || null,
        approvalStatus: 'draft',
        approverName: null,
        approvedAt: null,
        createdBy: data.createdBy || null,
        createdAt: now
      }

      versions.push(newVersion)
      await this.savePolicyVersionsJSON(versions)
      return { ...newVersion, citationCount: 0 }
    },

    async updatePolicyVersionJSON(versionId, updates) {
      const versions = await this.loadPolicyVersionsJSON()
      let updated = null

      const nextVersions = versions.map(v => {
        if (String(v.id) === String(versionId)) {
          updated = { ...v, ...updates }
          return updated
        }
        return v
      })

      if (updated) await this.savePolicyVersionsJSON(nextVersions)
      return updated
    },

    async approvePolicyVersionJSON(versionId, approverName, userId) {
      const versions = await this.loadPolicyVersionsJSON()
      const policies = await this.loadPoliciesJSON()
      const now = new Date().toISOString()

      let updatedVersion = null
      const nextVersions = versions.map(v => {
        if (String(v.id) === String(versionId)) {
          updatedVersion = {
            ...v,
            approvalStatus: 'approved',
            approverName,
            approvedAt: now
          }
          return updatedVersion
        }
        return v
      })

      if (!updatedVersion) return null

      await this.savePolicyVersionsJSON(nextVersions)

      // Update policy
      const nextPolicies = policies.map(p => {
        if (String(p.id) === String(updatedVersion.policyId)) {
          return { ...p, currentVersionId: versionId, status: 'active', updatedAt: now }
        }
        return p
      })
      await this.savePoliciesJSON(nextPolicies)

      return updatedVersion
    },

    async getPolicyCitationsJSON(versionId) {
      const citations = await this.loadPolicyCitationsJSON()
      return citations.filter(c => String(c.policyVersionId) === String(versionId))
    },

    async addPolicyCitationJSON(versionId, updateId, data) {
      const citations = await this.loadPolicyCitationsJSON()
      const now = new Date().toISOString()

      // Check for existing
      const existingIndex = citations.findIndex(c =>
        String(c.policyVersionId) === String(versionId) &&
        String(c.regulatoryUpdateId) === String(updateId)
      )

      const newCitation = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pc-${Date.now()}`,
        policyVersionId: versionId,
        regulatoryUpdateId: updateId,
        citationType: data.citationType || null,
        sectionReference: data.sectionReference || null,
        notes: data.notes || null,
        createdAt: now
      }

      if (existingIndex >= 0) {
        citations[existingIndex] = {
          ...citations[existingIndex],
          citationType: data.citationType || citations[existingIndex].citationType,
          sectionReference: data.sectionReference || citations[existingIndex].sectionReference,
          notes: data.notes || citations[existingIndex].notes
        }
      } else {
        citations.push(newCitation)
      }

      await this.savePolicyCitationsJSON(citations)
      return existingIndex >= 0 ? citations[existingIndex] : newCitation
    },

    async removePolicyCitationJSON(citationId) {
      const citations = await this.loadPolicyCitationsJSON()
      const nextCitations = citations.filter(c => String(c.id) !== String(citationId))

      if (nextCitations.length < citations.length) {
        await this.savePolicyCitationsJSON(nextCitations)
        return true
      }
      return false
    },

    async getPoliciesDueForReviewJSON(userId, daysAhead) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + daysAhead)

      const policies = await this.loadPoliciesJSON()
      const versions = await this.loadPolicyVersionsJSON()

      return policies
        .filter(p =>
          p.userId === userId &&
          p.status === 'active' &&
          p.nextReviewDate &&
          new Date(p.nextReviewDate) <= dueDate
        )
        .map(p => ({
          ...p,
          versionCount: versions.filter(v => String(v.policyId) === String(p.id)).length
        }))
    }
  })
}
