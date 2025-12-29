const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

const {
  normalizePolicy,
  normalizePolicyVersion,
  normalizePolicyCitation
} = require('./mappers')
const {
  resolveReviewSchedule,
  normalizePolicyUpdates,
  deriveNextVersionNumber
} = require('./validators')
const queries = require('./queries')

module.exports = function applyPoliciesMethods(EnhancedDBService) {
  const dataDir = path.join(__dirname, '../../../data')

  Object.assign(EnhancedDBService.prototype, {
    policiesFile: path.join(dataDir, 'policies.json'),
    policyVersionsFile: path.join(dataDir, 'policy_versions.json'),
    policyCitationsFile: path.join(dataDir, 'policy_citations.json'),

    async ensurePoliciesTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        await queries.ensurePoliciesTables(client)
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
          const rows = await queries.getPolicies(client, userKey, filters)
          return rows.map(normalizePolicy)
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
          const rows = await queries.getPolicyById(client, policyId, userKey)
          return rows.length ? normalizePolicy(rows[0]) : null
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
      const { reviewMonths, nextReviewValue } = resolveReviewSchedule(data)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const rows = await queries.createPolicy(client, userKey, data, reviewMonths, nextReviewValue)
          return normalizePolicy(rows[0])
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
          const { updated, row } = await queries.updatePolicy(client, policyId, userKey, updates)

          if (!updated) {
            return this.getPolicyById(policyId, userId)
          }

          return row ? normalizePolicy(row) : null
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
          const rows = await queries.retirePolicy(client, policyId, userKey)
          return rows.length > 0
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
          const rows = await queries.getPolicyVersions(client, policyId)
          return rows.map(normalizePolicyVersion)
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
          const rows = await queries.getPolicyVersionById(client, versionId)
          return rows.length ? normalizePolicyVersion(rows[0]) : null
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

          const latestVersionNumber = await queries.getLatestPolicyVersionNumber(client, policyId)

          let newVersionNumber = '1.0'
          if (latestVersionNumber) {
            newVersionNumber = deriveNextVersionNumber(latestVersionNumber, data.changeSummary)
          }

          const rows = await queries.createPolicyVersion(
            client,
            policyId,
            data,
            data.versionNumber || newVersionNumber
          )

          await client.query('COMMIT')
          return normalizePolicyVersion(rows[0])
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
          const { updated, row } = await queries.updatePolicyVersion(client, versionId, updates)

          if (!updated) return this.getPolicyVersionById(versionId)

          return row ? normalizePolicyVersion(row) : null
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

          const rows = await queries.approvePolicyVersion(client, versionId, approverName)

          if (rows.length === 0) {
            await client.query('ROLLBACK')
            return null
          }

          const version = rows[0]

          await queries.setPolicyCurrentVersion(client, version.policy_id, versionId)

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
          const rows = await queries.getPolicyCitations(client, versionId)
          return rows.map(normalizePolicyCitation)
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
          const rows = await queries.addPolicyCitation(client, versionId, updateId, data)
          return normalizePolicyCitation(rows[0])
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
          const rows = await queries.removePolicyCitation(client, citationId)
          return rows.length > 0
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
          const rows = await queries.getPoliciesDueForReview(
            client,
            userKey,
            dueDate.toISOString().split('T')[0]
          )
          return rows.map(normalizePolicy)
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
      const citations = await this.loadPolicyCitationsJSON()

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

      return filtered.map(policy => {
        const policyVersions = versions
          .filter(v => String(v.policyId) === String(policy.id))
          .slice()
          .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))
        const versionCount = policyVersions.length
        const currentVersionId = policy.currentVersionId || policy.current_version_id || null
        const resolvedCurrent = currentVersionId
          ? policyVersions.find(v => String(v.id) === String(currentVersionId))
          : (policyVersions.length > 0 ? policyVersions[0] : null)

        const citationCount = resolvedCurrent
          ? citations.filter(c => String(c.policyVersionId) === String(resolvedCurrent.id)).length
          : 0

        return normalizePolicy({
          ...policy,
          versionCount,
          currentVersionId: resolvedCurrent ? resolvedCurrent.id : currentVersionId,
          current_version: resolvedCurrent ? (resolvedCurrent.versionNumber || resolvedCurrent.version_number) : null,
          effective_date: resolvedCurrent ? (resolvedCurrent.effectiveDate || resolvedCurrent.effective_date) : null,
          citation_count: citationCount
        })
      })
    },

    async getPolicyByIdJSON(policyId, userId) {
      const policies = await this.loadPoliciesJSON()
      const versions = await this.loadPolicyVersionsJSON()
      const citations = await this.loadPolicyCitationsJSON()

      const policy = policies.find(p =>
        String(p.id) === String(policyId) && p.userId === userId
      )

      if (!policy) return null

      const policyVersions = versions.filter(v => String(v.policyId) === String(policy.id))
        .slice()
        .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))
      const versionCount = policyVersions.length
      const currentVersionId = policy.currentVersionId || policy.current_version_id || null
      const resolvedCurrent = currentVersionId
        ? policyVersions.find(v => String(v.id) === String(currentVersionId))
        : (policyVersions.length > 0 ? policyVersions[0] : null)

      const citationCount = resolvedCurrent
        ? citations.filter(c => String(c.policyVersionId) === String(resolvedCurrent.id)).length
        : 0

      return normalizePolicy({
        ...policy,
        versionCount,
        currentVersionId: resolvedCurrent ? resolvedCurrent.id : currentVersionId,
        current_version: resolvedCurrent ? (resolvedCurrent.versionNumber || resolvedCurrent.version_number) : null,
        effective_date: resolvedCurrent ? (resolvedCurrent.effectiveDate || resolvedCurrent.effective_date) : null,
        citation_count: citationCount
      })
    },

    async createPolicyJSON(userId, data) {
      const policies = await this.loadPoliciesJSON()
      const now = new Date().toISOString()

      const { reviewMonths, nextReviewValue } = resolveReviewSchedule(data)

      const newPolicy = {
        id: crypto.randomUUID ? crypto.randomUUID() : `pol-${Date.now()}`,
        userId,
        title: data.title || data.name || 'New Policy',
        name: data.name || data.title || 'New Policy',
        description: data.description || null,
        code: data.code || null,
        category: data.category || null,
        owner: data.owner || data.ownerName || null,
        ownerName: data.ownerName || data.owner || null,
        reviewFrequencyMonths: reviewMonths,
        nextReviewDate: nextReviewValue,
        currentVersionId: null,
        status: 'draft',
        createdAt: now,
        updatedAt: now
      }

      policies.push(newPolicy)
      await this.savePoliciesJSON(policies)
      return normalizePolicy({ ...newPolicy, versionCount: 0 })
    },

    async updatePolicyJSON(policyId, userId, updates) {
      const policies = await this.loadPoliciesJSON()
      const normalizedUpdates = normalizePolicyUpdates(updates)

      let updated = null

      const nextPolicies = policies.map(p => {
        if (String(p.id) === String(policyId) && p.userId === userId) {
          updated = { ...p, ...normalizedUpdates, updatedAt: new Date().toISOString() }
          return updated
        }
        return p
      })

      if (updated) await this.savePoliciesJSON(nextPolicies)
      if (!updated) return null
      const versions = await this.loadPolicyVersionsJSON()
      const versionCount = versions.filter(v => String(v.policyId) === String(updated.id)).length
      return normalizePolicy({ ...updated, versionCount })
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
        .map(v => {
          const citationCount = citations.filter(c => String(c.policyVersionId) === String(v.id)).length
          return normalizePolicyVersion({ ...v, citationCount })
        })
    },

    async getPolicyVersionByIdJSON(versionId) {
      const versions = await this.loadPolicyVersionsJSON()
      const citations = await this.loadPolicyCitationsJSON()

      const version = versions.find(v => String(v.id) === String(versionId))
      if (!version) return null

      const citationCount = citations.filter(c => String(c.policyVersionId) === String(version.id)).length
      return normalizePolicyVersion({ ...version, citationCount })
    },

    async createPolicyVersionJSON(policyId, data) {
      const versions = await this.loadPolicyVersionsJSON()
      const now = new Date().toISOString()

      const policyVersions = versions.filter(v => String(v.policyId) === String(policyId))
      let newVersionNumber = '1.0'
      if (policyVersions.length > 0) {
        const latest = policyVersions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        newVersionNumber = deriveNextVersionNumber(latest.versionNumber, data.changeSummary)
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
      return normalizePolicyVersion({ ...newVersion, citationCount: 0 })
    },

    async updatePolicyVersionJSON(versionId, updates) {
      const versions = await this.loadPolicyVersionsJSON()
      const citations = await this.loadPolicyCitationsJSON()
      let updated = null

      const nextVersions = versions.map(v => {
        if (String(v.id) === String(versionId)) {
          updated = { ...v, ...updates }
          return updated
        }
        return v
      })

      if (updated) await this.savePolicyVersionsJSON(nextVersions)
      if (!updated) return null
      const citationCount = citations.filter(c => String(c.policyVersionId) === String(updated.id)).length
      return normalizePolicyVersion({ ...updated, citationCount })
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

      const nextPolicies = policies.map(p => {
        if (String(p.id) === String(updatedVersion.policyId)) {
          return { ...p, currentVersionId: versionId, status: 'active', updatedAt: now }
        }
        return p
      })
      await this.savePoliciesJSON(nextPolicies)

      return normalizePolicyVersion(updatedVersion)
    },

    async getPolicyCitationsJSON(versionId) {
      const citations = await this.loadPolicyCitationsJSON()
      const updates = await this.loadJSONData(this.updatesFile)
      const updateMap = new Map((Array.isArray(updates) ? updates : []).map(update => [String(update.id), update]))
      return citations
        .filter(c => String(c.policyVersionId) === String(versionId))
        .map(citation => {
          const updateId = citation.regulatoryUpdateId || citation.regulatory_update_id || citation.updateId || citation.update_id
          const update = updateMap.get(String(updateId))
          return normalizePolicyCitation({
            ...citation,
            policy_version_id: citation.policyVersionId,
            regulatory_update_id: updateId,
            citation_type: citation.citationType,
            section_reference: citation.sectionReference,
            created_at: citation.createdAt,
            headline: update?.headline,
            authority: update?.authority,
            published_date: update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt,
            url: update?.url
          })
        })
    },

    async addPolicyCitationJSON(versionId, updateId, data) {
      const citations = await this.loadPolicyCitationsJSON()
      const now = new Date().toISOString()

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
      const updates = await this.loadJSONData(this.updatesFile)
      const updateMap = new Map((Array.isArray(updates) ? updates : []).map(update => [String(update.id), update]))
      const update = updateMap.get(String(updateId))
      const selected = existingIndex >= 0 ? citations[existingIndex] : newCitation
      return normalizePolicyCitation({
        ...selected,
        policy_version_id: selected.policyVersionId,
        regulatory_update_id: updateId,
        citation_type: selected.citationType,
        section_reference: selected.sectionReference,
        created_at: selected.createdAt,
        headline: update?.headline,
        authority: update?.authority,
        published_date: update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt,
        url: update?.url
      })
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
        .map(p => {
          const versionCount = versions.filter(v => String(v.policyId) === String(p.id)).length
          return normalizePolicy({ ...p, versionCount })
        })
    }
  })
}
