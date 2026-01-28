/**
 * Notification Service
 * Handles in-app notifications for watch list matches, policy reviews, and workflow updates
 */

const db = require('./dbService')

class NotificationService {
  /**
   * Get all notifications for a user
   */
  async getNotifications(userId, options = {}) {
    try {
      const notifications = await db.getNotifications(userId, options)
      return { success: true, data: notifications }
    } catch (error) {
      console.error('[NotificationService] Error getting notifications:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const count = await db.getUnreadNotificationCount(userId)
      return { success: true, data: { count } }
    } catch (error) {
      console.error('[NotificationService] Error getting unread count:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Mark a notification as read
   */
  async markRead(notificationId, userId) {
    try {
      const notification = await db.markNotificationRead(notificationId, userId)
      if (!notification) {
        return { success: false, error: 'Notification not found' }
      }
      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error marking read:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(userId) {
    try {
      const result = await db.markAllNotificationsRead(userId)
      return { success: true, data: result }
    } catch (error) {
      console.error('[NotificationService] Error marking all read:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Dismiss a notification
   */
  async dismiss(notificationId, userId) {
    try {
      const notification = await db.dismissNotification(notificationId, userId)
      if (!notification) {
        return { success: false, error: 'Notification not found' }
      }
      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error dismissing:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAll(userId) {
    try {
      const result = await db.dismissAllNotifications(userId)
      return { success: true, data: result }
    } catch (error) {
      console.error('[NotificationService] Error dismissing all:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a general notification
   */
  async createNotification(userId, data) {
    try {
      if (!data.type || !data.title) {
        return { success: false, error: 'Notification type and title are required' }
      }

      const notification = await db.createNotification(userId, {
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'normal',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        metadata: data.metadata || {},
        expiresAt: data.expiresAt
      })

      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a watch list match notification
   */
  async notifyWatchListMatch(userId, watchListName, matchedUpdate, matchScore) {
    try {
      const notification = await db.createWatchListMatchNotification(
        userId,
        watchListName,
        matchedUpdate,
        matchScore
      )
      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error creating watch list notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a policy review reminder notification
   */
  async notifyPolicyReviewDue(userId, policy, daysUntilReview) {
    try {
      const notification = await db.createPolicyReviewReminder(userId, policy, daysUntilReview)
      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error creating policy review notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a policy approval request notification
   */
  async notifyApprovalRequest(userId, policy, version, requestedBy) {
    try {
      const notification = await db.createPolicyApprovalRequest(
        userId,
        policy,
        version,
        requestedBy
      )
      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error creating approval request notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a policy approved notification
   */
  async notifyPolicyApproved(userId, policy, version, approvedBy) {
    try {
      const notification = await db.createPolicyApprovedNotification(
        userId,
        policy,
        version,
        approvedBy
      )
      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error creating policy approved notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a workflow stage change notification
   */
  async notifyStageChange(userId, item, oldStage, newStage) {
    try {
      const notification = await db.createStageChangeNotification(
        userId,
        item,
        oldStage,
        newStage
      )
      return { success: true, data: notification }
    } catch (error) {
      console.error('[NotificationService] Error creating stage change notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanup(daysOld = 30) {
    try {
      const result = await db.cleanupOldNotifications(daysOld)
      return { success: true, data: result }
    } catch (error) {
      console.error('[NotificationService] Error cleaning up:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get notification summary for user (for header/badge display)
   */
  async getSummary(userId) {
    try {
      const unreadCount = await db.getUnreadNotificationCount(userId)
      const recentNotifications = await db.getNotifications(userId, { limit: 5, unreadOnly: true })

      // Group by type
      const byType = {}
      for (const n of recentNotifications) {
        byType[n.type] = (byType[n.type] || 0) + 1
      }

      return {
        success: true,
        data: {
          unreadCount,
          recentNotifications,
          byType,
          hasUrgent: recentNotifications.some(n => n.priority === 'urgent')
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error getting summary:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Bulk create notifications (for system events affecting multiple users)
   */
  async bulkNotify(userIds, data) {
    try {
      const results = { created: 0, errors: [] }

      for (const userId of userIds) {
        try {
          await db.createNotification(userId, data)
          results.created++
        } catch (error) {
          results.errors.push({ userId, error: error.message })
        }
      }

      return { success: true, data: results }
    } catch (error) {
      console.error('[NotificationService] Error bulk notifying:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get notifications by reference (e.g., all notifications related to a specific policy)
   */
  async getByReference(userId, referenceType, referenceId) {
    try {
      const allNotifications = await db.getNotifications(userId, { includeDismissed: true })
      const filtered = allNotifications.filter(
        n => n.reference_type === referenceType && String(n.reference_id) === String(referenceId)
      )
      return { success: true, data: filtered }
    } catch (error) {
      console.error('[NotificationService] Error getting by reference:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // ENFORCEMENT NOTIFICATIONS
  // ============================================

  /**
   * Create notification for new FCA enforcement fine
   * Broadcasts to all users (system notification)
   */
  async notifyNewEnforcementFine(fine) {
    try {
      const isLargeFine = fine.amount >= 1000000 // £1M threshold
      const priority = isLargeFine ? 'high' : 'normal'

      const amountFormatted = fine.amount
        ? `£${(fine.amount / 1000000).toFixed(1)}M`
        : fine.amount_text || 'undisclosed amount'

      const notification = {
        type: 'enforcement_fine',
        title: `New FCA Fine: ${fine.firm_individual}`,
        message: `${fine.firm_individual} fined ${amountFormatted} for ${fine.breach_type || 'regulatory breach'}`,
        priority,
        actionUrl: `/enforcement?firm=${encodeURIComponent(fine.firm_individual)}`,
        actionLabel: 'View Details',
        referenceType: 'fca_fine',
        referenceId: fine.id,
        metadata: {
          fineId: fine.id,
          firmName: fine.firm_individual,
          amount: fine.amount,
          amountText: fine.amount_text,
          breachType: fine.breach_type,
          breachCategories: fine.breach_categories,
          dateIssued: fine.date_issued,
          isLargeFine
        }
      }

      // Create system-wide notification (userId = 'system' for all users)
      const result = await db.createNotification('system', notification)

      console.log(`📢 Enforcement notification created: ${fine.firm_individual} - ${amountFormatted}`)
      return { success: true, data: result }
    } catch (error) {
      console.error('[NotificationService] Error creating enforcement notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check if a new fine matches any watch lists and notify
   */
  async checkEnforcementWatchListMatch(fine) {
    try {
      // Get all watch lists that might match this fine
      const watchLists = await db.getAllActiveWatchLists()
      const matches = []

      for (const watchList of watchLists) {
        const criteria = watchList.criteria || {}
        let isMatch = false
        let matchReason = []

        // Check firm name match
        if (criteria.firms && Array.isArray(criteria.firms)) {
          const firmMatch = criteria.firms.some(f =>
            fine.firm_individual.toLowerCase().includes(f.toLowerCase())
          )
          if (firmMatch) {
            isMatch = true
            matchReason.push('Firm name match')
          }
        }

        // Check keywords match
        if (criteria.keywords && Array.isArray(criteria.keywords)) {
          const content = `${fine.firm_individual} ${fine.summary || ''} ${fine.breach_type || ''}`.toLowerCase()
          const keywordMatch = criteria.keywords.some(k => content.includes(k.toLowerCase()))
          if (keywordMatch) {
            isMatch = true
            matchReason.push('Keyword match')
          }
        }

        // Check breach category match
        if (criteria.breachCategories && Array.isArray(criteria.breachCategories) && fine.breach_categories) {
          const fineCategories = Array.isArray(fine.breach_categories)
            ? fine.breach_categories
            : JSON.parse(fine.breach_categories || '[]')
          const categoryMatch = criteria.breachCategories.some(c =>
            fineCategories.some(fc => fc.toLowerCase().includes(c.toLowerCase()))
          )
          if (categoryMatch) {
            isMatch = true
            matchReason.push('Breach category match')
          }
        }

        // Check amount threshold
        if (criteria.minAmount && fine.amount >= criteria.minAmount) {
          isMatch = true
          matchReason.push(`Amount exceeds £${(criteria.minAmount / 1000000).toFixed(1)}M threshold`)
        }

        if (isMatch && watchList.user_id) {
          matches.push({ watchList, matchReason })

          // Create notification for watch list owner
          await db.createNotification(watchList.user_id, {
            type: 'enforcement_watch_match',
            title: `Fine Monitor Alert: ${watchList.name}`,
            message: `New FCA fine matches your fine monitor: ${fine.firm_individual} - ${matchReason.join(', ')}`,
            priority: 'high',
            actionUrl: `/enforcement?firm=${encodeURIComponent(fine.firm_individual)}`,
            actionLabel: 'View Fine',
            referenceType: 'fca_fine',
            referenceId: fine.id,
            metadata: {
              watchListId: watchList.id,
              watchListName: watchList.name,
              fineId: fine.id,
              firmName: fine.firm_individual,
              matchReason,
              amount: fine.amount
            }
          })
        }
      }

      if (matches.length > 0) {
        console.log(`🔔 Enforcement fine matched ${matches.length} watch list(s)`)
      }

      return { success: true, data: { matches: matches.length } }
    } catch (error) {
      console.error('[NotificationService] Error checking watch list match:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Notify about large fine (>threshold)
   */
  async notifyLargeFine(fine, threshold = 5000000) {
    if (fine.amount < threshold) return { success: true, skipped: true }

    try {
      const amountFormatted = `£${(fine.amount / 1000000).toFixed(1)}M`

      const notification = {
        type: 'enforcement_large_fine',
        title: `Major Fine Alert: ${amountFormatted}`,
        message: `${fine.firm_individual} received a significant fine of ${amountFormatted} - one of the largest this year`,
        priority: 'urgent',
        actionUrl: `/enforcement?firm=${encodeURIComponent(fine.firm_individual)}`,
        actionLabel: 'View Details',
        referenceType: 'fca_fine',
        referenceId: fine.id,
        metadata: {
          fineId: fine.id,
          firmName: fine.firm_individual,
          amount: fine.amount,
          threshold
        }
      }

      const result = await db.createNotification('system', notification)
      console.log(`🚨 Large fine notification: ${fine.firm_individual} - ${amountFormatted}`)
      return { success: true, data: result }
    } catch (error) {
      console.error('[NotificationService] Error creating large fine notification:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get enforcement notification summary
   */
  async getEnforcementSummary(userId) {
    try {
      const notifications = await db.getNotifications(userId, {
        types: ['enforcement_fine', 'enforcement_watch_match', 'enforcement_large_fine'],
        limit: 20
      })

      const unread = notifications.filter(n => !n.read_at)
      const highPriority = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent')

      return {
        success: true,
        data: {
          total: notifications.length,
          unread: unread.length,
          highPriority: highPriority.length,
          recent: notifications.slice(0, 5)
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error getting enforcement summary:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = new NotificationService()
