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
}

module.exports = new NotificationService()
