/**
 * Auth API Routes
 * Handles magic link authentication endpoints
 */

const authService = require('../../services/authService')
const { setSessionCookie, clearSessionCookie, SESSION_COOKIE_NAME } = require('../../middleware/authMiddleware')

function registerAuthRoutes(router) {
  /**
   * POST /api/auth/magic-link
   * Request a magic link email
   */
  router.post('/auth/magic-link', async (req, res) => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        })
      }

      const result = await authService.requestMagicLink(email)

      return res.json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Magic link request error:', error.message)
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to send magic link'
      })
    }
  })

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  router.get('/auth/me', async (req, res) => {
    try {
      if (req.user && req.isAuthenticated) {
        return res.json({
          success: true,
          user: {
            id: req.user.id,
            email: req.user.email
          },
          isAuthenticated: true
        })
      }

      return res.json({
        success: true,
        user: null,
        isAuthenticated: false
      })
    } catch (error) {
      console.error('Get user error:', error.message)
      return res.status(500).json({
        success: false,
        error: 'Failed to get user info'
      })
    }
  })

  /**
   * POST /api/auth/logout
   * Logout and destroy session
   */
  router.post('/auth/logout', async (req, res) => {
    try {
      const sessionToken = req.cookies?.[SESSION_COOKIE_NAME]

      if (sessionToken) {
        await authService.logout(sessionToken)
      }

      clearSessionCookie(res)

      return res.json({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (error) {
      console.error('Logout error:', error.message)
      // Clear cookie even on error
      clearSessionCookie(res)
      return res.json({
        success: true,
        message: 'Logged out'
      })
    }
  })
}

module.exports = registerAuthRoutes
