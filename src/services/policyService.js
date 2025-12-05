/**
 * Policy Service
 * Handles policy management with version control, approval workflows, and regulatory citations
 */

const db = require('./dbService')

class PolicyService {
  /**
   * Get all policies for a user
   */
  async getPolicies(userId, filters = {}) {
    try {
      const policies = await db.getPolicies(userId, filters)
      return { success: true, data: policies }
    } catch (error) {
      console.error('[PolicyService] Error getting policies:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a single policy by ID with current version
   */
  async getPolicyById(policyId, userId) {
    try {
      const policy = await db.getPolicyById(policyId, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      // Get the current version if it exists
      if (policy.current_version_id) {
        const currentVersion = await db.getPolicyVersionById(policy.current_version_id)
        policy.currentVersion = currentVersion
      }

      return { success: true, data: policy }
    } catch (error) {
      console.error('[PolicyService] Error getting policy:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a new policy
   */
  async createPolicy(userId, data) {
    try {
      // Validate required fields
      if (!data.title) {
        return { success: false, error: 'Policy title is required' }
      }

      const policy = await db.createPolicy(userId, {
        title: data.title,
        description: data.description,
        category: data.category,
        department: data.department,
        owner: data.owner,
        reviewFrequencyDays: data.reviewFrequencyDays || 365,
        tags: data.tags || [],
        metadata: data.metadata || {}
      })

      // Create initial version if content provided
      if (data.content) {
        const version = await db.createPolicyVersion(policy.id, {
          content: data.content,
          changeSummary: 'Initial version',
          createdBy: userId,
          isMajorChange: true
        })
        policy.currentVersion = version
      }

      return { success: true, data: policy }
    } catch (error) {
      console.error('[PolicyService] Error creating policy:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update policy metadata (not content - use createVersion for content changes)
   */
  async updatePolicy(policyId, userId, updates) {
    try {
      const policy = await db.updatePolicy(policyId, userId, updates)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }
      return { success: true, data: policy }
    } catch (error) {
      console.error('[PolicyService] Error updating policy:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Delete a policy (soft delete)
   */
  async deletePolicy(policyId, userId) {
    try {
      const deleted = await db.deletePolicy(policyId, userId)
      if (!deleted) {
        return { success: false, error: 'Policy not found' }
      }
      return { success: true, message: 'Policy deleted' }
    } catch (error) {
      console.error('[PolicyService] Error deleting policy:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a new version of a policy
   */
  async createPolicyVersion(policyId, userId, data) {
    try {
      // Verify policy exists and belongs to user
      const policy = await db.getPolicyById(policyId, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      // Validate required fields
      if (!data.content) {
        return { success: false, error: 'Version content is required' }
      }

      const version = await db.createPolicyVersion(policyId, {
        content: data.content,
        changeSummary: data.changeSummary || 'No summary provided',
        createdBy: userId,
        isMajorChange: data.isMajorChange || false
      })

      return { success: true, data: version }
    } catch (error) {
      console.error('[PolicyService] Error creating version:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get all versions of a policy
   */
  async getPolicyVersions(policyId, userId) {
    try {
      // Verify policy exists and belongs to user
      const policy = await db.getPolicyById(policyId, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      const versions = await db.getPolicyVersions(policyId)
      return { success: true, data: versions }
    } catch (error) {
      console.error('[PolicyService] Error getting versions:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a specific version of a policy
   */
  async getPolicyVersion(versionId, userId) {
    try {
      const version = await db.getPolicyVersionById(versionId)
      if (!version) {
        return { success: false, error: 'Version not found' }
      }

      // Verify user has access to the policy
      const policy = await db.getPolicyById(version.policy_id, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      // Get citations for this version
      const citations = await db.getPolicyCitations(versionId)
      version.citations = citations

      return { success: true, data: version }
    } catch (error) {
      console.error('[PolicyService] Error getting version:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Approve a policy version (makes it the current version)
   */
  async approveVersion(versionId, userId, approverName) {
    try {
      const version = await db.getPolicyVersionById(versionId)
      if (!version) {
        return { success: false, error: 'Version not found' }
      }

      // Verify user has access to the policy
      const policy = await db.getPolicyById(version.policy_id, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      // Check version is pending approval
      if (version.status !== 'pending') {
        return { success: false, error: 'Version is not pending approval' }
      }

      const approved = await db.approvePolicyVersion(versionId, approverName, userId)

      // Notify the version creator
      if (version.created_by !== userId) {
        await db.createPolicyApprovedNotification(
          version.created_by,
          policy,
          approved,
          approverName
        )
      }

      return { success: true, data: approved }
    } catch (error) {
      console.error('[PolicyService] Error approving version:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Reject a policy version
   */
  async rejectVersion(versionId, userId, reason) {
    try {
      const version = await db.getPolicyVersionById(versionId)
      if (!version) {
        return { success: false, error: 'Version not found' }
      }

      // Verify user has access to the policy
      const policy = await db.getPolicyById(version.policy_id, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      if (version.status !== 'pending') {
        return { success: false, error: 'Version is not pending approval' }
      }

      const rejected = await db.rejectPolicyVersion(versionId, userId, reason)
      return { success: true, data: rejected }
    } catch (error) {
      console.error('[PolicyService] Error rejecting version:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Add a citation to a policy version (link to regulatory update)
   */
  async addCitation(versionId, updateId, userId, data = {}) {
    try {
      const version = await db.getPolicyVersionById(versionId)
      if (!version) {
        return { success: false, error: 'Version not found' }
      }

      // Verify user has access to the policy
      const policy = await db.getPolicyById(version.policy_id, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      const citation = await db.addPolicyCitation(versionId, updateId, {
        citationType: data.citationType || 'reference',
        notes: data.notes,
        sectionReference: data.sectionReference
      })

      return { success: true, data: citation }
    } catch (error) {
      console.error('[PolicyService] Error adding citation:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove a citation from a policy version
   */
  async removeCitation(citationId, userId) {
    try {
      const removed = await db.removePolicyCitation(citationId)
      if (!removed) {
        return { success: false, error: 'Citation not found' }
      }
      return { success: true, message: 'Citation removed' }
    } catch (error) {
      console.error('[PolicyService] Error removing citation:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get policies due for review
   */
  async getPoliciesDueForReview(userId, daysAhead = 30) {
    try {
      const policies = await db.getPoliciesDueForReview(userId, daysAhead)
      return { success: true, data: policies }
    } catch (error) {
      console.error('[PolicyService] Error getting policies due:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Mark a policy as reviewed (resets review date)
   */
  async markPolicyReviewed(policyId, userId, notes) {
    try {
      const policy = await db.getPolicyById(policyId, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      // Calculate next review date based on review frequency
      const nextReviewDate = new Date()
      nextReviewDate.setDate(nextReviewDate.getDate() + (policy.review_frequency_days || 365))

      const updated = await db.updatePolicy(policyId, userId, {
        lastReviewedAt: new Date().toISOString(),
        lastReviewedBy: userId,
        nextReviewDate: nextReviewDate.toISOString(),
        reviewNotes: notes
      })

      return { success: true, data: updated }
    } catch (error) {
      console.error('[PolicyService] Error marking reviewed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get policy statistics
   */
  async getPolicyStats(userId) {
    try {
      const policies = await db.getPolicies(userId)
      const policiesDue = await db.getPoliciesDueForReview(userId, 30)

      const stats = {
        totalPolicies: policies.length,
        activePolicies: 0,
        archivedPolicies: 0,
        draftPolicies: 0,
        reviewsDue: policiesDue.length,
        byCategory: {},
        byDepartment: {}
      }

      for (const policy of policies) {
        // Count by status
        switch (policy.status) {
          case 'active':
            stats.activePolicies++
            break
          case 'archived':
            stats.archivedPolicies++
            break
          case 'draft':
            stats.draftPolicies++
            break
        }

        // Count by category
        if (policy.category) {
          stats.byCategory[policy.category] = (stats.byCategory[policy.category] || 0) + 1
        }

        // Count by department
        if (policy.department) {
          stats.byDepartment[policy.department] = (stats.byDepartment[policy.department] || 0) + 1
        }
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('[PolicyService] Error getting stats:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send review reminders for policies due
   */
  async sendReviewReminders(userId) {
    try {
      const policiesDue = await db.getPoliciesDueForReview(userId, 30)
      const reminders = []

      for (const policy of policiesDue) {
        const daysUntil = Math.ceil(
          (new Date(policy.next_review_date) - new Date()) / (1000 * 60 * 60 * 24)
        )

        await db.createPolicyReviewReminder(userId, policy, daysUntil)
        reminders.push({ policyId: policy.id, title: policy.title, daysUntil })
      }

      return { success: true, data: { remindersSent: reminders.length, reminders } }
    } catch (error) {
      console.error('[PolicyService] Error sending reminders:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Export policy as document
   */
  async exportPolicy(policyId, userId, format = 'markdown') {
    try {
      const policy = await db.getPolicyById(policyId, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      let currentVersion = null
      if (policy.current_version_id) {
        currentVersion = await db.getPolicyVersionById(policy.current_version_id)
      }

      const versions = await db.getPolicyVersions(policyId)

      if (format === 'markdown') {
        let md = `# ${policy.title}\n\n`
        md += `**Category:** ${policy.category || 'N/A'}\n`
        md += `**Department:** ${policy.department || 'N/A'}\n`
        md += `**Owner:** ${policy.owner || 'N/A'}\n`
        md += `**Status:** ${policy.status}\n`
        md += `**Last Reviewed:** ${policy.last_reviewed_at ? new Date(policy.last_reviewed_at).toLocaleDateString() : 'Never'}\n`
        md += `**Next Review:** ${policy.next_review_date ? new Date(policy.next_review_date).toLocaleDateString() : 'Not set'}\n\n`

        if (policy.description) {
          md += `## Description\n\n${policy.description}\n\n`
        }

        if (currentVersion) {
          md += `## Current Version (${currentVersion.version_number})\n\n`
          md += `${currentVersion.content}\n\n`

          if (currentVersion.citations && currentVersion.citations.length > 0) {
            md += `### Citations\n\n`
            for (const citation of currentVersion.citations) {
              md += `- ${citation.update_title} (${citation.citation_type})\n`
            }
            md += '\n'
          }
        }

        if (versions.length > 1) {
          md += `## Version History\n\n`
          for (const v of versions) {
            md += `- **v${v.version_number}** (${new Date(v.created_at).toLocaleDateString()}) - ${v.change_summary}\n`
          }
        }

        md += `\n---\n*Exported from RegCanary on ${new Date().toLocaleDateString()}*`

        return {
          success: true,
          data: md,
          contentType: 'text/markdown',
          filename: `${policy.title.replace(/[^a-z0-9]/gi, '_')}_v${currentVersion?.version_number || '0'}.md`
        }
      }

      // JSON export
      return {
        success: true,
        data: {
          policy,
          currentVersion,
          allVersions: versions,
          exportedAt: new Date().toISOString()
        },
        contentType: 'application/json',
        filename: `${policy.title.replace(/[^a-z0-9]/gi, '_')}_export.json`
      }
    } catch (error) {
      console.error('[PolicyService] Error exporting policy:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Compare two policy versions
   */
  async compareVersions(version1Id, version2Id, userId) {
    try {
      const v1 = await db.getPolicyVersionById(version1Id)
      const v2 = await db.getPolicyVersionById(version2Id)

      if (!v1 || !v2) {
        return { success: false, error: 'One or both versions not found' }
      }

      // Verify same policy
      if (v1.policy_id !== v2.policy_id) {
        return { success: false, error: 'Versions must belong to the same policy' }
      }

      // Verify user has access
      const policy = await db.getPolicyById(v1.policy_id, userId)
      if (!policy) {
        return { success: false, error: 'Policy not found' }
      }

      return {
        success: true,
        data: {
          policy: { id: policy.id, title: policy.title },
          version1: {
            id: v1.id,
            versionNumber: v1.version_number,
            content: v1.content,
            changeSummary: v1.change_summary,
            createdAt: v1.created_at
          },
          version2: {
            id: v2.id,
            versionNumber: v2.version_number,
            content: v2.content,
            changeSummary: v2.change_summary,
            createdAt: v2.created_at
          }
        }
      }
    } catch (error) {
      console.error('[PolicyService] Error comparing versions:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = new PolicyService()
