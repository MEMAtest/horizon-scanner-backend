const notificationService = require('../../services/notificationService')

/**
 * Register notification routes
 * @param {import('express').Router} router
 */
function registerNotificationRoutes(router) {
  // GET /api/notifications - Get all notifications
  router.get('/notifications', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.getNotifications(userId, {
        unreadOnly: req.query.unreadOnly === 'true',
        type: req.query.type,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        includeDismissed: req.query.includeDismissed === 'true'
      })
      res.json(result)
    } catch (error) {
      console.error('Error getting notifications:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/notifications/unread-count - Get unread count
  router.get('/notifications/unread-count', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.getUnreadCount(userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting unread count:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/notifications/summary - Get notification summary (for header badge)
  router.get('/notifications/summary', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.getSummary(userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting notification summary:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/notifications/:id/read - Mark notification as read
  router.post('/notifications/:id/read', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.markRead(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error marking notification read:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/notifications/mark-all-read - Mark all notifications as read
  router.post('/notifications/mark-all-read', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.markAllRead(userId)
      res.json(result)
    } catch (error) {
      console.error('Error marking all read:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/notifications/:id/dismiss - Dismiss notification
  router.post('/notifications/:id/dismiss', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.dismiss(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error dismissing notification:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/notifications/dismiss-all - Dismiss all notifications
  router.post('/notifications/dismiss-all', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.dismissAll(userId)
      res.json(result)
    } catch (error) {
      console.error('Error dismissing all:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/notifications - Create a notification (for internal/system use)
  router.post('/notifications', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await notificationService.createNotification(userId, req.body)
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/notifications/cleanup - Cleanup old notifications
  router.post('/notifications/cleanup', async (req, res) => {
    try {
      const daysOld = parseInt(req.query.days) || 30
      const result = await notificationService.cleanup(daysOld)
      res.json(result)
    } catch (error) {
      console.error('Error cleaning up notifications:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerNotificationRoutes
