/**
 * In-App Notifications Database Operations
 * Provides notification storage and retrieval for alerts related to
 * watch list matches, policy reviews, and workflow updates
 */

const path = require('path')
const fs = require('fs').promises

module.exports = function applyNotificationsMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    notificationsFile: path.join(__dirname, '../../data/in_app_notifications.json'),

    // ==================== PostgreSQL Methods ====================

    async ensureNotificationsTables() {
      if (!this.pool) return

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS in_app_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(500) NOT NULL,
          message TEXT,
          priority VARCHAR(20) DEFAULT 'normal',
          read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMPTZ,
          dismissed BOOLEAN DEFAULT FALSE,
          dismissed_at TIMESTAMPTZ,
          action_url VARCHAR(1000),
          action_label VARCHAR(100),
          reference_type VARCHAR(50),
          reference_id TEXT,
          metadata JSONB DEFAULT '{}',
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON in_app_notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON in_app_notifications(user_id, read);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_dismissed ON in_app_notifications(user_id, dismissed);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON in_app_notifications(type);
        CREATE INDEX IF NOT EXISTS idx_notifications_created ON in_app_notifications(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_reference ON in_app_notifications(reference_type, reference_id);
      `)

      try {
        await this.pool.query(`
          ALTER TABLE in_app_notifications
          ALTER COLUMN reference_id TYPE TEXT
          USING reference_id::text
        `)
      } catch (error) {
        // Ignore if already migrated or unsupported in target environment
      }

      await this.pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_watch_list_match
        ON in_app_notifications(user_id, type, reference_type, reference_id)
        WHERE type = 'watch_list_match' AND reference_type = 'watch_list_match'
      `)

      console.log('[DB] Notifications tables ensured')
    },

    // Get notifications for a user with filters
    async getNotifications(userId, filters = {}) {
      const { unreadOnly, type, limit = 50, offset = 0, includeDismissed = false } = filters

      if (this.pool) {
        let query = `
          SELECT * FROM in_app_notifications
          WHERE user_id = $1
        `
        const params = [userId]
        let paramCount = 1

        if (!includeDismissed) {
          query += ` AND dismissed = FALSE`
        }

        if (unreadOnly) {
          query += ` AND read = FALSE`
        }

        if (type) {
          paramCount++
          query += ` AND type = $${paramCount}`
          params.push(type)
        }

        // Exclude expired notifications
        query += ` AND (expires_at IS NULL OR expires_at > NOW())`

        query += ` ORDER BY
          CASE WHEN read = FALSE THEN 0 ELSE 1 END,
          CASE priority
            WHEN 'urgent' THEN 0
            WHEN 'high' THEN 1
            WHEN 'normal' THEN 2
            WHEN 'low' THEN 3
          END,
          created_at DESC
        `

        paramCount++
        query += ` LIMIT $${paramCount}`
        params.push(limit)

        paramCount++
        query += ` OFFSET $${paramCount}`
        params.push(offset)

        const result = await this.pool.query(query, params)
        return result.rows
      }

      // JSON fallback
      return this.getNotificationsJSON(userId, filters)
    },

    // Get unread count for a user
    async getUnreadNotificationCount(userId) {
      if (this.pool) {
        const result = await this.pool.query(`
          SELECT COUNT(*) as count FROM in_app_notifications
          WHERE user_id = $1
          AND read = FALSE
          AND dismissed = FALSE
          AND (expires_at IS NULL OR expires_at > NOW())
        `, [userId])
        return parseInt(result.rows[0].count, 10)
      }

      // JSON fallback
      const notifications = await this.getNotificationsJSON(userId, { unreadOnly: true })
      return notifications.length
    },

    // Create a notification
    async createNotification(userId, data) {
      const {
        type,
        title,
        message,
        priority = 'normal',
        actionUrl,
        actionLabel,
        referenceType,
        referenceId,
        metadata = {},
        expiresAt
      } = data

      if (this.pool) {
        const normalizedReferenceType = referenceType != null && String(referenceType).trim()
          ? String(referenceType).trim()
          : null
        const normalizedReferenceId = referenceId != null && String(referenceId).trim()
          ? String(referenceId).trim()
          : null

        if (type === 'watch_list_match' && normalizedReferenceType === 'watch_list_match' && normalizedReferenceId) {
          const result = await this.pool.query(`
            INSERT INTO in_app_notifications (
              user_id, type, title, message, priority,
              action_url, action_label, reference_type, reference_id,
              metadata, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (user_id, type, reference_type, reference_id)
              WHERE type = 'watch_list_match' AND reference_type = 'watch_list_match'
            DO UPDATE SET
              title = EXCLUDED.title,
              message = EXCLUDED.message,
              priority = EXCLUDED.priority,
              read = FALSE,
              read_at = NULL,
              dismissed = FALSE,
              dismissed_at = NULL,
              action_url = EXCLUDED.action_url,
              action_label = EXCLUDED.action_label,
              metadata = EXCLUDED.metadata,
              expires_at = EXCLUDED.expires_at,
              created_at = NOW()
            RETURNING *
          `, [
            userId, type, title, message, priority,
            actionUrl, actionLabel, normalizedReferenceType, normalizedReferenceId,
            JSON.stringify(metadata), expiresAt
          ])
          return result.rows[0]
        }

        const result = await this.pool.query(`
            INSERT INTO in_app_notifications (
              user_id, type, title, message, priority,
              action_url, action_label, reference_type, reference_id,
              metadata, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `, [
          userId, type, title, message, priority,
          actionUrl, actionLabel, normalizedReferenceType, normalizedReferenceId,
          JSON.stringify(metadata), expiresAt
        ])
        return result.rows[0]
      }

      // JSON fallback
      return this.createNotificationJSON(userId, data)
    },

    // Mark a notification as read
    async markNotificationRead(notificationId, userId) {
      if (this.pool) {
        const result = await this.pool.query(`
          UPDATE in_app_notifications
          SET read = TRUE, read_at = NOW()
          WHERE id = $1 AND user_id = $2
          RETURNING *
        `, [notificationId, userId])
        return result.rows[0]
      }

      // JSON fallback
      return this.markNotificationReadJSON(notificationId, userId)
    },

    // Mark all notifications as read for a user
    async markAllNotificationsRead(userId) {
      if (this.pool) {
        const result = await this.pool.query(`
          UPDATE in_app_notifications
          SET read = TRUE, read_at = NOW()
          WHERE user_id = $1 AND read = FALSE
          RETURNING id
        `, [userId])
        return { markedCount: result.rows.length }
      }

      // JSON fallback
      return this.markAllNotificationsReadJSON(userId)
    },

    // Dismiss a notification
    async dismissNotification(notificationId, userId) {
      if (this.pool) {
        const result = await this.pool.query(`
          UPDATE in_app_notifications
          SET dismissed = TRUE, dismissed_at = NOW()
          WHERE id = $1 AND user_id = $2
          RETURNING *
        `, [notificationId, userId])
        return result.rows[0]
      }

      // JSON fallback
      return this.dismissNotificationJSON(notificationId, userId)
    },

    // Dismiss all notifications for a user
    async dismissAllNotifications(userId) {
      if (this.pool) {
        const result = await this.pool.query(`
          UPDATE in_app_notifications
          SET dismissed = TRUE, dismissed_at = NOW()
          WHERE user_id = $1 AND dismissed = FALSE
          RETURNING id
        `, [userId])
        return { dismissedCount: result.rows.length }
      }

      // JSON fallback
      return this.dismissAllNotificationsJSON(userId)
    },

    async dismissBookmarkSavedNotifications(userId, { url, updateId } = {}) {
      const normalizedUrl = url != null ? String(url).trim() : ''
      const normalizedUpdateId = updateId != null ? String(updateId).trim() : ''

      if (!normalizedUrl && !normalizedUpdateId) {
        return { dismissedCount: 0 }
      }

      if (this.pool) {
        const params = [userId, normalizedUrl || null, normalizedUpdateId || null]
        const result = await this.pool.query(`
          UPDATE in_app_notifications
          SET dismissed = TRUE, dismissed_at = NOW()
          WHERE user_id = $1
            AND dismissed = FALSE
            AND type = 'bookmark_saved'
            AND (reference_type = 'bookmark' OR reference_type IS NULL)
            AND (
              ($2 IS NOT NULL AND reference_id = $2)
              OR ($3 IS NOT NULL AND reference_id = $3)
              OR ($2 IS NOT NULL AND metadata ->> 'url' = $2)
            )
          RETURNING id
        `, params)
        return { dismissedCount: result.rows.length }
      }

      return this.dismissBookmarkSavedNotificationsJSON(userId, {
        url: normalizedUrl || null,
        updateId: normalizedUpdateId || null
      })
    },

    // Delete old notifications (cleanup job)
    async cleanupOldNotifications(daysOld = 30) {
      if (this.pool) {
        const result = await this.pool.query(`
          DELETE FROM in_app_notifications
          WHERE (dismissed = TRUE AND dismissed_at < NOW() - INTERVAL '${daysOld} days')
          OR (read = TRUE AND created_at < NOW() - INTERVAL '${daysOld * 2} days')
          OR (expires_at IS NOT NULL AND expires_at < NOW() - INTERVAL '7 days')
          RETURNING id
        `)
        return { deletedCount: result.rows.length }
      }

      // JSON fallback
      return this.cleanupOldNotificationsJSON(daysOld)
    },

    // ==================== Helper Methods for Creating Specific Notification Types ====================

    // Create watch list match notification
    async createWatchListMatchNotification(userId, watchListName, matchedUpdate, matchScore) {
      const updateId = matchedUpdate && matchedUpdate.id != null ? String(matchedUpdate.id) : ''
      const watchListId = matchedUpdate && matchedUpdate.watchListId != null ? String(matchedUpdate.watchListId) : null
      const referenceId = watchListId ? `${watchListId}:${updateId}` : updateId

      return this.createNotification(userId, {
        type: 'watch_list_match',
        title: `New match in "${watchListName}"`,
        message: `"${matchedUpdate.title}" matches your fine monitor criteria (${Math.round(matchScore * 100)}% match)`,
        priority: matchScore >= 0.8 ? 'high' : 'normal',
        actionUrl: watchListId ? `/watch-lists?openMatches=${encodeURIComponent(watchListId)}` : `/update/${encodeURIComponent(updateId)}`,
        actionLabel: watchListId ? 'View Matches' : 'View Update',
        referenceType: 'watch_list_match',
        referenceId,
        metadata: {
          watchListId,
          updateId,
          watchListName,
          matchScore,
          updateTitle: matchedUpdate.title
        }
      })
    },

    // Create policy review reminder notification
    async createPolicyReviewReminder(userId, policy, daysUntilReview) {
      const urgency = daysUntilReview <= 7 ? 'urgent' : daysUntilReview <= 14 ? 'high' : 'normal'
      return this.createNotification(userId, {
        type: 'policy_review_due',
        title: `Policy review ${daysUntilReview <= 0 ? 'overdue' : 'upcoming'}`,
        message: `"${policy.title}" is ${daysUntilReview <= 0 ? 'overdue for review' : `due for review in ${daysUntilReview} days`}`,
        priority: urgency,
        actionUrl: `/policies/${policy.id}`,
        actionLabel: 'Review Policy',
        referenceType: 'policy',
        referenceId: policy.id,
        metadata: {
          policyTitle: policy.title,
          daysUntilReview,
          nextReviewDate: policy.next_review_date
        }
      })
    },

    // Create policy approval request notification
    async createPolicyApprovalRequest(userId, policy, version, requestedBy) {
      return this.createNotification(userId, {
        type: 'policy_approval_request',
        title: 'Policy approval requested',
        message: `Version ${version.version_number} of "${policy.title}" is awaiting your approval`,
        priority: 'high',
        actionUrl: `/policies/${policy.id}/versions/${version.id}`,
        actionLabel: 'Review & Approve',
        referenceType: 'policy_version',
        referenceId: version.id,
        metadata: {
          policyTitle: policy.title,
          versionNumber: version.version_number,
          requestedBy
        }
      })
    },

    // Create policy approved notification
    async createPolicyApprovedNotification(userId, policy, version, approvedBy) {
      return this.createNotification(userId, {
        type: 'policy_approved',
        title: 'Policy version approved',
        message: `Version ${version.version_number} of "${policy.title}" has been approved by ${approvedBy}`,
        priority: 'normal',
        actionUrl: `/policies/${policy.id}`,
        actionLabel: 'View Policy',
        referenceType: 'policy_version',
        referenceId: version.id,
        metadata: {
          policyTitle: policy.title,
          versionNumber: version.version_number,
          approvedBy
        }
      })
    },

    // Create workflow stage change notification
    async createStageChangeNotification(userId, item, oldStage, newStage) {
      return this.createNotification(userId, {
        type: 'workflow_stage_change',
        title: 'Item moved to new stage',
        message: `"${item.title}" moved from "${oldStage}" to "${newStage}"`,
        priority: 'low',
        actionUrl: `/kanban?openItemId=${encodeURIComponent(item.id)}`,
        actionLabel: 'View in Kanban',
        referenceType: 'regulatory_change_item',
        referenceId: String(item.id),
        metadata: {
          itemTitle: item.title,
          oldStage,
          newStage
        }
      })
    },

    // ==================== JSON Fallback Methods ====================

    async loadNotificationsData() {
      try {
        const data = await fs.readFile(this.notificationsFile, 'utf8')
        return JSON.parse(data)
      } catch (error) {
        if (error.code === 'ENOENT') {
          return []
        }
        throw error
      }
    },

    async saveNotificationsData(notifications) {
      await fs.writeFile(this.notificationsFile, JSON.stringify(notifications, null, 2))
    },

    async getNotificationsJSON(userId, filters = {}) {
      const { unreadOnly, type, limit = 50, offset = 0, includeDismissed = false } = filters
      let notifications = await this.loadNotificationsData()

      // Filter by user
      notifications = notifications.filter(n => n.user_id === userId)

      // Filter out dismissed unless requested
      if (!includeDismissed) {
        notifications = notifications.filter(n => !n.dismissed)
      }

      // Filter unread only
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.read)
      }

      // Filter by type
      if (type) {
        notifications = notifications.filter(n => n.type === type)
      }

      // Filter out expired
      const now = new Date()
      notifications = notifications.filter(n => !n.expires_at || new Date(n.expires_at) > now)

      // Sort: unread first, then by priority, then by created_at
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
      notifications.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1
        if (a.priority !== b.priority) {
          return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })

      // Apply pagination
      return notifications.slice(offset, offset + limit)
    },

    async createNotificationJSON(userId, data) {
      const notifications = await this.loadNotificationsData()
      const normalizedReferenceType = data.referenceType != null && String(data.referenceType).trim()
        ? String(data.referenceType).trim()
        : null
      const normalizedReferenceId = data.referenceId != null && String(data.referenceId).trim()
        ? String(data.referenceId).trim()
        : null
      const shouldDedupe = data.type === 'watch_list_match' &&
        normalizedReferenceType === 'watch_list_match' &&
        normalizedReferenceId
      const now = new Date().toISOString()

      if (shouldDedupe) {
        const existingIndex = notifications.findIndex(n =>
          n.user_id === userId &&
          n.type === data.type &&
          n.reference_type === normalizedReferenceType &&
          String(n.reference_id || '') === normalizedReferenceId
        )
        if (existingIndex >= 0) {
          const existing = notifications[existingIndex]
          const next = {
            ...existing,
            title: data.title,
            message: data.message || null,
            priority: data.priority || existing.priority || 'normal',
            read: false,
            read_at: null,
            dismissed: false,
            dismissed_at: null,
            action_url: data.actionUrl || existing.action_url || null,
            action_label: data.actionLabel || existing.action_label || null,
            metadata: data.metadata || existing.metadata || {},
            expires_at: data.expiresAt || existing.expires_at || null,
            created_at: now
          }
          notifications[existingIndex] = next
          await this.saveNotificationsData(notifications)
          return next
        }
      }

      const notification = {
        id: require('crypto').randomUUID(),
        user_id: userId,
        type: data.type,
        title: data.title,
        message: data.message || null,
        priority: data.priority || 'normal',
        read: false,
        read_at: null,
        dismissed: false,
        dismissed_at: null,
        action_url: data.actionUrl || null,
        action_label: data.actionLabel || null,
        reference_type: normalizedReferenceType,
        reference_id: normalizedReferenceId,
        metadata: data.metadata || {},
        expires_at: data.expiresAt || null,
        created_at: now
      }

      notifications.push(notification)
      await this.saveNotificationsData(notifications)
      return notification
    },

    async markNotificationReadJSON(notificationId, userId) {
      const notifications = await this.loadNotificationsData()
      const index = notifications.findIndex(n => n.id === notificationId && n.user_id === userId)

      if (index === -1) return null

      notifications[index].read = true
      notifications[index].read_at = new Date().toISOString()
      await this.saveNotificationsData(notifications)
      return notifications[index]
    },

    async markAllNotificationsReadJSON(userId) {
      const notifications = await this.loadNotificationsData()
      let markedCount = 0

      notifications.forEach(n => {
        if (n.user_id === userId && !n.read) {
          n.read = true
          n.read_at = new Date().toISOString()
          markedCount++
        }
      })

      await this.saveNotificationsData(notifications)
      return { markedCount }
    },

    async dismissNotificationJSON(notificationId, userId) {
      const notifications = await this.loadNotificationsData()
      const index = notifications.findIndex(n => n.id === notificationId && n.user_id === userId)

      if (index === -1) return null

      notifications[index].dismissed = true
      notifications[index].dismissed_at = new Date().toISOString()
      await this.saveNotificationsData(notifications)
      return notifications[index]
    },

    async dismissAllNotificationsJSON(userId) {
      const notifications = await this.loadNotificationsData()
      let dismissedCount = 0

      notifications.forEach(n => {
        if (n.user_id === userId && !n.dismissed) {
          n.dismissed = true
          n.dismissed_at = new Date().toISOString()
          dismissedCount++
        }
      })

      await this.saveNotificationsData(notifications)
      return { dismissedCount }
    },

    async dismissBookmarkSavedNotificationsJSON(userId, { url, updateId } = {}) {
      const normalizedUrl = url != null ? String(url).trim() : ''
      const normalizedUpdateId = updateId != null ? String(updateId).trim() : ''

      if (!normalizedUrl && !normalizedUpdateId) {
        return { dismissedCount: 0 }
      }

      const notifications = await this.loadNotificationsData()
      let dismissedCount = 0
      const now = new Date().toISOString()

      notifications.forEach(n => {
        if (!n || typeof n !== 'object') return
        if (n.user_id !== userId) return
        if (n.dismissed) return
        if (n.type !== 'bookmark_saved') return
        if (n.reference_type && n.reference_type !== 'bookmark') return

        const referenceId = n.reference_id != null ? String(n.reference_id) : ''
        const metaUrl = n.metadata && typeof n.metadata === 'object' ? n.metadata.url : null
        const matches = (normalizedUrl && (referenceId === normalizedUrl || metaUrl === normalizedUrl)) ||
          (normalizedUpdateId && referenceId === normalizedUpdateId)

        if (!matches) return

        n.dismissed = true
        n.dismissed_at = now
        dismissedCount++
      })

      if (dismissedCount > 0) {
        await this.saveNotificationsData(notifications)
      }
      return { dismissedCount }
    },

    async cleanupOldNotificationsJSON(daysOld = 30) {
      const notifications = await this.loadNotificationsData()
      const cutoffDismissed = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
      const cutoffRead = new Date(Date.now() - daysOld * 2 * 24 * 60 * 60 * 1000)
      const cutoffExpired = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const filtered = notifications.filter(n => {
        if (n.dismissed && new Date(n.dismissed_at) < cutoffDismissed) return false
        if (n.read && new Date(n.created_at) < cutoffRead) return false
        if (n.expires_at && new Date(n.expires_at) < cutoffExpired) return false
        return true
      })

      const deletedCount = notifications.length - filtered.length
      await this.saveNotificationsData(filtered)
      return { deletedCount }
    }
  })
}
