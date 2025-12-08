/**
 * Auth Middleware
 * Handles session validation and user identification
 */

const authService = require('../services/authService')

// Cookie configuration
const SESSION_COOKIE_NAME = 'rc_session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
}

/**
 * Optional auth middleware
 * Populates req.user if valid session exists, but doesn't require auth
 * Use this on routes that work for both logged-in and anonymous users
 */
async function optionalAuth(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME]

    if (sessionToken) {
      const result = await authService.validateSession(sessionToken)
      if (result && result.user) {
        req.user = result.user
        req.isAuthenticated = true
      }
    }

    // If no session, check for legacy x-user-id header (backward compatibility)
    if (!req.user) {
      const headerUserId = req.headers['x-user-id']
      if (headerUserId && typeof headerUserId === 'string' && headerUserId.trim()) {
        req.user = {
          id: headerUserId.trim(),
          email: null,
          isLegacyHeader: true
        }
      }
    }

    req.isAuthenticated = req.isAuthenticated || false
  } catch (error) {
    console.error('Auth middleware error:', error.message)
    // Continue without auth on error
  }

  next()
}

/**
 * Required auth middleware
 * Redirects to login page if not authenticated
 * Use this on routes that require authentication
 */
async function requireAuth(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME]

    if (!sessionToken) {
      return redirectToLogin(req, res)
    }

    const result = await authService.validateSession(sessionToken)
    if (!result || !result.user) {
      // Clear invalid session cookie
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
      return redirectToLogin(req, res)
    }

    req.user = result.user
    req.isAuthenticated = true
    next()
  } catch (error) {
    console.error('Auth middleware error:', error.message)
    return redirectToLogin(req, res)
  }
}

/**
 * Required auth middleware for API routes
 * Returns 401 instead of redirecting
 */
async function requireAuthAPI(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME]

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    const result = await authService.validateSession(sessionToken)
    if (!result || !result.user) {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
      return res.status(401).json({
        success: false,
        error: 'Session expired'
      })
    }

    req.user = result.user
    req.isAuthenticated = true
    next()
  } catch (error) {
    console.error('Auth middleware error:', error.message)
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    })
  }
}

/**
 * Redirect to login with return URL
 */
function redirectToLogin(req, res) {
  const returnUrl = encodeURIComponent(req.originalUrl)
  res.redirect(`/login?returnUrl=${returnUrl}`)
}

/**
 * Set session cookie
 */
function setSessionCookie(res, sessionToken) {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, COOKIE_OPTIONS)
}

/**
 * Clear session cookie
 */
function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
}

/**
 * Resolve user ID from request
 * Works with both authenticated users and legacy header-based identification
 */
function resolveUserId(req) {
  // Priority 1: Authenticated session user
  if (req.user && req.user.id) {
    return String(req.user.id)
  }

  // Priority 2: Legacy x-user-id header
  const headerUser = req.headers['x-user-id']
  if (headerUser && typeof headerUser === 'string' && headerUser.trim()) {
    return headerUser.trim()
  }

  // Default
  return 'default'
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireAuthAPI,
  setSessionCookie,
  clearSessionCookie,
  resolveUserId,
  SESSION_COOKIE_NAME,
  COOKIE_OPTIONS
}
