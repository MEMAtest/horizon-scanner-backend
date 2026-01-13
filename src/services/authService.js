/**
 * Auth Service
 * Handles magic link authentication flow
 */

const dbService = require('./dbService')
const { sendEmail } = require('./email/sesClient')

const MAGIC_LINK_BASE_URL = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000'

/**
 * Request a magic link for email login
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function requestMagicLink(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required')
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Basic email validation
  if (!normalizedEmail.includes('@') || normalizedEmail.length < 5) {
    throw new Error('Invalid email address')
  }

  // Create magic link token
  const { token, expiresAt } = await dbService.createMagicLinkToken(normalizedEmail)

  // Build magic link URL
  const magicLinkUrl = `${MAGIC_LINK_BASE_URL}/auth/verify?token=${token}`

  // Send email
  const emailContent = buildMagicLinkEmail(normalizedEmail, magicLinkUrl)

  try {
    await sendEmail({
      to: [normalizedEmail],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })

    console.log(`✉️ Magic link sent to ${normalizedEmail}`)
    return { success: true, message: 'Check your email for the login link' }
  } catch (error) {
    console.error('❌ Email send error:', {
      message: error.message,
      email: normalizedEmail,
      from: process.env.DIGEST_FROM_EMAIL || 'not-set',
      apiKey: process.env.RESEND_API_KEY ? 'set' : 'missing'
    })
    throw new Error('Failed to send login email. Please try again.')
  }
}

/**
 * Verify a magic link token and create session
 * @param {string} token - Magic link token
 * @returns {Promise<{user: object, session: object} | null>}
 */
async function verifyMagicLink(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  // Verify token
  const result = await dbService.verifyMagicLinkToken(token)
  if (!result || !result.valid) {
    return null
  }

  // Get or create user
  const user = await dbService.getOrCreateUser(result.email)
  if (!user) {
    return null
  }

  // Update last login
  await dbService.updateLastLogin(user.id)

  // Create session
  const session = await dbService.createSession(user.id)

  return { user, session }
}

/**
 * Validate a session token
 * @param {string} sessionToken - Session token from cookie
 * @returns {Promise<{user: object} | null>}
 */
async function validateSession(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') {
    return null
  }

  const session = await dbService.getSessionByToken(sessionToken)
  if (!session) {
    return null
  }

  return {
    user: {
      id: session.userId,
      email: session.email
    }
  }
}

/**
 * Logout - destroy session
 * @param {string} sessionToken - Session token to destroy
 * @returns {Promise<boolean>}
 */
async function logout(sessionToken) {
  if (!sessionToken) {
    return false
  }

  return dbService.destroySession(sessionToken)
}

/**
 * Build magic link email content
 */
function buildMagicLinkEmail(email, magicLinkUrl) {
  const subject = 'Log in to RegCanary'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Log in to RegCanary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">
                RegCanary
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">
                Regulatory Intelligence Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                Click the button below to log in to your account. This link will expire in 15 minutes.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${magicLinkUrl}"
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                      Log in to RegCanary
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                If you didn't request this email, you can safely ignore it.
              </p>

              <!-- Link fallback -->
              <p style="margin: 24px 0 0; padding: 16px; background-color: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280; word-break: break-all;">
                Or copy this link:<br>
                <a href="${magicLinkUrl}" style="color: #3b82f6;">${magicLinkUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                RegCanary - UK Financial Regulatory Intelligence
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `
Log in to RegCanary

Click the link below to log in to your account. This link will expire in 15 minutes.

${magicLinkUrl}

If you didn't request this email, you can safely ignore it.

---
RegCanary - UK Financial Regulatory Intelligence
`

  return { subject, html, text }
}

module.exports = {
  requestMagicLink,
  verifyMagicLink,
  validateSession,
  logout
}
